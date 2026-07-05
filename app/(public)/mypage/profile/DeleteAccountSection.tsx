'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * 회원 탈퇴 섹션 (마이페이지 > 프로필 하단).
 * '탈퇴' 확인 문구를 직접 입력해야 실행 — 계정·댓글·리뷰·저장 등 회원 데이터가
 * 즉시 파기되고 복구할 수 없음을 고지한다.
 */
export function DeleteAccountSection() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function deleteAccount() {
    startTransition(async () => {
      setError(null);
      const res = await fetch('/api/account/delete', { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? '탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요.');
        return;
      }
      // 계정은 이미 삭제됨 — 로컬 세션 정리 실패해도 진행
      await supabase.auth.signOut().catch(() => undefined);
      router.push('/');
      router.refresh();
    });
  }

  return (
    <div className="card p-6 max-w-2xl mt-6 border-red-200">
      <h2 className="font-serif text-lg font-semibold text-red-700">회원 탈퇴</h2>
      <p className="mt-1 text-xs text-ink/60">
        탈퇴하면 계정과 프로필, 댓글·리뷰·저장 목록이 즉시 삭제되며 복구할 수 없어요.
        뉴스레터 수신도 함께 중단돼요.
      </p>

      {!open ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-red-300 text-red-700 hover:bg-red-50"
          onClick={() => setOpen(true)}
        >
          탈퇴 진행
        </Button>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-ink/80">
            정말 탈퇴하시려면 아래에 <strong>탈퇴</strong>라고 입력해 주세요.
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="탈퇴"
            className="max-w-40"
          />
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="border-red-300 bg-red-600 text-white hover:bg-red-700"
              disabled={pending || confirmText.trim() !== '탈퇴'}
              onClick={deleteAccount}
            >
              {pending ? '삭제 중…' : '영구 삭제'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              취소
            </Button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
