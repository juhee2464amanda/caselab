import { listTools } from '@/lib/data/tools';
import { CategoryHero } from '@/components/cases/CategoryHero';
import { ToolCategoryTabs } from '@/components/tools/ToolCategoryTabs';
import { ToolCard } from '@/components/tools/ToolCard';
import { TOOL_CATEGORIES, type ToolCategory } from '@/types/tool';

export const revalidate = 60;

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: rawCat } = await searchParams;
  const activeCategory = (TOOL_CATEGORIES as readonly string[]).includes(
    rawCat ?? ''
  )
    ? (rawCat as ToolCategory)
    : undefined;

  const items = await listTools({ category: activeCategory });

  return (
    <>
      <CategoryHero
        title="쓸만한 AI 도구"
        description="검증된 AI 도구만 모았습니다. 직접 써보고 정리했어요."
      />
      <div className="mx-auto max-w-[1100px] px-6 py-10 pb-20">
        <ToolCategoryTabs activeCategory={activeCategory} />
        {items.length === 0 ? (
          <div className="card p-10 text-center text-ink/40">
            조건에 맞는 도구가 아직 없어요.
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
