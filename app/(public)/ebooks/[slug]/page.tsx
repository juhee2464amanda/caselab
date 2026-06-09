import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Star } from 'lucide-react';
import { getProductBySlug } from '@/lib/data/products';
import { Button } from '@/components/ui/button';
import { ProductViewTracker } from '@/components/analytics/ProductViewTracker';

export const revalidate = 60;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-accent">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          fill={i < Math.round(rating) ? 'currentColor' : 'none'}
          strokeWidth={i < Math.round(rating) ? 0 : 1.5}
        />
      ))}
    </span>
  );
}

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
  const cta = isFree ? '무료로 받기' : '주문하기';

  const meta = [
    body.format && { label: '포맷', value: body.format },
    body.volume && { label: '분량', value: body.volume },
    body.jobs && { label: '직무', value: body.jobs },
    body.updated && { label: '업데이트', value: body.updated },
    { label: '가격', value: isFree ? '무료' : `${book.price.toLocaleString()}원` },
  ].filter(Boolean) as { label: string; value: string }[];

  const tabs = [
    body.intro?.length && { id: 'intro', label: '책 소개' },
    body.toc?.length && { id: 'toc', label: '목차' },
    body.whoFor?.length && { id: 'who', label: '이런 분에게' },
    body.reviews?.length && { id: 'reviews', label: `리뷰 ${body.reviewCount ?? body.reviews?.length}` },
  ].filter(Boolean) as { id: string; label: string }[];

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-10 pb-20">
      <ProductViewTracker productId={book.id} />
      {/* Hero */}
      <section className="grid gap-8 md:grid-cols-[260px_1fr] items-start">
        <div className="aspect-[3/4] rounded-lg bg-white border border-border relative overflow-hidden shadow-elevated">
          {book.thumbnail_url ? (
            <img src={book.thumbnail_url} alt={book.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col justify-center gap-2 p-6 bg-gradient-to-br from-muted to-border">
              <div className="font-serif text-xl font-bold leading-snug break-keep">{book.title}</div>
              {body.subtitle && <div className="text-xs text-ink/50 line-clamp-3">{body.subtitle}</div>}
            </div>
          )}
          <div className="absolute right-0 inset-y-0 w-2 bg-black/10" />
        </div>

        <div>
          <span className="inline-block text-[11px] font-bold text-accent bg-accent-50 px-2.5 py-1 rounded mb-3 tracking-[0.04em]">
            {isFree ? '무료 배포' : 'EBOOK'}
          </span>
          <h1 className="text-[26px] md:text-[32px] font-extrabold tracking-[-0.03em] leading-[1.2] break-keep">
            {book.title}
          </h1>
          {body.subtitle && (
            <p className="mt-2.5 text-[15px] text-ink/60 leading-relaxed break-keep">{body.subtitle}</p>
          )}

          {body.rating != null && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Stars rating={body.rating} />
              <span className="font-bold">{body.rating.toFixed(1)}</span>
              {body.reviewCount != null && (
                <span className="text-ink/40">({body.reviewCount}개 리뷰)</span>
              )}
            </div>
          )}

          <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 border-t border-border pt-4">
            {meta.map((m) => (
              <div key={m.label} className="flex gap-3 text-sm">
                <dt className="w-16 shrink-0 text-ink/40">{m.label}</dt>
                <dd className="font-medium">{m.value}</dd>
              </div>
            ))}
          </dl>

          <Link href={orderHref}>
            <Button variant="accent" size="lg" className="mt-6 w-full sm:w-auto">
              {cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Detail tabs */}
      {tabs.length > 0 && (
        <nav className="sticky top-14 z-40 -mx-6 px-6 bg-bg border-b border-border mt-10 mb-8 flex gap-5 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <a key={t.id} href={`#${t.id}`} className="text-sm font-medium text-ink/50 hover:text-ink whitespace-nowrap">
              {t.label}
            </a>
          ))}
        </nav>
      )}

      {/* 책 소개 */}
      {body.intro && body.intro.length > 0 && (
        <section id="intro" className="mb-12 scroll-mt-28">
          <h2 className="text-xl font-extrabold tracking-[-0.025em] mb-4">책 소개</h2>
          <div className="space-y-3.5 max-w-[680px]">
            {body.intro.map((p, i) => (
              <p key={i} className="text-[15px] leading-[1.75] text-ink/80 break-keep">{p}</p>
            ))}
          </div>
        </section>
      )}

      {/* 목차 */}
      {body.toc && body.toc.length > 0 && (
        <section id="toc" className="mb-12 scroll-mt-28">
          <h2 className="text-xl font-extrabold tracking-[-0.025em] mb-4">목차</h2>
          <ol className="border-t border-border max-w-[680px]">
            {body.toc.map((t, i) => (
              <li key={i} className="flex gap-4 py-3.5 border-b border-border items-start">
                <span className="text-[13px] font-extrabold text-ink/30 min-w-6">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className="text-[15px] font-bold tracking-[-0.02em] mb-0.5 break-keep">{t.title}</div>
                  <div className="text-[13px] text-ink/60 leading-relaxed break-keep">{t.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 이런 분에게 */}
      {body.whoFor && body.whoFor.length > 0 && (
        <section id="who" className="mb-12 scroll-mt-28">
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

      {/* 리뷰 */}
      {body.reviews && body.reviews.length > 0 && (
        <section id="reviews" className="mb-12 scroll-mt-28">
          <div className="flex items-baseline gap-3 mb-5">
            <h2 className="text-xl font-extrabold tracking-[-0.025em]">리뷰</h2>
            {body.rating != null && (
              <span className="flex items-center gap-1.5 text-sm">
                <Stars rating={body.rating} />
                <span className="font-bold">{body.rating.toFixed(1)}</span>
                {body.reviewCount != null && <span className="text-ink/40">· {body.reviewCount}개</span>}
              </span>
            )}
          </div>
          <div className="space-y-3 max-w-[680px]">
            {body.reviews.map((r, i) => (
              <div key={i} className="p-4 border border-border rounded-xl bg-white">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold">{r.author}</span>
                  <Stars rating={r.rating} />
                </div>
                <p className="text-[13.5px] text-ink/70 leading-relaxed break-keep">{r.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 하단 CTA */}
      <section className="card p-8 text-center">
        <h2 className="text-xl font-extrabold tracking-[-0.02em]">
          {isFree ? '무료로 받아보세요' : '지금 주문하기'}
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          {isFree ? '이메일을 입력하면 PDF를 바로 보내드립니다.' : '주문서를 작성하면 안내해드립니다.'}
        </p>
        <Link href={orderHref}>
          <Button variant="accent" size="lg" className="mt-5">
            {cta}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      <div className="mt-8">
        <Link href="/ebooks" className="text-xs text-ink/50 hover:text-ink">← 전자책 목록으로</Link>
      </div>
    </div>
  );
}
