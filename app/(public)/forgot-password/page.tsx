'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // 재설정 링크 → /reset-password 로 직접. token_hash 검증은 "새 비번 제출 시점"에만 수행
      // → 메일 스캐너/브라우저 prefetch가 링크를 미리 열어도 토큰이 소진되지 않음 (+ 브라우저 무관).
      // 이메일 템플릿: href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery"
      // (RedirectTo에 ?flow=recovery 쿼리가 있어 뒤의 &token_hash 연결이 유효함)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?flow=recovery`,
      });
      // 이메일 존재 여부를 노출하지 않기 위해, 에러가 나도 보낸 것으로 안내 (enumeration 방지)
      if (error && !/rate limit|too many/i.test(error.message)) {
        setSent(true);
        return;
      }
      if (error) {
        setError('잠시 후 다시 시도해 주세요. (요청이 많아요)');
        return;
      }
      setSent(true);
    });
  }

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-serif text-2xl font-bold mb-2">
          케이스랩
        </Link>
        <p className="text-center text-sm text-ink/60 mb-8">
          비밀번호를 잊으셨나요? 재설정 링크를 보내드려요.
        </p>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        {sent ? (
          <div className="rounded-md bg-muted px-4 py-5 text-center text-sm text-ink/70 leading-relaxed">
            <strong className="block text-ink mb-1">메일을 확인해 주세요</strong>
            입력하신 이메일로 가입된 계정이 있다면 비밀번호 재설정 링크를 보냈어요.
            <br />몇 분 내 도착하지 않으면 스팸함도 확인해 주세요.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <Button type="submit" variant="accent" className="w-full" disabled={pending}>
              {pending ? '보내는 중…' : '재설정 링크 받기'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-ink/50">
          <Link href="/login" className="text-accent underline underline-offset-2">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
