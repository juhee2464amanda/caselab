import { listPublishedContents } from '@/lib/data/contents';
import { CategoryHero } from '@/components/cases/CategoryHero';
import { CaseArticle } from '@/components/cases/CaseArticle';
import { CaseCategoryTabs } from '@/components/cases/CaseCategoryTabs';
import { JobFilterSidebar } from '@/components/cases/JobFilterSidebar';
import { FeedCardList, feedDateLabel, type FeedItem } from '@/components/content/FeedCard';
import { CASE_CATEGORIES, JOB_TAGS, JOB_LABELS, type CaseCategory, type JobTag } from '@/types/content';

export const revalidate = 60;

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; cat?: string }>;
}) {
  const { job: rawJob, cat: rawCat } = await searchParams;
  const activeJob = (JOB_TAGS as readonly string[]).includes(rawJob ?? '')
    ? (rawJob as JobTag)
    : undefined;
  const activeCat = (CASE_CATEGORIES as readonly string[]).includes(rawCat ?? '')
    ? (rawCat as CaseCategory)
    : undefined;

  const [items, allCases] = await Promise.all([
    listPublishedContents({ track: 'case', job: activeJob, cat: activeCat }),
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

  // 모바일 피드 카드 — 홈 '최신 콘텐츠'와 동일 포맷 (데스크톱은 아래 가로 행 목록 유지)
  const feedItems: FeedItem[] = items.map((it) => ({
    id: it.id,
    href: `/cases/${it.slug}`,
    title: it.title,
    summary: it.summary,
    thumbnail_url: it.thumbnail_url,
    // 배지 = 성격 분류 우선 (모바일은 사이드바가 없어 카드가 유일한 분류 노출면) — 미분류는 직무 폴백
    badge: it.category?.label ?? (it.job_tags[0] ? JOB_LABELS[it.job_tags[0]] ?? '실전 케이스' : '실전 케이스'),
    dateLabel: feedDateLabel(it.published_at ?? it.created_at),
    readMin: it.read_min,
  }));

  return (
    <>
      <CategoryHero
        title="AI 실전케이스"
        description="현업 워크플로우에서 직접 실험한 케이스, 업무에 바로 적용해 보세요."
      />
      <div className="mx-auto max-w-[1100px] px-6 py-10 pb-20 flex gap-12">
        <main className="flex-1 min-w-0">
          <CaseCategoryTabs activeCat={activeCat} activeJob={activeJob} />
          {items.length === 0 ? (
            <div className="card p-10 text-center text-ink/40">
              조건에 맞는 콘텐츠가 아직 없어요.
            </div>
          ) : (
            <>
              <FeedCardList items={feedItems} className="md:hidden" />
              <div className="hidden md:block">
                {items.map((it) => (
                  <CaseArticle key={it.id} item={it} />
                ))}
              </div>
            </>
          )}
        </main>
        <JobFilterSidebar activeJob={activeJob} activeCat={activeCat} counts={counts} />
      </div>
    </>
  );
}
