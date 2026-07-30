'use client';

import { useState } from 'react';
import { FeedCardList, type FeedItem } from '@/components/content/FeedCard';

/**
 * 최신 콘텐츠 세로 피드 — 모바일 전용 (케이스·트렌드·도구·프롬프트 혼합, 최신순)
 *
 * 카드 포맷은 목록 페이지들과 공유한다 → components/content/FeedCard.tsx
 * 초기 N개 + '더보기' 버튼 점진 노출 — 전체 목록은 서버에서 한 번에 내려받고
 * 클라이언트에서 개수만 늘린다(추가 fetch 없음).
 */

export type { FeedItem };

const STEP = 6;

export function LatestFeed({
  items,
  initialCount = 6,
}: {
  items: FeedItem[];
  initialCount?: number;
}) {
  const [count, setCount] = useState(initialCount);

  if (items.length === 0) {
    return <div className="py-8 text-center text-sm text-ink/40">아직 콘텐츠가 없어요.</div>;
  }

  return (
    <>
      <FeedCardList items={items.slice(0, count)} className="mt-4" />
      {count < items.length && (
        <button
          type="button"
          onClick={() => setCount((c) => c + STEP)}
          className="mt-2 w-full rounded-lg border border-border bg-white py-2.5 text-sm font-semibold text-ink/70 active:bg-muted"
        >
          더보기 +
        </button>
      )}
    </>
  );
}
