import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { getProductBySlug } from '@/lib/data/products';
import { Button } from '@/components/ui/button';

export const revalidate = 60;

export default async function EbookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await getProductBySlug(slug);
  if (!book) notFound();

  const body = book.body ?? {};
  const isFree = book.price === 0;
  const orderHref = `/ebooks/${slug}/order`;

  return (
    <div>
      {/* Hero */}
      <section className="bg-muted border-b border-border">
        <div className="mx-auto max-w-[1100px] px-6 py-12 md:py-16">
          <span className="inline-block text-[11px] font-bold text-accent bg-accent-50 px-2.5 py-1 rounded mb-3 tracking-[0.04em]">
            {isFree ? 'FREE EBOOK' : 'EBOOK'}
          </span>
          <h1 className="text-[28px] md:text-[38px] font-extrabold tracking-[-0.03em] leading-[1.2] break-keep max-w-[680px]">
            {book.title}
          </h1>
          {book.description && (
            <p className="mt-4 text-base text-ink/60 leading-relaxed max-w-[560px] break-keep">
              {book.description}
            </p>
          )}
          {body.stats && body.stats.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-8">
              {body.stats.map((s, i) => (
                <div key={i}>
                  <div className="text-2xl font-extrabold tracking-[-0.02em]">{s.num}</div>
                  <div className="text-[13px] text-ink/50 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}
          <Link href={orderHref}>
            <Button variant="accent" size="lg" className="mt-7">
              {isFree ? '이메일로 받기' : '주문하기'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-6 py-12">
        {/* 커버 + 목차 */}
        <div className="grid gap-10 lg:grid-cols-[300px_1fr] items-start">
          <div className="aspect-[3/4] rounded-lg bg-white border border-border relative overflow-hidden shadow-elevated">
            {book.thumbnail_url ? (
              <img src={book.thumbnail_url} alt={book.title} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col justify-center gap-2 p-6 bg-gradient-to-br from-muted to-border">
                <div className="font-serif text-xl font-bold leading-snug break-keep">{book.title}</div>
                {body.subtitle && <div className="text-xs text-ink/50">{body.subtitle}</div>}
              </div>
            )}
            <div className="absolute right-0 inset-y-0 w-2 bg-black/10" />
          </div>

          {body.toc && body.toc.length > 0 && (
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.025em] mb-4">목차</h2>
              <ol className="space-y-0 border-t border-border">
                {body.toc.map((t, i) => (
                  <li key={i} className="flex gap-4 py-3.5 border-b border-border items-start">
                    <span className="text-[13px] font-extrabold text-ink/30 min-w-6">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="text-[15px] font-bold tracking-[-0.02em] mb-0.5 break-keep">{t.title}</div>
                      <div className="text-[13px] text-ink/60 leading-relaxed break-keep">{t.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* 이런 분에게 */}
        {body.whoFor && body.whoFor.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-extrabold tracking-[-0.025em] mb-5">이런 분에게 드립니다</h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {body.whoFor.map((w, i) => (
                <div key={i} className="p-5 border border-border rounded-xl bg-white">
                  <span className="text-2xl block mb-2">{w.icon}</span>
                  <div className="text-sm font-bold mb-1">{w.title}</div>
                  <div className="text-[13px] text-ink/60 leading-relaxed break-keep">{w.desc}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 하단 CTA */}
        <section className="mt-14 card p-8 text-center">
          <h2 className="text-xl font-extrabold tracking-[-0.02em]">
            {isFree ? '무료로 받아보세요' : '지금 주문하기'}
          </h2>
          <p className="mt-2 text-sm text-ink/60">
            {isFree ? '이메일을 입력하면 PDF를 바로 보내드립니다.' : '주문서를 작성하면 안내해드립니다.'}
          </p>
          <Link href={orderHref}>
            <Button variant="accent" size="lg" className="mt-5">
              {isFree ? '무료로 받기' : '주문하기'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>

        <div className="mt-8">
          <Link href="/ebooks" className="text-xs text-ink/50 hover:text-ink">← 전자책 목록으로</Link>
        </div>
      </div>
    </div>
  );
}
