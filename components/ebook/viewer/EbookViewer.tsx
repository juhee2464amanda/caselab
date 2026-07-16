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
  Sun,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics/track';
import type { OutlineItem } from './PdfReader';
import { ViewerPanel, type BookmarkRow } from './ViewerPanel';

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
 * 웹뷰어 셸 — 툴바/진행바/패널/상태 관리.
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
  const [panel, setPanel] = useState<'toc' | 'bookmarks' | null>(null);
  const [prefs, setPrefs] = useState<ViewerPrefs>({ mode: 'scroll', zoom: 1, dark: false });

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

  // 북마크 로드 (RLS로 본인 것만)
  useEffect(() => {
    supabase
      .from('ebook_bookmarks')
      .select('id, page, label')
      .eq('product_id', productId)
      .order('page')
      .then(({ data }) => setBookmarks((data as BookmarkRow[]) ?? []));
  }, [supabase, productId]);

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

  return (
    <div
      className={`flex h-dvh flex-col select-none ${dark ? 'bg-neutral-900' : 'bg-neutral-200'}`}
      onContextMenu={(e) => e.preventDefault()}
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
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium">{title}</h1>
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
          aria-label="목차·북마크 열기"
          title="목차 · 북마크"
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
            onDocLoad={handleDocLoad}
            onPageChange={setPage}
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
            currentPage={page}
            dark={dark}
            onTabChange={setPanel}
            onJump={jumpTo}
            onRemoveBookmark={removeBookmark}
            onClose={() => setPanel(null)}
          />
        )}
      </main>

      {/* 하단 진행바 */}
      <footer className={`z-30 flex items-center gap-3 border-t px-3 py-2 sm:px-4 ${chrome}`}>
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
