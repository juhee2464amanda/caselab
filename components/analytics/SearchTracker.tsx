'use client';

import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics/track';

/**
 * 검색 결과 페이지에서 events.search 1회 적재 (admin 인기 검색어·신규 검색어 원천).
 * 같은 keyword 재렌더 시 중복 발화 방지.
 */
export function SearchTracker({ keyword, resultsCount }: { keyword: string; resultsCount: number }) {
  const fired = useRef<string>('');
  useEffect(() => {
    const kw = keyword.trim();
    if (!kw || fired.current === kw) return;
    fired.current = kw;
    void track('search', { keyword: kw, results_count: resultsCount });
  }, [keyword, resultsCount]);
  return null;
}
