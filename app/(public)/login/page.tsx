'use client';

import { Suspense, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics/track';

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
  reset_link_invalid: '비밀번호 재설정 링크가 만료되었거나 이미 사용됐어요. 다시 요청해 주세요.',
};

/** 콜백이 차단 시 넘겨주는 provider 값 → 사용자 표기 라벨 */
const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  kakao: '카카오',
  email: '이메일',
};

/** signInWithPassword 에러를 사용자 친화적으로 변환 */
function translateLoginError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid')) {
    return '이메일 또는 비밀번호가 올바르지 않아요.';
  }
  if (m.includes('email not confirmed')) {
    return '이메일 인증이 필요해요.';
  }
  return '로그인 처리 중 문제가 발생했어요. 다시 시도해 주세요.';
}

/** Google 공식 4-color "G" 마크 */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

/** Kakao 공식 말풍선 심볼 */
function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="#000000"
        d="M12 3C6.477 3 2 6.463 2 10.733c0 2.724 1.81 5.117 4.546 6.487-.2.736-.726 2.67-.83 3.084-.13.516.19.51.398.371.164-.108 2.6-1.762 3.66-2.48.726.104 1.473.16 2.226.16 5.523 0 10-3.463 10-7.733C22 6.463 17.523 3 12 3z"
      />
    </svg>
  );
}

function LoginInner() {
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const errorParam = params.get('error');
  const [error, setError] = useState<string | null>(() => {
    if (!errorParam) return null;
    // 이미 다른 방식으로 가입된 이메일 → 최초 가입 방식으로 안내
    if (errorParam === 'email_in_use') {
      const providerParam = params.get('provider');
      const label = providerParam ? (PROVIDER_LABEL[providerParam] ?? providerParam) : '다른 방법';
      return `이미 ${label}(으)로 가입된 계정이에요. ${label} 로그인을 이용해 주세요.`;
    }
    return ERROR_MESSAGES[errorParam] ?? '로그인에 실패했어요. 다시 시도해 주세요.';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  function loginWith(provider: 'google' | 'kakao') {
    // OAuth는 리다이렉트로 성공 직후 코드가 실행 안 될 수 있어 클릭 의도 시점에 발화
    void track('login', { method: provider });
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // provider를 콜백에 전달 → "최초 가입 방식만 허용" 검증에 사용
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}&provider=${provider}`,
          // 카카오: Supabase가 account_email·profile_image·profile_nickname 3개를 항상 강제 요청함
          // (custom scopes 무시). → 카카오 콘솔 동의항목에서 이 3개가 모두 '사용/필수'여야 KOE205 안 남.
        },
      });
      if (error) setError(error.message);
    });
  }

  function loginEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(translateLoginError(error.message));
      else {
        void track('login', { method: 'email' });
        router.push(next);
      }
    });
  }

  const signupHref = next === '/' ? '/signup' : `/signup?next=${encodeURIComponent(next)}`;

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-serif text-2xl font-bold mb-2">
          케이스랩
        </Link>
        <p className="text-center text-sm text-ink/60 mb-8">
          소셜 또는 이메일로 로그인하세요.
        </p>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        {/* 소셜 로그인 — 브랜드 가이드 정합 (카카오 #FEE500 / Google white+border) */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => loginWith('kakao')}
            disabled={pending}
            className="relative flex h-12 w-full items-center justify-center rounded-lg bg-[#FEE500] text-[15px] font-medium text-black/85 transition hover:brightness-95 disabled:opacity-50"
          >
            <KakaoIcon className="absolute left-4 h-[18px] w-[18px]" />
            카카오로 계속하기
          </button>
          <button
            type="button"
            onClick={() => loginWith('google')}
            disabled={pending}
            className="relative flex h-12 w-full items-center justify-center rounded-lg border border-[#dadce0] bg-white text-[15px] font-medium text-[#3c4043] transition hover:bg-[#f8f9fa] disabled:opacity-50"
          >
            <GoogleIcon className="absolute left-4 h-[18px] w-[18px]" />
            Google로 계속하기
          </button>
        </div>

        {/* 소셜 가입은 폼이 없으므로 약관·개인정보는 고지(간주 동의). 마케팅 동의는 온보딩에서 별도 수집 */}
        <p className="mt-3 text-center text-[11px] leading-relaxed text-ink/40 keepall">
          소셜 계정으로 계속하면{' '}
          <Link href="/legal/terms" target="_blank" className="underline underline-offset-2">이용약관</Link> 및{' '}
          <Link href="/legal/privacy" target="_blank" className="underline underline-offset-2">개인정보처리방침</Link>에 동의하는 것으로 간주됩니다.
        </p>

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
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <Button type="submit" variant="accent" className="w-full" disabled={pending}>
            {pending ? '로그인 중…' : '로그인'}
          </Button>
        </form>

        <p className="mt-3 text-center text-xs text-ink/50">
          <Link href="/forgot-password" className="hover:text-ink/70 underline underline-offset-2">
            비밀번호를 잊으셨나요?
          </Link>
        </p>

        <p className="mt-5 text-center text-xs text-ink/50">
          아직 계정이 없으신가요?{' '}
          <Link href={signupHref} className="text-accent underline underline-offset-2">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
