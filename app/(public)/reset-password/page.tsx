'use client';

import { Suspense, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { EmailOtpType } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] grid place-items-center text-sm text-ink/40">로딩…</div>}>
      <ResetInner />
    </Suspense>
  );
}

/** updateUser 실패 사유를 사용자 친화적으로 변환 (미매핑은 원문 노출 — 진단용) */
function translateUpdateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('different') || m.includes('same password') || m.includes('same as the old')) {
    return '직전 비밀번호와 같아요. 다른 비밀번호를 입력해 주세요.';
  }
  if (m.includes('weak') || m.includes('characters') || m.includes('at least')) {
    return '비밀번호는 8자 이상이며 영문·숫자·특수문자를 모두 포함해야 해요.';
  }
  return `변경 실패: ${message}`;
}

function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  // 메일 링크의 token_hash는 "제출 시점"에만 검증한다 (prefetch 토큰 소진 방지)
  const tokenHash = params.get('token_hash');
  const type = (params.get('type') as EmailOtpType | null) ?? 'recovery';

  const [ready, setReady] = useState<'checking' | 'ok' | 'invalid'>(
    tokenHash ? 'ok' : 'checking'
  );
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [verified, setVerified] = useState(false); // 토큰 1회 검증 후엔 세션으로 재시도 가능
  const [pending, startTransition] = useTransition();

  // token_hash가 없으면(직접 접근 등) 기존 세션이 있을 때만 허용
  useEffect(() => {
    if (tokenHash) return;
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (active) setReady(user ? 'ok' : 'invalid');
    })();
    return () => {
      active = false;
    };
  }, [supabase, tokenHash]);

  function passwordOk(pw: string): boolean {
    return pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordOk(password)) {
      setError('비밀번호는 8자 이상이며 영문·숫자·특수문자를 모두 포함해야 해요.');
      return;
    }
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않아요.');
      return;
    }
    startTransition(async () => {
      // 1) 링크로 들어왔으면 "제출 시점"에 1회 토큰 검증 → 세션 발급 (이미 검증됐으면 건너뜀 → 재시도 가능)
      if (tokenHash && !verified) {
        const { error: vErr } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
        if (vErr) {
          setError('재설정 링크가 만료되었거나 이미 사용됐어요. 다시 요청해 주세요.');
          return;
        }
        setVerified(true);
      }
      // 2) 새 비밀번호 적용
      const { error: uErr } = await supabase.auth.updateUser({ password });
      if (uErr) {
        setError(translateUpdateError(uErr.message));
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/'), 1500);
    });
  }

  const pwStarted = password.length > 0;
  const pwChecks = [
    { label: '8자 이상', ok: password.length >= 8 },
    { label: '영문', ok: /[A-Za-z]/.test(password) },
    { label: '숫자', ok: /\d/.test(password) },
    { label: '특수문자', ok: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-serif text-2xl font-bold mb-2">
          케이스랩
        </Link>
        <p className="text-center text-sm text-ink/60 mb-8">
          새 비밀번호를 설정해 주세요.
        </p>

        {ready === 'checking' && (
          <p className="text-center text-sm text-ink/40">확인 중…</p>
        )}

        {ready === 'invalid' && (
          <div className="rounded-md bg-red-50 px-4 py-5 text-center text-sm text-red-600 leading-relaxed">
            유효하지 않거나 만료된 링크예요.
            <br />
            <Link href="/forgot-password" className="underline underline-offset-2">
              재설정 링크를 다시 요청
            </Link>
            해 주세요.
          </div>
        )}

        {ready === 'ok' && done && (
          <div className="rounded-md bg-muted px-4 py-5 text-center text-sm text-ink/70">
            <strong className="block text-ink mb-1">비밀번호가 변경됐어요</strong>
            잠시 후 자동으로 이동해요…
          </div>
        )}

        {ready === 'ok' && !done && (
          <>
            {error && (
              <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-600">
                {error}
              </p>
            )}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label htmlFor="password">새 비밀번호</Label>
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
                <Label htmlFor="confirm">새 비밀번호 확인</Label>
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
              <Button type="submit" variant="accent" className="w-full" disabled={pending}>
                {pending ? '변경 중…' : '비밀번호 변경'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
