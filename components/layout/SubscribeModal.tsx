'use client';

import { useEffect, useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { track } from '@/lib/analytics/track';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscribeModal({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [consented, setConsented] = useState(false);
  const [done, setDone] = useState(false);
  const [already, setAlready] = useState(false); // 로그인 유저가 이미 구독 중
  const [pending, startTransition] = useTransition();
  const supabase = createSupabaseBrowserClient();

  // 모달 열림 + 로그인 → 계정 정보 자동 채움 + 구독 여부 확인.
  // 닫히면 입력값 초기화.
  useEffect(() => {
    if (!open) {
      setEmail('');
      setName('');
      setConsented(false);
      setDone(false);
      setAlready(false);
      return;
    }
    if (!user) return;
    setEmail(user.email ?? '');
    const displayName =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      '';
    setName(displayName);
    let active = true;
    supabase
      .from('profiles')
      .select('newsletter')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (active && data?.newsletter) setAlready(true);
      });
    return () => {
      active = false;
    };
  }, [open, user, supabase]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !consented) return;
    startTransition(async () => {
      if (user && email === user.email) {
        // 로그인 유저(계정 이메일) → profiles.newsletter (트리거가 Brevo 동기화)
        await supabase.from('profiles').update({ newsletter: true }).eq('id', user.id);
      } else {
        // 비로그인 또는 다른 이메일 입력 → newsletter_subscribers (중복 이메일은 무시)
        await supabase
          .from('newsletter_subscribers')
          .upsert(
            { email, name: name || null, source: 'modal', consented: true },
            { onConflict: 'email', ignoreDuplicates: true },
          );
      }
      // 구독 성공 → 뉴스레터 퍼널(subscribe) 적재. 로그인 계정이면 'profile', 그 외 입력은 'modal'.
      void track('subscribe', { source: user && email === user.email ? 'profile' : 'modal' });
      setDone(true);
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>구독하기</DialogTitle>
          <DialogDescription>
            새 콘텐츠가 나오면 메일로 알려드릴게요. 광고는 절대 보내지 않아요.
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="py-6 text-center">
            <p className="text-sm">구독해 주셔서 고마워요. 첫 메일로 인사드릴게요. 🙏</p>
          </div>
        ) : already ? (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm">이미 구독 중이에요 ✓<br />새 콘텐츠가 나오면 메일로 알려드릴게요.</p>
            <Button variant="accent" className="w-full" onClick={() => onOpenChange(false)}>
              닫기
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label htmlFor="sub-name">이름 (선택)</Label>
              <Input
                id="sub-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
              />
            </div>
            <div>
              <Label htmlFor="sub-email">이메일</Label>
              <Input
                id="sub-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <label className="flex items-start gap-2 text-xs text-ink/70 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-3.5 w-3.5 accent-accent"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
              />
              <span>
                <a href="/legal/privacy" target="_blank" className="underline">개인정보 수집·이용</a>에 동의합니다. (이메일 수신용, 언제든 해지 가능)
              </span>
            </label>
            <Button type="submit" variant="accent" className="w-full" disabled={pending || !consented}>
              구독하기
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
