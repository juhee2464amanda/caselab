'use client';

import { useScrollTracker } from '@/lib/analytics/scroll-tracker';

/**
 * useScrollTracker({ contentId }) 얇은 래퍼.
 * 콘텐츠 상세 페이지(client component)에서 마운트.
 */
export function ScrollTracker({ contentId }: { contentId?: string }) {
  useScrollTracker({ contentId });
  return null;
}
