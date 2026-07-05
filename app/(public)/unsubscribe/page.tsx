import type { Metadata } from 'next';
import { unsubscribeTokenValid } from '@/lib/newsletter/unsubscribe';
import { UnsubscribeConfirm } from './UnsubscribeConfirm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '뉴스레터 수신거부',
  robots: { index: false },
};

/**
 * 뉴스레터 수신거부 랜딩.
 * 메일 푸터 링크(/unsubscribe?email=...&t=HMAC)로 진입 →
 * 토큰 검증 후 확인 버튼 → POST /api/newsletter/unsubscribe.
 * 즉시 처리하지 않는 이유: 메일 클라이언트의 링크 프리페치 오작동 방지.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; t?: string }>;
}) {
  const params = await searchParams;
  const email = (params.email ?? '').trim().toLowerCase();
  const token = params.t ?? '';
  const valid = !!email && !!token && unsubscribeTokenValid(email, token);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-6 text-center">
        <h1 className="font-serif text-xl font-semibold">뉴스레터 수신거부</h1>
        {valid ? (
          <UnsubscribeConfirm email={email} token={token} />
        ) : (
          <p className="mt-4 text-sm text-ink/60">
            유효하지 않은 링크예요. 받으신 메일의 수신거부 링크를 다시 확인해 주세요.
            <br />
            로그인 회원은 마이페이지 &gt; 프로필에서 언제든 수신 설정을 바꿀 수 있어요.
          </p>
        )}
      </div>
    </div>
  );
}
