import { Suspense } from 'react';
import { listTools } from '@/lib/data/tools';
import { CategoryHero } from '@/components/cases/CategoryHero';
import { ToolsList, ToolsListFallback } from '@/components/tools/ToolsList';

// searchParams 필터는 ToolsList(클라이언트)에서 적용 → 페이지는 정적(ISR) 유지
export const dynamic = 'force-static';
export const revalidate = 60;

export default async function ToolsPage() {
  const items = await listTools();

  return (
    <>
      <CategoryHero
        title="쓸만한 AI 도구"
        description="검증된 AI 도구만 모았습니다. 직접 써보고 정리했어요."
      />
      <Suspense fallback={<ToolsListFallback items={items} />}>
        <ToolsList items={items} />
      </Suspense>
    </>
  );
}
