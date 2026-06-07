'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function OrderForm({
  book,
}: {
  book: { id: string; title: string; price: number };
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from('purchases').insert({
        product_id: book.id,
        user_id: user?.id ?? null,
        name,
        email,
        phone,
        amount: book.price,
        status: 'pending',
      });
      if (error) {
        setError(error.message);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="container-narrow py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold">신청 완료 🎉</h1>
        <p className="mt-3 text-ink/70">
          입력하신 이메일로 다운로드 링크를 보내드릴게요.<br />
          (보통 1분 내 도착. 스팸 폴더도 확인해주세요)
        </p>
        <Button onClick={() => router.push('/')} variant="accent" className="mt-8">
          메인으로
        </Button>
      </div>
    );
  }

  return (
    <div className="container-narrow py-10">
      <h1 className="font-serif text-2xl font-semibold mb-1">{book.title}</h1>
      <p className="text-ink/60 mb-8">
        {book.price === 0 ? '무료' : `${book.price.toLocaleString()}원`}
      </p>

      <form onSubmit={submit} className="space-y-4 card p-6">
        <div>
          <Label htmlFor="name">이름</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="email">이메일 (PDF 발송)</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="phone">연락처 (선택)</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" variant="accent" className="w-full" disabled={pending}>
          {book.price === 0 ? '무료로 받기' : '주문하기'}
        </Button>
      </form>
    </div>
  );
}
