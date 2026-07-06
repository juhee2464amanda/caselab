'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics/track';

export function OrderForm({
  book,
  defaults,
  alreadySubscribed = false,
}: {
  book: { id: string; title: string; price: number };
  defaults?: { name: string; email: string };
  /** 이미 뉴스레터 구독 중(profiles.newsletter=true) — [선택] 구독 체크박스 숨김 */
  alreadySubscribed?: boolean;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [name, setName] = useState(defaults?.name ?? '');
  const [email, setEmail] = useState(defaults?.email ?? '');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const free = book.price === 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agreed) {
      setError('개인정보 수집·이용 동의가 필요합니다.');
      return;
    }
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
      // 주문 성공 → 구매 퍼널 하단(ebook_order) 적재
      void track('ebook_order', { product_id: book.id });
      // [선택] 뉴스레터 동의 → 본인 profiles.newsletter=true (RLS 본인 update).
      // 0019 트리거가 Brevo 구독까지 전파. 실패해도 주문은 이미 완료라 막지 않음.
      if (newsletter && user) {
        await supabase.from('profiles').update({ newsletter: true }).eq('id', user.id);
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
        {newsletter && (
          <p className="mt-2 text-sm text-ink/50">뉴스레터 구독도 완료됐어요. 언제든 마이페이지에서 바꿀 수 있어요.</p>
        )}
        <Button onClick={() => router.push('/mypage/ebooks')} variant="accent" className="mt-8">
          구매한 전자책 보기
        </Button>
      </div>
    );
  }

  return (
    <div className="container-narrow py-10">
      <h1 className="mb-1 font-serif text-2xl font-semibold">{book.title}</h1>
      <p className="mb-8 text-ink/60">{free ? '무료' : `${book.price.toLocaleString()}원`}</p>

      <form onSubmit={submit} className="card space-y-4 p-6">
        <div>
          <Label htmlFor="name">
            이름 <span className="text-accent">*</span>
          </Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
        </div>
        <div>
          <Label htmlFor="phone">
            전화번호 <span className="text-accent">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
          />
        </div>
        <div>
          <Label htmlFor="email">
            이메일 <span className="text-accent">*</span>{' '}
            <span className="text-xs font-normal text-ink/40">(PDF 다운로드 링크 발송)</span>
          </Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>

        <label className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3.5 text-sm">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
          />
          <span className="text-ink/80">
            <span className="font-semibold text-accent">[필수]</span> 개인정보 수집·이용에 동의합니다.{' '}
            <Link
              href="/legal/privacy"
              target="_blank"
              className="underline underline-offset-2 hover:text-ink"
            >
              개인정보 처리방침
            </Link>
            <span className="mt-1 block text-xs text-ink/45">
              수집 항목: 이름·전화번호·이메일 / 목적: 전자책 발송 및 안내 / 보유: 발송 완료 후 1년
            </span>
          </span>
        </label>

        {!alreadySubscribed && (
          <label className="flex items-start gap-2.5 rounded-lg border border-border p-3.5 text-sm">
            <input
              type="checkbox"
              checked={newsletter}
              onChange={(e) => setNewsletter(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
            />
            <span className="text-ink/80">
              <span className="font-semibold text-ink/50">[선택]</span> 케이스랩 뉴스레터도 받아볼게요.
              <span className="mt-1 block text-xs text-ink/45">
                새 콘텐츠·AI 활용 사례를 주 1회 보내드려요. 마케팅 정보 수신 동의이며, 언제든 수신거부할 수 있어요.
              </span>
            </span>
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" variant="accent" className="w-full" disabled={pending || !agreed}>
          {free ? '무료로 받기' : '주문하기'}
        </Button>
      </form>
    </div>
  );
}
