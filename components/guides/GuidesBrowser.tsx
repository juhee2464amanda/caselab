'use client';

import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  GUIDE_CATEGORIES,
  GUIDE_TAB_LABELS,
  GUIDE_SECTIONS,
  type GuideCategory,
  type GuideItem,
  type GuideSourceType,
} from '@/types/guide';

type Tab = 'all' | GuideCategory;

function sourceBadgeClass(type: GuideSourceType): string {
  if (type === 'github') return 'text-white bg-[#24292e]';
  if (type === 'course') return 'text-[#047857] bg-[#d1fae5]';
  return 'text-accent bg-accent-50';
}

export function GuidesBrowser({ guides }: { guides: GuideItem[] }) {
  const [tab, setTab] = useState<Tab>('all');

  const grouped = useMemo(() => {
    const m = new Map<GuideCategory, GuideItem[]>();
    for (const cat of GUIDE_CATEGORIES) {
      const items = guides.filter((g) => g.category === cat);
      if (items.length) m.set(cat, items);
    }
    return m;
  }, [guides]);

  const presentCats = GUIDE_CATEGORIES.filter((c) => grouped.has(c));

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-20">
      {/* 필터 탭 */}
      <div className="sticky top-14 z-40 -mx-6 px-6 bg-bg border-b border-border mb-8 flex gap-1.5 overflow-x-auto py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabButton active={tab === 'all'} onClick={() => setTab('all')} label="전체" count={guides.length} />
        {presentCats.map((c) => (
          <TabButton
            key={c}
            active={tab === c}
            onClick={() => setTab(c)}
            label={GUIDE_TAB_LABELS[c]}
            count={grouped.get(c)!.length}
          />
        ))}
      </div>

      {presentCats
        .filter((c) => tab === 'all' || tab === c)
        .map((c) => {
          const items = grouped.get(c)!;
          return (
            <section key={c} className="mb-12 scroll-mt-32">
              <div className="flex items-baseline gap-2.5 mb-2">
                <h2 className="text-xl font-extrabold tracking-[-0.025em]">
                  {GUIDE_SECTIONS[c].title}
                </h2>
                <span className="text-[13px] font-medium text-ink/30">{items.length}</span>
              </div>
              <p className="text-sm text-ink/60 mb-4 max-w-[600px] leading-relaxed break-keep">
                {GUIDE_SECTIONS[c].desc}
              </p>
              <div className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-1 snap-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {items.map((g) => (
                  <GuideCard key={g.id} guide={g} />
                ))}
              </div>
            </section>
          );
        })}

      {guides.length === 0 && (
        <div className="card p-10 text-center text-ink/40">가이드를 곧 추가할게요.</div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-1.5 text-sm font-medium rounded-full border whitespace-nowrap transition-colors',
        active
          ? 'text-white bg-ink border-ink'
          : 'text-ink/50 border-border hover:text-ink hover:border-ink/40',
      )}
    >
      {label}
      <span className="text-xs opacity-60 ml-1">{count}</span>
    </button>
  );
}

function GuideCard({ guide }: { guide: GuideItem }) {
  return (
    <a
      href={guide.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block w-[240px] sm:w-[264px] shrink-0 snap-start border border-border rounded-[10px] overflow-hidden bg-white transition-all hover:border-accent hover:shadow-[0_4px_14px_rgba(49,130,246,0.06)] hover:-translate-y-px"
    >
      <div
        className="h-20 flex items-center justify-center px-3.5 overflow-hidden"
        style={{ background: guide.thumbBg ?? '#f2f4f6' }}
      >
        <span
          className="text-[13px] font-bold tracking-[-0.02em] truncate max-w-full"
          style={{ color: guide.thumbColor ?? '#191f28' }}
        >
          {guide.thumbLabel}
        </span>
      </div>
      <div className="px-3.5 pt-3 pb-3.5">
        <span
          className={cn(
            'inline-block text-[9.5px] font-bold px-1.5 py-0.5 rounded mb-1.5 tracking-[0.02em]',
            sourceBadgeClass(guide.sourceType),
          )}
        >
          {guide.source}
        </span>
        <h3 className="text-[13.5px] font-bold tracking-[-0.02em] leading-[1.35] mb-1 line-clamp-2 break-keep group-hover:text-accent transition-colors">
          {guide.title}
        </h3>
        <p className="text-xs text-ink/60 leading-relaxed mb-2 line-clamp-2 break-keep">
          {guide.description}
        </p>
        {guide.linkLabel && (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-accent">
            {guide.linkLabel}
            <ArrowRight className="h-3 w-3" />
          </span>
        )}
      </div>
    </a>
  );
}
