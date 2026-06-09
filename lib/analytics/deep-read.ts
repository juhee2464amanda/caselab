'use client';

import { useEffect } from 'react';
import { track } from './track';

interface Options {
  contentId: string;
  selector?: string;
  threshold?: number;
  durationMs?: number;
}

/**
 * 본문 영역이 화면에 `threshold` 이상 보인 채 `durationMs` 이상 머물면
 * `events.deep_read` 1회 insert + GA4 'deep_read' 이벤트 fire.
 * 한 페이지당 1번만 발화.
 */
export function useDeepRead({
  contentId,
  selector = 'main',
  threshold = 0.7,
  durationMs = 10_000,
}: Options) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const target = document.querySelector(selector);
    if (!target) return;

    let timer: number | null = null;
    let fired = false;

    function fire() {
      if (fired) return;
      fired = true;
      // 단일 경로(track.ts): events.deep_read + user_id + GA4
      void track('deep_read', { content_id: contentId });
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= threshold) {
          if (!timer && !fired) {
            timer = window.setTimeout(fire, durationMs);
          }
        } else if (timer) {
          window.clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: [threshold] }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, [contentId, selector, threshold, durationMs]);
}
