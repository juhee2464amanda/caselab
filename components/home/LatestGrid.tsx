'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LatestCard } from '@/components/home/LatestRow';
import type { LatestItem, LatestKind } from '@/lib/home/latest-items';

/**
 * 최신 콘텐츠 그리드 — 가로 스크롤 대신 4열 × 2줄로 한 번에 펼치는 대안(C안)
 *
 * 데스크톱엔 가로 스크롤 제스처가 없어 캐러셀 뒤쪽 카드는 사실상 안 보인다.
 * 그리드는 8개를 전부 노출하고, 대신 타입 칩으로 "도구만 / 케이스만" 좁혀보게 한다.
 */

const FILTERS: { key: LatestKind | 'all'; label: string; href?: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'case', label: '실전 케이스', href: '/cases' },
  { key: 'trend', label: 'AI 트렌드', href: '/trends' },
  { key: 'tool', label: 'AI 도구', href: '/tools' },
  { key: 'prompt', label: '프롬프트', href: '/prompts' },
];

export function LatestGrid({ items, rows = 2 }: { items: LatestItem[]; rows?: number }) {
  const [active, setActive] = useState<LatestKind | 'all'>('all');

  // 해당 타입이 하나도 없으면 칩 자체를 숨긴다 — 눌러도 빈 화면이 되는 칩은 신뢰를 깎는다
  const available = useMemo(() => new Set(items.map((it) => it.kind)), [items]);
  const chips = FILTERS.filter((f) => f.key === 'all' || available.has(f.key));
  const activeFilter = FILTERS.find((f) => f.key === active);

  const shown = useMemo(
    () => (active === 'all' ? items : items.filter((it) => it.kind === active)).slice(0, rows * 4),
    [items, active, rows],
  );

  if (items.length === 0) {
    return <div className="py-8 text-center text-sm text-ink/40">아직 콘텐츠가 없어요.</div>;
  }

  return (
    <>
      {chips.length > 2 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActive(f.key)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[13px] font-semibold transition',
                active === f.key
                  ? 'border-ink bg-ink text-white'
                  : 'border-border bg-white text-ink/60 hover:border-ink/25 hover:text-ink',
              )}
            >
              {f.label}
            </button>
          ))}
          {/* '전체 보기'는 타입을 고른 뒤에만 — 전 타입 혼합을 한 번에 보여주는 목록 페이지는 없다 */}
          {activeFilter?.href && (
            <Link
              href={activeFilter.href}
              className="ml-auto text-[13px] font-medium text-accent hover:underline underline-offset-[3px]"
            >
              {activeFilter.label} 전체 보기 →
            </Link>
          )}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
        {shown.map((it) => (
          <LatestCard key={it.id} item={it} media="image-top" />
        ))}
      </div>
    </>
  );
}
