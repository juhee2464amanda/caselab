import Link from 'next/link';
import { JOB_TAGS, JOB_LABELS, type JobTag } from '@/types/content';
import { cn } from '@/lib/utils';

type Counts = { all: number } & Record<JobTag, number>;

export function JobFilterSidebar({
  activeJob,
  activeCat,
  counts,
}: {
  activeJob?: JobTag;
  /** 케이스 성격 분류 탭과 직교 축 — 직무를 바꿔도 분류 필터를 보존한다 */
  activeCat?: string;
  counts: Counts;
}) {
  const href = (job?: JobTag) => {
    const qs = new URLSearchParams();
    if (job) qs.set('job', job);
    if (activeCat) qs.set('cat', activeCat);
    const s = qs.toString();
    return s ? `/cases?${s}` : '/cases';
  };
  return (
    <aside className="hidden lg:block w-[260px] flex-shrink-0">
      <div className="sticky top-20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold tracking-[-0.02em]">
            직무 카테고리
          </h3>
          <Link
            href="/cases"
            className="text-[13px] font-medium text-ink/40 hover:text-ink/60"
          >
            초기화
          </Link>
        </div>
        <ul className="list-none">
          <FilterItem
            href={href()}
            label="전체"
            count={counts.all}
            active={!activeJob}
          />
          {JOB_TAGS.map((j) => (
            <FilterItem
              key={j}
              href={href(j)}
              label={JOB_LABELS[j]}
              count={counts[j]}
              active={activeJob === j}
            />
          ))}
        </ul>
      </div>
    </aside>
  );
}

function FilterItem({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          'flex items-center gap-2.5 py-2.5 text-[15px] transition-colors border-b border-muted',
          active
            ? 'text-accent font-bold'
            : 'text-ink/60 font-medium hover:text-ink'
        )}
      >
        <span
          className={cn(
            'w-5 h-5 rounded-sm border-[1.5px] flex items-center justify-center transition-colors flex-shrink-0',
            active ? 'border-accent bg-accent' : 'border-ink/20'
          )}
        >
          {active && (
            <svg
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              aria-hidden
            >
              <path
                d="M1 3l3 2 5-4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        {label}
        <span
          className={cn(
            'ml-auto text-[13px] font-medium',
            active ? 'text-accent' : 'text-ink/40'
          )}
        >
          {count}
        </span>
      </Link>
    </li>
  );
}
