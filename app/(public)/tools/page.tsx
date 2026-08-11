import { listTools } from '@/lib/data/tools';
import { stripInlineMd } from '@/lib/inline-md';
import { CategoryHero } from '@/components/cases/CategoryHero';
import { ToolCategoryTabs } from '@/components/tools/ToolCategoryTabs';
import { ToolCard } from '@/components/tools/ToolCard';
import { FeedCardList, feedDateLabel, type FeedItem } from '@/components/content/FeedCard';
import { TOOL_CATEGORIES, TOOL_CATEGORY_LABELS, type ToolCategory } from '@/types/tool';

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

  // 모바일 피드 카드 — 홈 '최신 콘텐츠'와 동일 포맷 (데스크톱은 아래 카드 그리드 유지)
  const feedItems: FeedItem[] = items.map((t) => ({
    id: t.id,
    href: `/tools/${t.slug}`,
    title: t.name,
    summary: t.description ? stripInlineMd(t.description) : null,
    thumbnail_url: t.thumbnail_url,
    thumbEmoji: t.thumbnail_emoji ?? '🛠️',
    badge: TOOL_CATEGORY_LABELS[t.category],
    dateLabel: feedDateLabel(t.created_at),
  }));

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
          <>
            <FeedCardList items={feedItems} className="md:hidden" />
            <div className="hidden md:grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => (
                <ToolCard key={t.id} tool={t} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
