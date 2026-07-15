'use client';

import { useMemo, useState } from 'react';
import { Check, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrackedCtaLink } from '@/components/analytics/TrackedCtaLink';
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

// 리스트 썸네일 — 없으면 브랜드 플레이스홀더로 폴백 (히어로 HeroThumb와 동일 감각).
function PromptThumb({ src, className }: { src?: string | null; className?: string }) {
  return (
    <div className={cn('rounded-md overflow-hidden bg-muted shrink-0', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-muted">
          <span className="font-serif text-xs font-bold text-ink/25 tracking-tight">Caselab</span>
        </div>
      )}
    </div>
  );
}

/**
 * 카드에는 제목 + 압축 설명만. 본문·복사는 상세(/prompts/[slug])로 —
 * 프롬프트별 URL이 있어야 DM으로 개별 안내·유입이 가능하다.
 */
function PickCard({ prompt }: { prompt: PromptItem }) {
  return (
    <TrackedCtaLink
      href={`/prompts/${prompt.slug}`}
      label="prompt_card"
      meta={{ prompt_id: prompt.id, slug: prompt.slug, category: prompt.category, band: 'pick' }}
      className="flex flex-col rounded-xl border border-accent-100 bg-white p-4 transition-shadow hover:shadow-[0_2px_12px_rgba(49,130,246,0.08)]"
    >
      <PromptThumb src={prompt.thumbnailUrl} className="-mx-4 -mt-4 mb-3 aspect-[16/9] rounded-t-xl rounded-b-none" />
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
      <h3 className="text-[15px] font-bold tracking-[-0.02em] leading-snug mb-1.5 break-keep">
        {prompt.title}
      </h3>
      {prompt.description && (
        <p className="text-[13px] text-ink/50 leading-relaxed line-clamp-2 break-keep whitespace-pre-line mb-2">
          {prompt.description}
        </p>
      )}
      <span className="mt-auto self-end inline-flex items-center gap-0.5 text-xs font-semibold text-accent">
        자세히 보기 <ChevronRight className="h-3 w-3" />
      </span>
    </TrackedCtaLink>
  );
}

function PromptCard({ prompt }: { prompt: PromptItem }) {
  return (
    <TrackedCtaLink
      href={`/prompts/${prompt.slug}`}
      label="prompt_card"
      meta={{ prompt_id: prompt.id, slug: prompt.slug, category: prompt.category, band: 'list' }}
      className="group flex gap-5 py-6 border-b border-border first:pt-0 items-start"
    >
      <div className="flex-1 min-w-0">
        <div className="flex gap-1.5 flex-wrap mb-2">
          <span className="text-[11px] font-bold text-accent bg-accent-50 px-2 py-0.5 rounded">
            {PROMPT_CATEGORY_LABELS[prompt.category]}
          </span>
          {prompt.source && (
            <span className="text-[11px] font-semibold text-ink/50 bg-muted px-2 py-0.5 rounded">
              {prompt.source}
            </span>
          )}
        </div>
        <h2 className="text-[18px] md:text-xl font-bold tracking-[-0.02em] leading-snug mb-1.5 truncate group-hover:text-accent transition-colors">
          {prompt.title}
        </h2>
        {prompt.description && (
          <p className="text-[14px] text-ink/60 leading-relaxed line-clamp-2 break-keep whitespace-pre-line mb-2.5">
            {prompt.description}
          </p>
        )}
        <span className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-accent">
          프롬프트 보기 <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
      <PromptThumb src={prompt.thumbnailUrl} className="h-24 w-24" />
    </TrackedCtaLink>
  );
}
