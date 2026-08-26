import { Suspense } from 'react';
import { listPublishedContents } from '@/lib/data/contents';
import { CategoryHero } from '@/components/cases/CategoryHero';
import { CasesList, CasesListFallback, type JobCounts } from '@/components/cases/CasesList';
import type { JobTag } from '@/types/content';

// searchParams 필터는 CasesList(클라이언트)에서 적용 → 페이지는 정적(ISR) 유지
export const dynamic = 'force-static';
export const revalidate = 60;

export default async function CasesPage() {
  const allCases = await listPublishedContents({ track: 'case' });

  const counts: JobCounts = {
    all: allCases.length,
    planning: 0,
    marketing: 0,
    sales: 0,
    solo: 0,
    strategy: 0,
    analysis: 0,
    revenue_kpi: 0,
    customer_research: 0,
  };
  for (const c of allCases) {
    for (const t of c.job_tags as string[]) {
      if (t in counts) counts[t as JobTag] += 1;
    }
  }

  // body는 목록에 불필요 — 클라이언트로 내려보내는 payload에서 제거
  const items = allCases.map(({ body: _body, ...rest }) => rest);

  return (
    <>
      <CategoryHero
        title="AI 실전케이스"
        description="현업 워크플로우에서 직접 실험한 케이스, 업무에 바로 적용해 보세요."
      />
      <Suspense fallback={<CasesListFallback items={items} counts={counts} />}>
        <CasesList items={items} counts={counts} />
      </Suspense>
    </>
  );
}
