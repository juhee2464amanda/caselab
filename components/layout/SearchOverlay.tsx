'use client';

import { useEffect, useRef, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, X } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * 검색 오버레이 — 검색 아이콘 클릭 시 페이지 이동 대신 레이어로 노출 (Tact/Ghost sodo-search 참고).
 *
 * 입력 시 브라우저 supabase 클라이언트로 실시간 검색(디바운스 250ms).
 * 결과: '콘텐츠' 섹션 헤더 + 제목(검색어 강조) + 발췌문 2줄.
 * 엔터/전체결과는 기존 /search 페이지로 이동해 전체 목록을 본다.
 */

interface Result {
  id: string;
  slug: string;
  track: 'case' | 'trend';
  title: string;
  summary: string | null;
}

// 인기 검색어 — 운영자가 선정(큐레이션). 클릭 시 해당 검색어로 실검색 실행.
const POPULAR_TERMS = ['Fable 5', '클로드', 'Claude Code', 'ChatGPT', '프롬프트', '자동화'];

// 제목/발췌문에서 검색어 부분을 굵게 강조
function highlight(text: string, term: string) {
  if (!term) return text;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text;
  return (
    <Fragment>
      {text.slice(0, idx)}
      <mark className="bg-transparent font-bold text-ink">{text.slice(idx, idx + term.length)}</mark>
      {text.slice(idx + term.length)}
    </Fragment>
  );
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 열릴 때 초기화 + 포커스, 배경 스크롤 잠금, Esc 닫기
  useEffect(() => {
    if (!open) return;
    setQ('');
    setResults([]);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // 디바운스 실시간 검색
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (!term) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const supabase = createSupabaseBrowserClient();
      const escaped = term.replace(/%/g, '\\%').replace(/_/g, '\\_');
      const { data } = await supabase
        .from('contents')
        .select('id, slug, track, title, summary')
        .eq('status', 'published')
        .or(`title.ilike.%${escaped}%,summary.ilike.%${escaped}%`)
        .order('published_at', { ascending: false })
        .limit(20);
      setResults((data ?? []) as Result[]);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

  if (!open) return null;

  const term = q.trim();

  function goTo(href: string) {
    onClose();
    router.push(href);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!term) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="검색">
      {/* 배경 — 클릭 시 닫기 */}
      <button
        type="button"
        aria-label="검색 닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* 상단 검색 패널 */}
      <div className="relative mx-auto w-full max-w-[640px] px-4 pt-4">
        <form onSubmit={onSubmit} className="flex items-center gap-3">
          <div className="flex flex-1 items-center gap-2.5 rounded-2xl bg-white px-4 py-3.5 shadow-elevated">
            {/* 비었을 땐 돋보기, 입력 중엔 지우기(X) */}
            {term ? (
              <button
                type="button"
                aria-label="지우기"
                onClick={() => {
                  setQ('');
                  inputRef.current?.focus();
                }}
                className="shrink-0 text-ink/50 hover:text-ink"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            ) : (
              <SearchIcon className="h-5 w-5 shrink-0 text-ink/40" strokeWidth={2} />
            )}
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="케이스, 트렌드 검색"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink/40"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-[15px] font-medium text-white/90"
          >
            취소
          </button>
        </form>

        {/* 비었을 때 — 인기 검색어(운영자 선정). 클릭 시 해당 검색어로 검색 */}
        {!term && (
          <div className="mt-3 rounded-2xl bg-white p-5 shadow-elevated">
            <div className="mb-3 text-[12px] font-medium text-ink/40">인기 검색어</div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TERMS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setQ(t);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full bg-muted px-3.5 py-1.5 text-[13px] font-semibold text-ink/80 active:bg-border"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 실시간 결과 */}
        {term && (
          <div className="mt-3 max-h-[65vh] overflow-y-auto rounded-2xl bg-white shadow-elevated">
            {loading ? (
              <div className="p-5 text-center text-sm text-ink/40">검색 중…</div>
            ) : results.length === 0 ? (
              <div className="p-5 text-center text-sm text-ink/40">검색 결과가 없어요.</div>
            ) : (
              <>
                <div className="px-5 pt-4 pb-1 text-[12px] font-medium text-ink/40">콘텐츠</div>
                <ul>
                  {results.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() =>
                          goTo(`/${r.track === 'case' ? 'cases' : 'trends'}/${r.slug}`)
                        }
                        className="block w-full px-5 py-3 text-left hover:bg-muted"
                      >
                        <div className="text-[15px] font-semibold leading-snug text-ink/90 line-clamp-1 keepall">
                          {highlight(r.title, term)}
                        </div>
                        {r.summary && (
                          <p className="mt-1 text-[13px] leading-snug text-ink/45 line-clamp-2 keepall">
                            {highlight(r.summary, term)}
                          </p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
