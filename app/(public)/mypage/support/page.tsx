import Link from 'next/link';
import { Button } from '@/components/ui/button';

const FAQS = [
  { q: '왜 광고가 하나도 없나요?', a: '“광고 0”이 운영 원칙입니다. 콘텐츠 신뢰가 깨지는 순간 매거진이 안 되더라고요.' },
  { q: '콘텐츠는 얼마나 자주 발행되나요?', a: '주 1~2개 페이스를 목표로 하고 있어요. 후보 카드에서 다음 주제를 알 수 있어요.' },
  { q: '전자책은 정말 무료인가요?', a: '네, 이메일 수집 외에는 어떤 비용도 없어요. 답례로 가끔 새 콘텐츠를 알려드릴게요.' },
];

export default function SupportPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-semibold mb-3">FAQ</h2>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details key={i} className="card p-4">
              <summary className="font-medium cursor-pointer">{f.q}</summary>
              <p className="mt-2 text-sm text-ink/70 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="card p-6">
        <h2 className="font-semibold mb-2">1:1 문의</h2>
        <p className="text-sm text-ink/60 mb-4">
          답이 안 보이면 의견 보내기로 알려주세요. 평일 24시간 이내 회신.
        </p>
        <Link href="/opinions/new">
          <Button variant="accent">의견 보내기</Button>
        </Link>
      </section>
    </div>
  );
}
