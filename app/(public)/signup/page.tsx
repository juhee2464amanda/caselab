'use client';

import { Suspense, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics/track';
import { cn } from '@/lib/utils';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] grid place-items-center text-sm text-ink/40">로딩…</div>}>
      <SignupInner />
    </Suspense>
  );
}

/** Supabase signUp 에러 메시지를 사용자 친화적으로 변환 */
function translateSignupError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('user already')) {
    return '이미 가입된 이메일이에요. 로그인해 주세요.';
  }
  if (m.includes('password') && (m.includes('at least') || m.includes('characters'))) {
    return '비밀번호는 8자 이상이어야 해요.';
  }
  if (m.includes('valid email') || m.includes('invalid email')) {
    return '올바른 이메일 형식이 아니에요.';
  }
  return '회원가입 처리 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.';
}

function SignupInner() {
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false); // [필수] 만14세+약관+개인정보
  const [marketing, setMarketing] = useState(false); // [선택] 마케팅 수신 동의
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // 서버 정책(Supabase: 8자+영문·숫자·특수문자)과 일치시키는 클라이언트 검사
  function passwordOk(pw: string): boolean {
    return (
      pw.length >= 8 &&
      /[A-Za-z]/.test(pw) &&
      /\d/.test(pw) &&
      /[^A-Za-z0-9]/.test(pw)
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agree) {
      setError('필수 약관에 동의해 주세요.');
      return;
    }
    if (!passwordOk(password)) {
      setError('비밀번호는 8자 이상이며 영문·숫자·특수문자를 모두 포함해야 해요.');
      return;
    }
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않아요.');
      return;
    }
    startTransition(async () => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        // 트리거(handle_new_user)가 메타데이터를 profiles로 반영:
        //   full_name → name, newsletter → 마케팅 수신 동의 (0013)
        options: { data: { full_name: name.trim(), newsletter: marketing } },
      });
      if (error) {
        setError(translateSignupError(error.message));
        return;
      }
      void track('signup', { method: 'email' });
      // Confirm email OFF 정책 → 가입 즉시 세션 발급 → middleware가 /onboarding으로 유도
      router.push(next);
    });
  }

  // 실시간 비밀번호 규칙 표시 (작성 전엔 회색 가이드, 작성 중엔 충족=초록 / 미충족=빨강)
  const pwStarted = password.length > 0;
  const pwChecks = [
    { label: '8자 이상', ok: password.length >= 8 },
    { label: '영문', ok: /[A-Za-z]/.test(password) },
    { label: '숫자', ok: /\d/.test(password) },
    { label: '특수문자', ok: /[^A-Za-z0-9]/.test(password) },
  ];

  const loginHref = next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`;

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-serif text-2xl font-bold mb-2">
          케이스랩
        </Link>
        <p className="text-center text-sm text-ink/60 mb-8">
          이메일로 케이스랩 계정을 만들어요.
        </p>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="name">이름</Label>
            <Input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div>
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {pwChecks.map((c) => (
                <span
                  key={c.label}
                  className={cn(
                    'flex items-center gap-1',
                    !pwStarted ? 'text-ink/40' : c.ok ? 'text-green-600' : 'text-red-500'
                  )}
                >
                  <span aria-hidden>{!pwStarted ? '•' : c.ok ? '✓' : '✕'}</span>
                  {c.label}
                </span>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="confirm">비밀번호 확인</Label>
            <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            {confirm.length > 0 && (
              <p
                className={cn(
                  'mt-1.5 flex items-center gap-1 text-xs',
                  password === confirm ? 'text-green-600' : 'text-red-500'
                )}
              >
                <span aria-hidden>{password === confirm ? '✓' : '✕'}</span>
                {password === confirm ? '비밀번호가 일치해요' : '비밀번호가 일치하지 않아요'}
              </p>
            )}
          </div>

          {/* 동의 — 필수(약관·개인정보·만14세) + 선택(마케팅) */}
          <div className="space-y-2.5 pt-1">
            <label className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
              />
              <span className="text-ink/80 keepall">
                <span className="text-accent font-medium">[필수]</span> 만 14세 이상이며,{' '}
                <Link href="/legal/terms" target="_blank" className="underline underline-offset-2">이용약관</Link> 및{' '}
                <Link href="/legal/privacy" target="_blank" className="underline underline-offset-2">개인정보 수집·이용</Link>에 동의합니다.
              </span>
            </label>
            <label className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
              />
              <span className="text-ink/80 keepall">
                <span className="text-ink/40 font-medium">[선택]</span> 뉴스레터·웨비나·새 콘텐츠 안내 등 마케팅 정보 수신에 동의합니다.
              </span>
            </label>
          </div>

          <Button type="submit" variant="accent" className="w-full" disabled={pending || !agree}>
            {pending ? '가입 중…' : '회원가입'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-ink/50">
          이미 계정이 있으신가요?{' '}
          <Link href={loginHref} className="text-accent underline underline-offset-2">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
