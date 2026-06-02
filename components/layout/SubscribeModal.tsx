'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscribeModal({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const supabase = createSupabaseBrowserClient();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    startTransition(async () => {
      // 구독 요청은 opinions에 type='subscribe'로 임시 저장
      await supabase.from('opinions').insert({
        body: `구독 신청: ${name || '익명'}`,
        email,
      });
      setDone(true);
      setTimeout(() => {
        onOpenChange(false);
        setDone(false);
        setEmail('');
        setName('');
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
            <Button type="submit" variant="accent" className="w-full" disabled={pending}>
              구독하기
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
