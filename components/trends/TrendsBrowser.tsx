'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { TimeBadge } from '@/components/content/TimeBadge';
import { cn } from '@/lib/utils';
import type { ContentRow } from '@/types/content';

type Period = 'all' | 1 | 3 | 6;

const PERIODS: { key: Period; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 1, label: '최근 1개월' },
  { key: 3, label: '최근 3개월' },
  { key: 6, label: '최근 6개월' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${m}.${day}`;
}

export function TrendsBrowser({ items }: { items: ContentRow[] }) {
  const [period, setPeriod] = useState<Period>('all');

  const visible = useMemo(() => {
    if (period === 'all') return items;
    const cutoff = Date.now() - period * 30 * 24 * 60 * 60 * 1000;
    return items.filter((it) => {
      const t = new Date(it.published_at ?? it.created_at).getTime();
      return Number.isNaN(t) ? true : t >= cutoff;
    });
  }, [items, period]);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10 pb-20">
      {/* 기간 필터 */}
      <div className="flex flex-wrap gap-2 items-center mb-6">
        {PERIODS.map((p) => (
          <button
            key={String(p.key)}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={cn(
              'px-3.5 py-1.5 text-[13px] font-medium rounded-lg border transition-colors',
              period === p.key
                ? 'text-white bg-ink border-ink'
                : 'text-ink/50 border-border hover:text-ink hover:border-ink/40',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card p-10 text-center text-ink/40">
          {items.length === 0 ? '첫 트렌드 글을 곧 발행할게요.' : '해당 기간의 글이 없어요.'}
        </div>
      ) : (
        <ul>
          {visible.map((it, i) => (
            <li key={it.id}>
              <Link
                href={`/trends/${it.slug}`}
                className="group flex gap-5 py-6 border-b border-border items-start first:pt-0"
              >
                <div className="flex-1 min-w-0">
                  {it.published_at && (
                    <div className="text-xs text-ink/40 mb-1">{formatDate(it.published_at)}</div>
                  )}
                  <div className="text-xs font-extrabold text-ink/40 mb-1.5">
                    #{visible.length - i}
                  </div>
                  <h2 className="text-[18px] md:text-xl font-bold tracking-[-0.02em] leading-snug mb-1.5 break-keep group-hover:text-accent transition-colors">
                    {it.title}
                  </h2>
                  {it.summary && (
                    <p className="text-sm text-ink/60 leading-relaxed line-clamp-2 mb-2.5 break-keep">
                      {it.summary}
                    </p>
                  )}
                  <TimeBadge readMin={it.read_min} applyMin={it.apply_min} />
                </div>
                {it.thumbnail_url ? (
                  <div className="w-32 sm:w-40 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={it.thumbnail_url}
                      alt=""
                      loading="lazy"
                      className="h-auto w-full transition-transform group-hover:scale-[1.04]"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] w-32 sm:w-40 rounded-lg bg-muted shrink-0" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
