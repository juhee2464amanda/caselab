import Link from 'next/link';
import { listPublishedContents } from '@/lib/data/contents';
import { JobTags } from '@/components/content/JobTags';
import { TimeBadge } from '@/components/content/TimeBadge';
import { PersonaCoverageBadge } from '@/components/content/PersonaCoverageBadge';
import { JOB_LABELS, JOB_TAGS } from '@/types/content';
import { cn } from '@/lib/utils';

export const revalidate = 60;

const TIME_CAPS = [
  { label: '전체', value: undefined },
  { label: '5분 이하', value: 5 },
  { label: '10분 이하', value: 10 },
  { label: '30분 이하', value: 30 },
];

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; time?: string }>;
}) {
  const params = await searchParams;
  const timeCap = params.time ? parseInt(params.time, 10) : undefined;
  const job = params.job;

  const items = await listPublishedContents({ track: 'case', job, timeCap });

  return (
    <div className="container-wide py-10">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold">실전 케이스</h1>
        <p className="mt-2 text-ink/60">Framework × 단계별 AI 실행 × 솔직한 후기.</p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {TIME_CAPS.map((c) => {
          const active = (c.value ?? '') === (timeCap ?? '');
          const href = c.value
            ? `/cases?time=${c.value}${job ? `&job=${job}` : ''}`
            : job ? `/cases?job=${job}` : '/cases';
          return (
            <Link
              key={c.label}
              href={href}
              className={cn('chip cursor-pointer', active && 'chip-active')}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_220px]">
        <ul className="space-y-4">
          {items.length === 0 && (
            <li className="card p-10 text-center text-ink/40">
              조건에 맞는 콘텐츠가 아직 없어요.
            </li>
          )}
          {items.map((it) => (
            <li key={it.id}>
              <Link
                href={`/cases/${it.slug}`}
                className="card p-5 flex gap-5 hover:shadow-elevated transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <PersonaCoverageBadge personas={it.persona_coverage} className="mb-2" />
                  <h3 className="font-serif text-lg font-semibold leading-snug">{it.title}</h3>
                  {it.summary && (
                    <p className="mt-1.5 text-sm text-ink/70 line-clamp-2">{it.summary}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <TimeBadge readMin={it.read_min} applyMin={it.apply_min} />
                    <JobTags tags={it.job_tags} />
                  </div>
                </div>
                {it.thumbnail_url ? (
                  <img
                    src={it.thumbnail_url}
                    alt=""
                    className="h-28 w-28 rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-md bg-muted shrink-0" />
                )}
              </Link>
            </li>
          ))}
        </ul>

        <aside className="space-y-6">
          <div className="card p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink/40 mb-2">
              직무로 필터
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/cases"
                  className={cn(
                    'block text-sm py-1 px-1.5 rounded-md',
                    !job && 'bg-accent/10 text-accent font-medium'
                  )}
                >
                  전체
                </Link>
              </li>
              {JOB_TAGS.map((j) => (
                <li key={j}>
                  <Link
                    href={`/cases?job=${j}${timeCap ? `&time=${timeCap}` : ''}`}
                    className={cn(
                      'block text-sm py-1 px-1.5 rounded-md hover:bg-muted',
                      job === j && 'bg-accent/10 text-accent font-medium'
                    )}
                  >
                    {JOB_LABELS[j]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
