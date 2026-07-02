'use client';

import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics/track';

/**
 * 페이지 체류시간(dwell) 측정. 탭이 보이는 동안의 누적 초만 계산(백그라운드 제외).
 * 페이지를 떠날 때(visibilitychange=hidden / pagehide / 언마운트) 1회 track('dwell') 발화.
 * admin 가드레일 '체류시간' 위젯 원천.
 */
export function DwellTracker({ contentId }: { contentId?: string }) {
  const accMsRef = useRef(0);
  const startRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();

    function accumulate() {
      if (startRef.current != null) {
        accMsRef.current += Date.now() - startRef.current;
        startRef.current = null;
      }
    }

    function fire() {
      accumulate();
      if (firedRef.current) return;
      const seconds = Math.round(accMsRef.current / 1000);
      if (seconds <= 0) return;
      firedRef.current = true;
      void track('dwell', contentId ? { content_id: contentId, seconds } : { seconds });
    }

    function onVisibility() {
      if (document.visibilityState === 'hidden') fire();
      else if (startRef.current == null) startRef.current = Date.now(); // 복귀 시 재개
    }

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', fire);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', fire);
      fire(); // 라우트 이동(언마운트) 시에도 발화
    };
  }, [contentId]);

  return null;
}
