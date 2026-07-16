'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  GalleryVertical,
  ListTree,
  Loader2,
  Moon,
  StickyNote,
  Sun,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics/track';
import type { OutlineItem, TextSelection } from './PdfReader';
import { ViewerPanel, type AnnotationRow, type BookmarkRow, type PanelTab } from './ViewerPanel';

const PdfReader = dynamic(() => import('./PdfReader'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center gap-2 text-sm opacity-60">
      <Loader2 className="h-4 w-4 animate-spin" /> 뷰어를 준비하는 중…
    </div>
  ),
});

interface EbookViewerProps {
  purchaseId: string;
  productId: string;
  userId: string;
  title: string;
  initialPage: number;
  fallbackToc: string[];
}

interface ViewerPrefs {
  mode: 'scroll' | 'page';
  zoom: number;
  dark: boolean;
}

const PREFS_KEY = 'ebook-viewer-prefs';
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 2;

/** 플로팅 메뉴 색상 스와치 (실제 하이라이트 색은 PdfReader.HIGHLIGHT_COLORS) */
const SWATCHES: Array<{ key: string; bg: string; label: string }> = [
  { key: 'yellow', bg: '#FACC15', label: '노랑 형광펜' },
  { key: 'green', bg: '#4ADE80', label: '초록 형광펜' },
  { key: 'pink', bg: '#F472B6', label: '분홍 형광펜' },
];

function loadPrefs(): ViewerPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { mode: 'scroll', zoom: 1, dark: false, ...JSON.parse(raw) };
  } catch {
    // 파싱 실패 시 기본값
  }
  return { mode: 'scroll', zoom: 1, dark: false };
}

/**
 * 웹뷰어 셸 — 툴바/진행바/패널/하이라이트·메모/상태 관리.
 * 렌더링은 PdfReader(클라이언트 전용, dynamic import)에 위임.
 * 기획: docs/08_ebook_viewer_plan.md
 */
export function EbookViewer({
  purchaseId,
  productId,
  userId,
  title,
  initialPage,
  fallbackToc,
}: EbookViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [numPages, setNumPages] = useState(0);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkRow[]>([]);
  const [annotations, setAnnotations] = useState<AnnotationRow[]>([]);
  const [panel, setPanel] = useState<PanelTab | null>(null);
  const [prefs, setPrefs] = useState<ViewerPrefs>({ mode: 'scroll', zoom: 1, dark: false });
  /** 드래그 선택 중 (플로팅 색상 메뉴 표시) */
  const [selection, setSelection] = useState<TextSelection | null>(null);
  /** 메모 입력 팝오버 대상 (선택 캡처본) */
  const [memoTarget, setMemoTarget] = useState<TextSelection | null>(null);
  const [memoText, setMemoText] = useState('');

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const pageRef = useRef(page);
  const numPagesRef = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const updatePrefs = useCallback((patch: Partial<ViewerPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        // 저장 실패는 무시 (사파리 프라이빗 모드 등)
      }
      return next;
    });
  }, []);

  // 스트리밍 URL 발급 (10분 만료 — PDF.js가 로드 시점에 문서를 가져가므로 1회면 충분)
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ebook/stream?p=${purchaseId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? 'stream error');
        return res.json();
      })
      .then((json: { url: string }) => {
        if (!cancelled) setFileUrl(json.url);
      })
      .catch(() => {
        if (!cancelled) setLoadError('전자책을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.');
      });
    return () => {
      cancelled = true;
    };
  }, [purchaseId]);

  // 북마크·하이라이트 로드 (RLS로 본인 것만)
  useEffect(() => {
    supabase
      .from('ebook_bookmarks')
      .select('id, page, label')
      .eq('product_id', productId)
      .order('page')
      .then(({ data }) => setBookmarks((data as BookmarkRow[]) ?? []));
    supabase
      .from('ebook_annotations')
      .select('id, page, color, selected_text, rects, note')
      .eq('product_id', productId)
      .order('page')
      .then(({ data }) => setAnnotations((data as AnnotationRow[]) ?? []));
  }, [supabase, productId]);

  const annotationsByPage = useMemo(() => {
    const map = new Map<number, Array<{ id: string; color: string; rects: AnnotationRow['rects'] }>>();
    for (const a of annotations) {
      const list = map.get(a.page) ?? [];
      list.push({ id: a.id, color: a.color, rects: a.rects });
      map.set(a.page, list);
    }
    return map;
  }, [annotations]);

  const saveReadingState = useCallback(
    (p: number) => {
      supabase
        .from('ebook_reading_state')
        .upsert({
          user_id: userId,
          product_id: productId,
          page: p,
          total_pages: numPagesRef.current || null,
          updated_at: new Date().toISOString(),
        })
        .then(() => {});
    },
    [supabase, userId, productId]
  );

  // 페이지 변경 → 이어읽기 저장(3초 debounce) + 읽기 이벤트 + 완독 판정
  useEffect(() => {
    pageRef.current = page;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveReadingState(page);
      track('ebook_read_page', { product_id: productId, page });
    }, 3000);

    if (numPages > 0 && page >= numPages && !finished.current) {
      finished.current = true;
      track('ebook_finish', { product_id: productId, total_pages: numPages });
    }
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [page, numPages, productId, saveReadingState]);

  // 탭 이탈/닫기 직전 즉시 저장
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') saveReadingState(pageRef.current);
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [saveReadingState]);

  // 페이지 모드 키보드 이동
  useEffect(() => {
    if (prefs.mode !== 'page') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setPage((p) => Math.max(1, p - 1));
      if (e.key === 'ArrowRight')
        setPage((p) => Math.min(numPagesRef.current || p + 1, p + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prefs.mode]);

  // 내부 스크롤 시 플로팅 메뉴 위치가 어긋나므로 닫기 (capture로 내부 컨테이너 스크롤 감지)
  useEffect(() => {
    if (!selection && !memoTarget) return;
    const close = () => {
      setSelection(null);
      setMemoTarget(null);
    };
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [selection, memoTarget]);

  const handleDocLoad = useCallback(
    ({ numPages: n, outline: o }: { numPages: number; outline: OutlineItem[] }) => {
      setNumPages(n);
      numPagesRef.current = n;
      setOutline(o);
    },
    []
  );

  const jumpTo = useCallback((p: number) => {
    setPage(p);
    setPanel(null);
  }, []);

  const currentBookmark = bookmarks.find((b) => b.page === page);

  const toggleBookmark = useCallback(async () => {
    if (currentBookmark) {
      setBookmarks((prev) => prev.filter((b) => b.id !== currentBookmark.id));
      await supabase.from('ebook_bookmarks').delete().eq('id', currentBookmark.id);
    } else {
      const { data } = await supabase
        .from('ebook_bookmarks')
        .insert({ user_id: userId, product_id: productId, page })
        .select('id, page, label')
        .single();
      if (data) {
        setBookmarks((prev) =>
          [...prev, data as BookmarkRow].sort((a, b) => a.page - b.page)
        );
      }
    }
  }, [currentBookmark, supabase, userId, productId, page]);

  const removeBookmark = useCallback(
    async (id: string) => {
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      await supabase.from('ebook_bookmarks').delete().eq('id', id);
    },
    [supabase]
  );

  /** 하이라이트/메모 저장 (target = 캡처된 선택) */
  const saveAnnotation = useCallback(
    async (target: TextSelection, color: string, note: string | null) => {
      setSelection(null);
      setMemoTarget(null);
      setMemoText('');
      window.getSelection()?.removeAllRanges();
      const { data } = await supabase
        .from('ebook_annotations')
        .insert({
          user_id: userId,
          product_id: productId,
          page: target.page,
          color,
          selected_text: target.text,
          rects: target.rects,
          note,
        })
        .select('id, page, color, selected_text, rects, note')
        .single();
      if (data) {
        setAnnotations((prev) =>
          [...prev, data as AnnotationRow].sort((a, b) => a.page - b.page)
        );
      }
    },
    [supabase, userId, productId]
  );

  const removeAnnotation = useCallback(
    async (id: string) => {
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
      await supabase.from('ebook_annotations').delete().eq('id', id);
    },
    [supabase]
  );

  const { mode, zoom, dark } = prefs;
  const chrome = dark
    ? 'bg-neutral-800 text-neutral-100 border-neutral-700'
    : 'bg-white text-ink border-black/10';
  const hoverBg = dark ? 'hover:bg-neutral-700' : 'hover:bg-muted';
  const progress = numPages > 0 ? Math.round((page / numPages) * 100) : 0;

  // 툴바 버튼 — 틴트 배경·테두리로 기능이 한눈에 보이게 (2026-07-16 피드백)
  // 기본: accent 틴트 / 활성(북마크): amber 채움 / 활성(패널·다크): accent 채움
  const iconBtn = dark
    ? 'rounded-full border border-neutral-600 bg-neutral-700/70 p-2 text-neutral-100 transition hover:bg-neutral-600 disabled:opacity-30'
    : 'rounded-full border border-accent-100 bg-accent-50 p-2 text-accent-600 transition hover:bg-accent-100 hover:text-accent-700 disabled:opacity-30';
  const iconBtnAmber = dark
    ? 'rounded-full border border-amber-400/60 bg-amber-400/20 p-2 text-amber-300 transition hover:bg-amber-400/30'
    : 'rounded-full border border-amber-300 bg-amber-100 p-2 text-amber-600 transition hover:bg-amber-200';
  const iconBtnOn = 'rounded-full border border-accent-500 bg-accent-500 p-2 text-white transition hover:bg-accent-600';

  // 플로팅 메뉴 위치 (뷰포트 클램프)
  const menuPos = (anchor: { x: number; y: number }) => ({
    left: Math.min(Math.max(8, anchor.x - 80), (typeof window !== 'undefined' ? window.innerWidth : 800) - 190),
    top: Math.max(8, anchor.y - 52),
  });

  return (
    <div
      className={`flex h-dvh flex-col ${dark ? 'bg-neutral-900' : 'bg-neutral-200'}`}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()} // 선택은 허용(하이라이트용), 복사만 차단
    >
      {/* 상단 툴바 */}
      <header className={`z-30 flex items-center gap-1.5 border-b px-2 py-2 sm:px-3 ${chrome}`}>
        <Link
          href="/mypage/ebooks"
          aria-label="내 전자책으로 돌아가기"
          title="내 전자책으로"
          className={`rounded-full p-2 transition ${hoverBg}`}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium select-none">{title}</h1>
        <button
          type="button"
          aria-label={currentBookmark ? '북마크 해제' : '이 페이지 북마크'}
          title={currentBookmark ? '북마크 해제' : '이 페이지 북마크'}
          onClick={toggleBookmark}
          className={currentBookmark ? iconBtnAmber : iconBtn}
          disabled={numPages === 0}
        >
          {currentBookmark ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          aria-label="목차·북마크·노트 열기"
          title="목차 · 북마크 · 노트"
          onClick={() => setPanel((p) => (p ? null : 'toc'))}
          className={panel ? iconBtnOn : iconBtn}
        >
          <ListTree className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={mode === 'scroll' ? '페이지 넘김 모드로' : '스크롤 모드로'}
          title={mode === 'scroll' ? '페이지 넘김 모드로' : '스크롤 모드로'}
          onClick={() => updatePrefs({ mode: mode === 'scroll' ? 'page' : 'scroll' })}
          className={iconBtn}
        >
          {mode === 'scroll' ? (
            <BookOpen className="h-4 w-4" />
          ) : (
            <GalleryVertical className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          aria-label="축소"
          title="축소"
          onClick={() => updatePrefs({ zoom: Math.max(ZOOM_MIN, +(zoom - 0.2).toFixed(1)) })}
          className={`${iconBtn} hidden sm:block`}
          disabled={zoom <= ZOOM_MIN}
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="확대"
          title="확대"
          onClick={() => updatePrefs({ zoom: Math.min(ZOOM_MAX, +(zoom + 0.2).toFixed(1)) })}
          className={`${iconBtn} hidden sm:block`}
          disabled={zoom >= ZOOM_MAX}
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={dark ? '라이트 모드' : '다크 모드'}
          title={dark ? '라이트 모드' : '다크 모드'}
          onClick={() => updatePrefs({ dark: !dark })}
          className={dark ? iconBtnOn : iconBtn}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      {/* 본문 */}
      <main className="relative min-h-0 flex-1">
        {loadError ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm opacity-70">
            {loadError}
          </div>
        ) : fileUrl ? (
          <PdfReader
            fileUrl={fileUrl}
            mode={mode}
            page={page}
            zoom={zoom}
            dark={dark}
            annotations={annotationsByPage}
            onDocLoad={handleDocLoad}
            onPageChange={setPage}
            onTextSelected={setSelection}
          />
        ) : (
          <div className="flex h-full items-center justify-center gap-2 text-sm opacity-60">
            <Loader2 className="h-4 w-4 animate-spin" /> 전자책을 불러오는 중…
          </div>
        )}

        {panel && (
          <ViewerPanel
            tab={panel}
            outline={outline}
            fallbackToc={fallbackToc}
            bookmarks={bookmarks}
            annotations={annotations}
            currentPage={page}
            dark={dark}
            onTabChange={setPanel}
            onJump={jumpTo}
            onRemoveBookmark={removeBookmark}
            onRemoveAnnotation={removeAnnotation}
            onClose={() => setPanel(null)}
          />
        )}
      </main>

      {/* 드래그 선택 플로팅 메뉴 — 형광펜 3색 + 메모 */}
      {selection && !memoTarget && (
        <div
          className="fixed z-50 flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1.5 shadow-lg"
          style={menuPos(selection.anchor)}
          onMouseDown={(e) => e.preventDefault()} // 클릭 시 브라우저 선택 해제 방지
        >
          {SWATCHES.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-label={s.label}
              title={s.label}
              onClick={() => void saveAnnotation(selection, s.key, null)}
              className="h-6 w-6 rounded-full border border-black/10 transition hover:scale-110"
              style={{ background: s.bg }}
            />
          ))}
          <span className="mx-0.5 h-4 w-px bg-black/10" />
          <button
            type="button"
            onClick={() => {
              setMemoTarget(selection);
              setSelection(null);
            }}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-ink hover:bg-muted"
          >
            <StickyNote className="h-3.5 w-3.5 text-accent-600" /> 메모
          </button>
        </div>
      )}

      {/* 메모 입력 팝오버 */}
      {memoTarget && (
        <div
          className="fixed z-50 w-72 rounded-lg border border-black/10 bg-white p-3 shadow-xl"
          style={menuPos(memoTarget.anchor)}
        >
          <p className="mb-2 line-clamp-2 rounded bg-amber-50 px-2 py-1 text-xs text-ink/60">
            “{memoTarget.text.slice(0, 80)}”
          </p>
          <textarea
            autoFocus
            rows={3}
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            placeholder="메모를 입력하세요"
            className="w-full resize-none rounded-md border border-black/10 px-2 py-1.5 text-sm text-ink outline-none focus:border-accent-500"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setMemoTarget(null);
                setMemoText('');
              }}
              className="rounded-md px-2.5 py-1 text-xs text-ink/60 hover:bg-muted"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void saveAnnotation(memoTarget, 'yellow', memoText.trim() || null)}
              className="rounded-md bg-accent-500 px-3 py-1 text-xs font-medium text-white hover:bg-accent-600"
            >
              저장
            </button>
          </div>
        </div>
      )}

      {/* 하단 진행바 */}
      <footer className={`z-30 flex items-center gap-3 border-t px-3 py-2 sm:px-4 select-none ${chrome}`}>
        <input
          type="range"
          min={1}
          max={Math.max(numPages, 1)}
          value={Math.min(page, Math.max(numPages, 1))}
          onChange={(e) => setPage(Number(e.target.value))}
          disabled={numPages === 0}
          aria-label="페이지 이동"
          className="h-1.5 flex-1 cursor-pointer accent-amber-500"
        />
        <span className="shrink-0 text-xs tabular-nums opacity-70">
          {numPages > 0 ? `${page} / ${numPages} · ${progress}%` : '—'}
        </span>
      </footer>
    </div>
  );
}
