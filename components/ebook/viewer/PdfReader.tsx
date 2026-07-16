'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import 'react-pdf/dist/Page/TextLayer.css';

// 워커는 public/ 정적 파일로 서빙 (postinstall이 pdfjs-dist 버전과 동기화).
// new URL('pdfjs-dist/...', import.meta.url) 패턴은 Next webpack에서 pdfjs 모듈을
// 깨뜨림(defineProperty on non-object) — 정적 경로가 안전하다.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export interface OutlineItem {
  title: string;
  page: number;
  depth: number;
}

/** 페이지 기준 정규화 좌표 (0..1) */
export interface NormRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PageAnnotation {
  id: string;
  color: string;
  rects: NormRect[];
}

/** 드래그 선택 결과 — 플로팅 메뉴 표시용 */
export interface TextSelection {
  page: number;
  text: string;
  rects: NormRect[];
  /** 메뉴 앵커 (뷰포트 좌표) */
  anchor: { x: number; y: number };
}

export const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: 'rgba(250, 204, 21, 0.42)',
  green: 'rgba(74, 222, 128, 0.38)',
  pink: 'rgba(244, 114, 182, 0.36)',
};

interface PdfReaderProps {
  fileUrl: string;
  mode: 'scroll' | 'page';
  /** 현재 페이지 (부모 제어). 스크롤 모드에선 onPageChange로 보고된 값과 동기화됨 */
  page: number;
  zoom: number;
  dark: boolean;
  /** 페이지별 하이라이트 (page → annotations) */
  annotations: Map<number, PageAnnotation[]>;
  onDocLoad: (info: { numPages: number; outline: OutlineItem[] }) => void;
  onPageChange: (page: number) => void;
  /** 텍스트 드래그 선택/해제 — null이면 선택 해제(메뉴 닫기) */
  onTextSelected: (sel: TextSelection | null) => void;
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

/** 하이라이트 오버레이 — 텍스트 레이어 아래(z-index)라 선택을 방해하지 않고,
 *  다크모드 invert 필터 밖에 있어 색이 유지된다. 관리는 노트 패널에서. */
function HighlightOverlay({ items }: { items: PageAnnotation[] }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {items.map((a) =>
        a.rects.map((r, i) => (
          <div
            key={`${a.id}-${i}`}
            className="absolute rounded-[2px]"
            style={{
              left: `${r.x * 100}%`,
              top: `${r.y * 100}%`,
              width: `${r.w * 100}%`,
              height: `${r.h * 100}%`,
              background: HIGHLIGHT_COLORS[a.color] ?? HIGHLIGHT_COLORS.yellow,
            }}
          />
        ))
      )}
    </div>
  );
}

/**
 * react-pdf(PDF.js) 렌더러.
 * - 스크롤 모드: 전 페이지 래퍼 + 현재 페이지 ±2만 실제 렌더(윈도잉), IntersectionObserver로 현재 페이지 보고
 * - 페이지 모드: 단일 페이지 + 좌우 이동
 * - 텍스트 레이어 활성 — 드래그 선택 → 하이라이트/메모. 복사는 상위(EbookViewer)에서 차단
 */
export default function PdfReader({
  fileUrl,
  mode,
  page,
  zoom,
  dark,
  annotations,
  onDocLoad,
  onPageChange,
  onTextSelected,
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

  // 드래그 선택 감지 → 정규화 rect 계산 후 부모에 보고
  const reportSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      onTextSelected(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const startEl =
      range.startContainer instanceof Element
        ? range.startContainer
        : range.startContainer.parentElement;
    const pageEl = startEl?.closest('[data-page]') as HTMLElement | null;
    if (!pageEl) {
      onTextSelected(null);
      return;
    }
    const pageNum = Number(pageEl.getAttribute('data-page'));
    const pr = pageEl.getBoundingClientRect();
    const rects: NormRect[] = [];
    let last: DOMRect | null = null;
    for (const r of Array.from(range.getClientRects())) {
      if (r.width < 2 || r.height < 2) continue;
      // 페이지 경계 밖(다른 페이지에 걸친) 조각은 제외 — 단일 페이지로 제한
      if (r.top < pr.top - 2 || r.bottom > pr.bottom + 2) continue;
      rects.push({
        x: (r.left - pr.left) / pr.width,
        y: (r.top - pr.top) / pr.height,
        w: r.width / pr.width,
        h: r.height / pr.height,
      });
      last = r;
      if (rects.length >= 60) break; // 과도한 선택 방어
    }
    const text = sel.toString().trim();
    if (!rects.length || !text || !last) {
      onTextSelected(null);
      return;
    }
    onTextSelected({
      page: pageNum,
      text: text.slice(0, 1000),
      rects,
      anchor: { x: last.right, y: last.top },
    });
  }, [onTextSelected]);

  useEffect(() => {
    const handler = () => setTimeout(reportSelection, 10); // 선택 확정 후 계산
    document.addEventListener('mouseup', handler);
    document.addEventListener('touchend', handler);
    return () => {
      document.removeEventListener('mouseup', handler);
      document.removeEventListener('touchend', handler);
    };
  }, [reportSelection]);

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

  function renderPage(p: number) {
    return (
      <>
        {/* invert 필터는 캔버스/텍스트레이어에만 — 하이라이트는 필터 밖이라 색 유지 */}
        <div style={{ filter: darkFilter }}>
          <Page
            pageNumber={p}
            width={pageWidth}
            renderTextLayer
            renderAnnotationLayer={false}
            loading={<div style={{ width: pageWidth, height: pageHeight }} />}
          />
        </div>
        <HighlightOverlay items={annotations.get(p) ?? []} />
      </>
    );
  }

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
                className="relative shadow-card"
                style={{ width: pageWidth, minHeight: pageHeight }}
              >
                {Math.abs(p - page) <= 2 ? renderPage(p) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="relative flex min-h-full items-center justify-center py-4">
            <div
              data-page={Math.min(Math.max(page, 1), Math.max(numPages, 1))}
              className="relative shadow-card"
            >
              {renderPage(Math.min(Math.max(page, 1), Math.max(numPages, 1)))}
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
