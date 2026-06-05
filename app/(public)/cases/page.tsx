import { listPublishedContents } from '@/lib/data/contents';
import { CategoryHero } from '@/components/cases/CategoryHero';
import { CaseArticle } from '@/components/cases/CaseArticle';
import { JobFilterSidebar } from '@/components/cases/JobFilterSidebar';
import { JOB_TAGS, type JobTag } from '@/types/content';

export const revalidate = 60;

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { job: rawJob } = await searchParams;
  const activeJob = (JOB_TAGS as readonly string[]).includes(rawJob ?? '')
    ? (rawJob as JobTag)
    : undefined;

  const [items, allCases] = await Promise.all([
    listPublishedContents({ track: 'case', job: activeJob }),
    listPublishedContents({ track: 'case' }),
  ]);

  const counts = {
    all: allCases.length,
    planning: 0,
    marketing: 0,
    sales: 0,
    solo: 0,
    strategy: 0,
    analysis: 0,
    revenue_kpi: 0,
    customer_research: 0,
  } as { all: number } & Record<JobTag, number>;
  for (const c of allCases) {
    for (const t of c.job_tags as string[]) {
      if (t in counts) counts[t as JobTag] += 1;
    }
  }

  return (
    <>
      <CategoryHero
        title="AI 실전케이스"
        description="현업 워크플로우에서 직접 실험한 케이스, 업무에 바로 적용해 보세요."
      />
      <div className="mx-auto max-w-[1100px] px-6 py-10 pb-20 flex gap-12">
        <main className="flex-1 min-w-0">
          {items.length === 0 ? (
            <div className="card p-10 text-center text-ink/40">
              조건에 맞는 콘텐츠가 아직 없어요.
            </div>
          ) : (
            <div>
              {items.map((it) => (
                <CaseArticle key={it.id} item={it} />
              ))}
            </div>
          )}
        </main>
        <JobFilterSidebar activeJob={activeJob} counts={counts} />
      </div>
    </>
  );
}
