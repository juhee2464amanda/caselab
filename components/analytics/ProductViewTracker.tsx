'use client';

import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics/track';

/**
 * ebook 상세 페이지 진입 시 product_view 1회 발화.
 *
 * 결정 출처: §19 D21 (track wrapper) — product_view EventType
 *
 * ebook은 content_id 컬럼이 아니라 metadata.product_id로 적재한다.
 * 같은 productId 연속 중복 발화는 useRef로 방지.
 */
export function ProductViewTracker({ productId }: { productId: string }) {
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    if (firedRef.current === productId) return;
    firedRef.current = productId;
    void track('product_view', { product_id: productId });
  }, [productId]);

  return null;
}
