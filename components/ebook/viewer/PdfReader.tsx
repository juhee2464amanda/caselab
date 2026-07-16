'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// 워커는 public/ 정적 파일로 서빙 (postinstall이 pdfjs-dist 버전과 동기화).
// new URL('pdfjs-dist/...', import.meta.url) 패턴은 Next webpack에서 pdfjs 모듈을
// 깨뜨림(defineProperty on non-object) — 정적 경로가 안전하다.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export interface OutlineItem {
  title: string;
  page: number;
  depth: number;
}

interface PdfReaderProps {
  fileUrl: string;
  mode: 'scroll' | 'page';
  /** 현재 페이지 (부모 제어). 스크롤 모드에선 onPageChange로 보고된 값과 동기화됨 */
  page: number;
  zoom: number;
  dark: boolean;
  onDocLoad: (info: { numPages: number; outline: OutlineItem[] }) => void;
  onPageChange: (page: number) => void;
}

/** PDF 내장 outline → {제목, 페이지} 평탄화 (2단계까지) */
async function flattenOutline(
  pdf: PDFDocumentProxy,
  items: Awaited<ReturnType<PDFDocumentProxy['getOutline']>>,
  depth: number,
  out: OutlineItem[]
): Promise<void> {
  if (!items) return;
  for (const it of items) {
    try {
      let dest = it.dest;
      if (typeof dest === 'string') dest = await pdf.getDestination(dest);
      if (Array.isArray(dest) && dest[0]) {
        const idx = await pdf.getPageIndex(dest[0]);
        out.push({ title: it.title, page: idx + 1, depth });
      }
    } catch {
      // 깨진 outline 항목은 건너뜀
    }
    if (it.items?.length && depth < 1) await flattenOutline(pdf, it.items, depth + 1, out);
  }
}

/**
 * react-pdf(PDF.js) 렌더러.
 * - 스크롤 모드: 전 페이지 래퍼 + 현재 페이지 ±2만 실제 렌더(윈도잉), IntersectionObserver로 현재 페이지 보고
 * - 페이지 모드: 단일 페이지 + 좌우 이동
 * - 텍스트/주석 레이어 비활성 — 복사 방지 겸 렌더 비용 절감 (검색·하이라이트는 v2에서 재검토)
 */
export default function PdfReader({
  fileUrl,
  mode,
  page,
  zoom,
  dark,
  onDocLoad,
  onPageChange,
}: PdfReaderProps) {
  const [numPages, setNumPages] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(1.414); // A4 기본값, 1페이지 로드 후 실측
  const [containerWidth, setContainerWidth] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const ratios = useRef<Map<number, number>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastReported = useRef(page);

  const options = useMemo(
    () => ({ cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/` }),
    []
  );
  const file = useMemo(() => ({ url: fileUrl }), [fileUrl]);

  const pageWidth = Math.max(
    280,
    Math.round(Math.min(containerWidth - 32, 860) * zoom)
  );
  const pageHeight = Math.round(pageWidth * aspectRatio);

  // 컨테이너 폭 추적 (줌·반응형)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const handleLoadSuccess = useCallback(
    async (pdf: PDFDocumentProxy) => {
      setNumPages(pdf.numPages);
      try {
        const first = await pdf.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        setAspectRatio(vp.height / vp.width);
      } catch {
        // 기본 비율 유지
      }
      const outline: OutlineItem[] = [];
      try {
        await flattenOutline(pdf, await pdf.getOutline(), 0, outline);
      } catch {
        // outline 없는 PDF
      }
      onDocLoad({ numPages: pdf.numPages, outline });
    },
    [onDocLoad]
  );

  // 스크롤 모드: 화면에 가장 크게 보이는 페이지를 현재 페이지로 보고
  useEffect(() => {
    if (mode !== 'scroll' || numPages === 0) return;
    const root = scrollRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const p = Number(e.target.getAttribute('data-page'));
          ratios.current.set(p, e.isIntersecting ? e.intersectionRatio : 0);
        }
        let bestPage = 0;
        let bestRatio = 0;
        ratios.current.forEach((r, p) => {
          if (r > bestRatio) {
            bestRatio = r;
            bestPage = p;
          }
        });
        if (bestPage > 0 && bestPage !== lastReported.current) {
          lastReported.current = bestPage;
          onPageChange(bestPage);
        }
      },
      { root, threshold: [0, 0.1, 0.3, 0.5, 0.7, 0.9] }
    );
    observerRef.current = io;
    pageRefs.current.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      observerRef.current = null;
      ratios.current.clear();
    };
  }, [mode, numPages, onPageChange]);

  const registerPageRef = useCallback((p: number, el: HTMLDivElement | null) => {
    if (el) {
      pageRefs.current.set(p, el);
      observerRef.current?.observe(el);
    } else {
      const prev = pageRefs.current.get(p);
      if (prev) observerRef.current?.unobserve(prev);
      pageRefs.current.delete(p);
    }
  }, []);

  // 부모發 페이지 점프 (목차/북마크/슬라이더/이어읽기 복원)
  useEffect(() => {
    if (mode !== 'scroll' || numPages === 0) return;
    if (page === lastReported.current) return;
    const el = pageRefs.current.get(page);
    if (el) {
      lastReported.current = page;
      el.scrollIntoView({ block: 'start' });
    }
  }, [page, mode, numPages]);

  const darkFilter = dark ? 'invert(0.92) hue-rotate(180deg)' : undefined;

  const loading = (
    <div className="flex h-full min-h-[60dvh] items-center justify-center gap-2 text-sm opacity-60">
      <Loader2 className="h-4 w-4 animate-spin" /> 전자책을 불러오는 중…
    </div>
  );

  return (
    <div
      ref={scrollRef}
      className={`h-full w-full overflow-y-auto overscroll-contain ${dark ? 'bg-neutral-900' : 'bg-neutral-200'}`}
    >
      <Document
        file={file}
        options={options}
        onLoadSuccess={handleLoadSuccess}
        loading={loading}
        error={
          <div className="flex h-full min-h-[60dvh] items-center justify-center text-sm opacity-60">
            전자책을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.
          </div>
        }
      >
        {mode === 'scroll' ? (
          <div className="flex flex-col items-center gap-3 py-4">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
              <div
                key={p}
                data-page={p}
                ref={(el) => registerPageRef(p, el)}
                className="shadow-card"
                style={{ width: pageWidth, minHeight: pageHeight, filter: darkFilter }}
              >
                {Math.abs(p - page) <= 2 ? (
                  <Page
                    pageNumber={p}
                    width={pageWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={<div style={{ width: pageWidth, height: pageHeight }} />}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="relative flex min-h-full items-center justify-center py-4">
            <div className="shadow-card" style={{ filter: darkFilter }}>
              <Page
                pageNumber={Math.min(Math.max(page, 1), Math.max(numPages, 1))}
                width={pageWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={<div style={{ width: pageWidth, height: pageHeight }} />}
              />
            </div>
            <button
              type="button"
              aria-label="이전 페이지"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className="fixed left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60 disabled:opacity-20"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="다음 페이지"
              disabled={numPages > 0 && page >= numPages}
              onClick={() => onPageChange(Math.min(numPages || page + 1, page + 1))}
              className="fixed right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60 disabled:opacity-20"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </Document>
    </div>
  );
}
