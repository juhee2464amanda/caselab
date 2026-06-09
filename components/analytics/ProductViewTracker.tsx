'use client';

import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics/track';

/**
 * ebook(product) 상세 진입 시 events.product_view 1회 적재.
 * admin ebook view수·전환율(구매/조회) 원천. (events.product_id = 마이그레이션 0011 필요)
 */
export function ProductViewTracker({ productId }: { productId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void track('product_view', { product_id: productId });
  }, [productId]);
  return null;
}
