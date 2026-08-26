'use client';

import { useSearchParams } from 'next/navigation';
import { stripInlineMd } from '@/lib/inline-md';
import { ToolCategoryTabs } from '@/components/tools/ToolCategoryTabs';
import { ToolCard } from '@/components/tools/ToolCard';
import { FeedCardList, feedDateLabel, type FeedItem } from '@/components/content/FeedCard';
import {
  TOOL_CATEGORIES,
  TOOL_CATEGORY_LABELS,
  type Tool,
  type ToolCategory,
} from '@/types/tool';

/**
 * /tools 목록 — 필터를 클라이언트에서 적용한다.
 * 전체 목록을 정적(ISR) HTML로 내려보내고 ?category= 는 여기서 거른다.
 * (이전엔 searchParams를 서버에서 읽어 매 요청 동적 렌더링)
 */
function ToolsListView({
  items,
  activeCategory,
}: {
  items: Tool[];
  activeCategory?: ToolCategory;
}) {
  const filtered = activeCategory ? items.filter((t) => t.category === activeCategory) : items;

  // 모바일 피드 카드 — 홈 '최신 콘텐츠'와 동일 포맷 (데스크톱은 아래 카드 그리드 유지)
  const feedItems: FeedItem[] = filtered.map((t) => ({
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
    <div className="mx-auto max-w-[1100px] px-6 py-10 pb-20">
      <ToolCategoryTabs activeCategory={activeCategory} />
      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-ink/40">
          조건에 맞는 도구가 아직 없어요.
        </div>
      ) : (
        <>
          <FeedCardList items={feedItems} className="md:hidden" />
          <div className="hidden md:grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ToolsList({ items }: { items: Tool[] }) {
  const sp = useSearchParams();
  const rawCat = sp.get('category') ?? '';
  const activeCategory = (TOOL_CATEGORIES as readonly string[]).includes(rawCat)
    ? (rawCat as ToolCategory)
    : undefined;

  return <ToolsListView items={items} activeCategory={activeCategory} />;
}

/** Suspense fallback 용 — 정적 HTML에는 무필터 전체 목록이 실린다. */
export function ToolsListFallback({ items }: { items: Tool[] }) {
  return <ToolsListView items={items} />;
}
