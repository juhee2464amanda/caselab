'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';

export function UnsubscribeConfirm({ email, token }: { email: string; token: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function unsubscribe() {
    startTransition(async () => {
      setError(null);
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });
      if (res.ok) setDone(true);
      else {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? '처리에 실패했어요. 잠시 후 다시 시도해 주세요.');
      }
    });
  }

  if (done) {
    return (
      <p className="mt-4 text-sm text-ink/80">
        <strong>{email}</strong> 주소로 더 이상 뉴스레터를 보내지 않아요.
        <br />
        <span className="text-xs text-ink/50">마음이 바뀌면 언제든 다시 구독할 수 있어요.</span>
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-ink/70">
        <strong>{email}</strong> 주소의 뉴스레터 수신을 중단할까요?
      </p>
      <Button onClick={unsubscribe} disabled={pending} variant="accent" className="w-full">
        {pending ? '처리 중…' : '수신거부'}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
