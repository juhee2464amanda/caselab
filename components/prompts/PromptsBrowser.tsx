'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
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

  const visible =
    active === 'all' ? prompts : prompts.filter((p) => p.category === active);

  const filterRows: { key: Filter; label: string }[] = [
    { key: 'all', label: '전체' },
    ...PROMPT_CATEGORIES.map((c) => ({ key: c, label: PROMPT_CATEGORY_LABELS[c] })),
  ];

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10 pb-20 flex gap-10 lg:gap-12">
      <div className="flex-1 min-w-0">
        {visible.length === 0 ? (
          <div className="card p-10 text-center text-ink/40">
            조건에 맞는 프롬프트가 아직 없어요.
          </div>
        ) : (
          visible.map((p) => <PromptCard key={p.id} prompt={p} />)
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

function PromptCard({ prompt }: { prompt: PromptItem }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(prompt.prompt).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      },
      () => {},
    );
  }

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
        <h2 className="text-[18px] md:text-xl font-bold tracking-[-0.02em] leading-snug mb-1.5 break-keep">
          {prompt.title}
        </h2>
        <div className="text-[13px] text-ink/50 leading-relaxed font-mono bg-muted px-3.5 py-2.5 rounded-lg border border-border mb-2 line-clamp-2 whitespace-pre-wrap break-keep">
          {prompt.prompt}
        </div>
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
