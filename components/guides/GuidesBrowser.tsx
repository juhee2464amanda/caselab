'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveGuideLogo } from '@/lib/data/guide-logos';
import {
  GUIDE_CATEGORIES,
  GUIDE_TAB_LABELS,
  GUIDE_SECTIONS,
  guideHasDetail,
  type GuideCategory,
  type GuideItem,
} from '@/types/guide';

type Tab = 'all' | GuideCategory;

function hostLabel(guide: GuideItem): string | null {
  if (guide.linkLabel) return guide.linkLabel;
  if (!guide.url) return null;
  try {
    return new URL(guide.url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
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
    <div className="mx-auto max-w-[860px] px-6 pb-20">
      {/* 필터 탭 */}
      <div className="sticky top-14 z-40 -mx-6 px-6 bg-bg border-b border-border mb-5 flex gap-1.5 overflow-x-auto py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

      {/* 범례 — 내부 상세 vs 외부 이동 구분 */}
      {guides.length > 0 && (
        <div className="mb-6 flex items-center gap-4 px-1 text-[11.5px] text-ink/45">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-[4px] bg-accent-50 text-accent">
              <ArrowRight className="h-2.5 w-2.5" />
            </span>
            케이스랩 상세 가이드
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-[4px] bg-ink/[0.05] text-ink/40">
              <ExternalLink className="h-2.5 w-2.5" />
            </span>
            외부 사이트로 이동
          </span>
        </div>
      )}

      {presentCats
        .filter((c) => tab === 'all' || tab === c)
        .map((c) => {
          const items = grouped.get(c)!;
          return (
            <section key={c} className="mb-9 scroll-mt-32">
              <div className="flex items-baseline gap-2 mb-1">
                <h2 className="text-[16px] font-extrabold tracking-[-0.02em]">
                  {GUIDE_SECTIONS[c].title}
                </h2>
                <span className="text-[12px] font-medium text-ink/30">{items.length}</span>
              </div>
              <p className="text-[13px] text-ink/55 mb-3 max-w-[600px] leading-relaxed break-keep">
                {GUIDE_SECTIONS[c].desc}
              </p>
              <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_1px_3px_rgba(25,31,40,0.03)]">
                {items.map((g, i) => (
                  <GuideRow key={g.id} guide={g} last={i === items.length - 1} />
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

function GuideThumb({ guide }: { guide: GuideItem }) {
  if (guide.thumbImage) {
    return (
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-[#f2f4f6]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={guide.thumbImage} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>
    );
  }
  const logo = resolveGuideLogo(guide);
  if (logo) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" loading="lazy" className="h-full w-full rounded-lg object-contain" />
      </div>
    );
  }
  const detail = guideHasDetail(guide);
  return (
    <div
      className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl px-1 text-center text-[11px] font-bold leading-tight',
        detail ? 'bg-accent-50 text-accent' : 'bg-[#f2f4f6] text-ink/70',
      )}
    >
      <span className="line-clamp-2">{guide.thumbLabel}</span>
    </div>
  );
}

function GuideRow({ guide, last }: { guide: GuideItem; last: boolean }) {
  // 리치 본문/이미지가 있으면 내부 상세로, 없으면 외부 원문으로 바로 연결.
  const detail = guideHasDetail(guide);
  const host = hostLabel(guide);
  const rowClass = cn(
    'group flex items-center gap-4 px-4 py-3.5 transition-colors',
    !last && 'border-b border-border',
    detail ? 'hover:bg-accent-50/40' : 'hover:bg-[#f8fafc]',
  );
  const inner = (
    <>
      <GuideThumb guide={guide} />
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-1.5">
          <span className="rounded bg-ink/[0.05] px-1.5 py-0.5 text-[10px] font-bold tracking-[0.01em] text-ink/45">
            {guide.source}
          </span>
        </div>
        <h3
          className={cn(
            'truncate text-[14.5px] font-bold tracking-[-0.01em] transition-colors',
            detail && 'group-hover:text-accent',
          )}
        >
          {guide.title}
        </h3>
        {guide.description && (
          <p className="mt-0.5 truncate text-[12.5px] text-ink/50">{guide.description}</p>
        )}
      </div>
      {detail ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-50 px-2.5 py-1 text-[12px] font-semibold text-accent">
          가이드 읽기
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-ink/40">
          <span className="hidden sm:inline">{host}</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </span>
      )}
    </>
  );

  return detail ? (
    <Link href={`/guides/${guide.slug}`} className={rowClass}>
      {inner}
    </Link>
  ) : (
    <a href={guide.url} target="_blank" rel="noopener noreferrer" className={rowClass}>
      {inner}
    </a>
  );
}
