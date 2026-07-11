'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics/track';
import {
  PROMPT_CATEGORIES,
  PROMPT_CATEGORY_LABELS,
  type PromptCategory,
  type PromptItem,
} from '@/types/prompt';

type Filter = 'all' | PromptCategory;

export function PromptsBrowser({ prompts }: { prompts: PromptItem[] }) {
  const [active, setActive] = useState<Filter>('all');

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: prompts.length };
    for (const cat of PROMPT_CATEGORIES) {
      c[cat] = prompts.filter((p) => p.category === cat).length;
    }
    return c;
  }, [prompts]);

  // 에디터 PICK: pickOrder가 있는 항목을 작은 순서대로. 전체 보기에서만 상단 밴드로 노출.
  const picks = useMemo(
    () =>
      prompts
        .filter((p) => p.pickOrder != null)
        .sort((a, b) => (a.pickOrder ?? 0) - (b.pickOrder ?? 0)),
    [prompts],
  );

  const showPickBand = active === 'all' && picks.length > 0;

  // 전체 보기에서는 PICK을 밴드로 따로 빼 중복 제거, 나머지는 최신순 누적(쿼리 정렬 유지).
  // 카테고리 필터 시에는 해당 카테고리 전체(=PICK 포함)를 최신순으로.
  const listItems =
    active === 'all'
      ? prompts.filter((p) => p.pickOrder == null)
      : prompts.filter((p) => p.category === active);

  const filterRows: { key: Filter; label: string }[] = [
    { key: 'all', label: '전체' },
    ...PROMPT_CATEGORIES.map((c) => ({ key: c, label: PROMPT_CATEGORY_LABELS[c] })),
  ];

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10 pb-20 flex gap-10 lg:gap-12">
      <div className="flex-1 min-w-0">
        {showPickBand && (
          <section className="mb-8 rounded-2xl border border-accent-100 bg-accent-50/40 p-5 md:p-6">
            <div className="flex items-center gap-1.5 mb-4">
              <Sparkles className="h-4 w-4 text-accent" strokeWidth={2.5} />
              <span className="text-[15px] font-extrabold tracking-[-0.02em] text-accent">
                에디터 추천
              </span>
              <span className="text-[13px] font-medium text-ink/40">
                이번에 특히 추천하는 프롬프트
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {picks.map((p) => (
                <PickCard key={p.id} prompt={p} />
              ))}
            </div>
          </section>
        )}

        {showPickBand && listItems.length > 0 && (
          <h2 className="text-base font-extrabold tracking-[-0.02em] text-ink/70 mb-1">
            최신 프롬프트
          </h2>
        )}

        {listItems.length === 0 ? (
          <div className="card p-10 text-center text-ink/40">
            조건에 맞는 프롬프트가 아직 없어요.
          </div>
        ) : (
          listItems.map((p) => <PromptCard key={p.id} prompt={p} />)
        )}
      </div>

      <aside className="hidden lg:block w-[260px] shrink-0">
        <div className="sticky top-20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-extrabold tracking-[-0.02em]">카테고리</span>
            {active !== 'all' && (
              <button
                type="button"
                onClick={() => setActive('all')}
                className="text-[13px] font-medium text-ink/40 hover:text-ink/60"
              >
                초기화
              </button>
            )}
          </div>
          <ul>
            {filterRows.map((row) => {
              const on = active === row.key;
              return (
                <li key={row.key}>
                  <button
                    type="button"
                    onClick={() => setActive(row.key)}
                    className={cn(
                      'flex w-full items-center gap-2.5 py-2.5 text-[15px] font-medium border-b border-muted transition-colors',
                      on ? 'text-accent font-bold' : 'text-ink/60 hover:text-ink',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded border-[1.5px] shrink-0 transition-colors',
                        on ? 'border-accent bg-accent' : 'border-ink/20',
                      )}
                    >
                      {on && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </span>
                    {row.label}
                    <span className="ml-auto text-[13px] font-medium text-ink/30">
                      {counts[row.key] ?? 0}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function useCopy(prompt: PromptItem, band: 'pick' | 'list') {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(prompt.prompt).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
        // 북극성(prompt_copy) 원천 — /prompts 라이브러리 복사 계측.
        // tools(category='prompt') 항목이라 content_id 없음 → 식별자는 metadata로.
        void track('prompt_copy', {
          prompt_id: prompt.id,
          label: prompt.title,
          category: prompt.category,
          source: `library_${band}`,
        });
      },
      () => {},
    );
  }
  return { copied, copy };
}

/**
 * 프롬프트 본문 — 접힘 시 3줄로 고정(길이와 무관하게 균일한 카드 리듬).
 * 3줄을 넘칠 때만 더보기/접기 토글 노출. 짧은 프롬프트엔 버튼 없음.
 */
function PromptBody({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (expanded) return; // 펼친 상태에선 측정값이 무의미 → 이전 overflowing 유지
      setOverflowing(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, expanded]);

  return (
    <div className="mb-2">
      <div
        ref={ref}
        className={cn(
          'text-[13px] text-ink/50 leading-relaxed font-mono bg-muted px-3.5 py-2.5 rounded-lg border border-border whitespace-pre-wrap break-keep',
          expanded ? '' : 'line-clamp-2',
        )}
      >
        {text}
      </div>
      {(overflowing || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 inline-flex items-center gap-0.5 text-[12px] font-semibold text-ink/45 hover:text-ink/70 transition-colors"
        >
          {expanded ? (
            <>
              접기 <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              더보기 <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

function PickCard({ prompt }: { prompt: PromptItem }) {
  const { copied, copy } = useCopy(prompt, 'pick');

  return (
    <article className="flex flex-col rounded-xl border border-accent-100 bg-white p-4 transition-shadow hover:shadow-[0_2px_12px_rgba(49,130,246,0.08)]">
      <div className="flex gap-1.5 flex-wrap mb-1.5">
        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-accent bg-accent-50 px-2 py-0.5 rounded">
          추천
        </span>
        <span className="text-[11px] font-bold text-accent bg-accent-50 px-2 py-0.5 rounded">
          {PROMPT_CATEGORY_LABELS[prompt.category]}
        </span>
        {prompt.source && (
          <span className="text-[11px] font-semibold text-ink/50 bg-muted px-2 py-0.5 rounded">
            {prompt.source}
          </span>
        )}
      </div>
      <h3 className="text-[15px] font-bold tracking-[-0.02em] leading-snug mb-2 break-keep">
        {prompt.title}
      </h3>
      <div className="text-[12px] text-ink/50 leading-relaxed font-mono bg-muted px-3 py-2 rounded-lg border border-border mb-3 line-clamp-2 whitespace-pre-wrap break-keep">
        {prompt.prompt}
      </div>
      <button
        type="button"
        onClick={copy}
        className="mt-auto self-end inline-flex items-center gap-1 text-xs font-semibold text-accent bg-accent-50 px-2.5 py-1 rounded-md hover:bg-accent-100 transition-colors"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3" /> 복사됨
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" /> 복사
          </>
        )}
      </button>
    </article>
  );
}

function PromptCard({ prompt }: { prompt: PromptItem }) {
  const { copied, copy } = useCopy(prompt, 'list');

  return (
    <article className="flex gap-5 py-6 border-b border-border first:pt-0">
      <div className="flex-1 min-w-0">
        <div className="flex gap-1.5 flex-wrap mb-2">
          <span className="text-[11px] font-bold text-accent bg-accent-50 px-2 py-0.5 rounded">
            {PROMPT_CATEGORY_LABELS[prompt.category]}
          </span>
          {prompt.source &&
            (prompt.sourceUrl ? (
              <a
                href={prompt.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-ink/50 bg-muted px-2 py-0.5 rounded hover:bg-border hover:text-ink transition-colors"
              >
                {prompt.source}
                <ArrowUpRight className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-[11px] font-semibold text-ink/50 bg-muted px-2 py-0.5 rounded">
                {prompt.source}
              </span>
            ))}
        </div>
        <h2 className="text-[18px] md:text-xl font-bold tracking-[-0.02em] leading-snug mb-1.5 truncate">
          {prompt.title}
        </h2>
        {prompt.description && (
          <p className="text-[14px] text-ink/60 leading-relaxed mb-2.5 break-keep whitespace-pre-line">
            {prompt.description}
          </p>
        )}
        <PromptBody text={prompt.prompt} />
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-ink/40">바로 복사 가능</span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent bg-accent-50 px-2.5 py-1 rounded-md hover:bg-accent-100 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" /> 복사됨
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> 복사
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
