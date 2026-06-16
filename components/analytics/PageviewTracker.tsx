'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics/track';

/**
 * 라우트(pathname) 변경 시마다 page_view(pv) 1회 발화.
 *
 * 결정 출처: §19 D21 (track wrapper) — pv EventType
 *
 * 같은 path 연속 중복 발화는 useRef로 방지.
 */
export function PageviewTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    void track('pv', { path: pathname });
  }, [pathname]);

  return null;
}
