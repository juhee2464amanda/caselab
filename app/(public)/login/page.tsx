'use client';

import { Suspense, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] grid place-items-center text-sm text-ink/40">로딩…</div>}>
      <LoginInner />
    </Suspense>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: '소셜 로그인이 취소되었어요. 다시 시도해 주세요.',
  exchange_failed: '로그인 처리 중 문제가 발생했어요. 다시 시도해 주세요.',
  missing_code: '로그인 정보가 전달되지 않았어요. 다시 시도해 주세요.',
};

function LoginInner() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const errorParam = params.get('error');
  const [error, setError] = useState<string | null>(
    errorParam ? (ERROR_MESSAGES[errorParam] ?? '로그인에 실패했어요. 다시 시도해 주세요.') : null
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  function loginWith(provider: 'google' | 'kakao') {
    startTransition(async () => {
      if (provider === 'kakao') {
        // 운영 시 Edge Function 프록시로 분기 — Phase 0 PoC 후 활성화
        const fn = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}/functions/v1/kakao-oauth?next=${encodeURIComponent(next)}`;
        window.location.href = fn;
        return;
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) setError(error.message);
    });
  }

  function loginEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push(next);
    });
  }

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-serif text-2xl font-bold mb-2">
          케이스랩
        </Link>
        <p className="text-center text-sm text-ink/60 mb-8">
          이메일과 비밀번호로, 또는 소셜로 로그인하세요.
        </p>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="space-y-2 mb-6">
          <Button
            variant="outline"
            className="w-full bg-yellow-300 hover:bg-yellow-400 border-yellow-400"
            onClick={() => loginWith('kakao')}
            disabled={pending}
          >
            <span className="font-bold">K</span> 카카오로 시작하기
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => loginWith('google')}
            disabled={pending}
          >
            Google로 시작하기
          </Button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-bg px-2 text-ink/40">또는 이메일</span>
          </div>
        </div>

        <form onSubmit={loginEmail} className="space-y-3">
          <div>
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" variant="accent" className="w-full" disabled={pending}>
            로그인
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-ink/50">
          처음이신가요? 위 소셜 로그인으로 자동 가입돼요.
        </p>
      </div>
    </div>
  );
}
