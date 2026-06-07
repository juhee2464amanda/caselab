'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * 클라이언트단 로그인 상태 구독 훅 — GNB/MobileNav 등 전역 client 컴포넌트용.
 *
 * 마운트 시 getUser()로 초기 상태를 읽고, onAuthStateChange로 로그인/로그아웃을
 * 즉시 반영한다(전체 새로고침 불필요). 서버 세션은 미들웨어가 별도로 갱신한다.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
