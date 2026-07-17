import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/data/products';
import { ProductViewTracker } from '@/components/analytics/ProductViewTracker';
import { DwellTracker } from '@/components/analytics/DwellTracker';
import { ScrollTracker } from '@/components/analytics/ScrollTracker';
import { EbookDetailNav, type EbookNavTab } from '@/components/ebook/EbookDetailNav';
import { EbookToc } from '@/components/ebook/EbookToc';
import { EbookReviews } from '@/components/ebook/EbookReviews';
import { EbookShare } from '@/components/ebook/EbookShare';
import { EbookSubscribeButton } from '@/components/ebook/EbookSubscribeButton';
import { EbookActions } from '@/components/ebook/EbookActions';
import type { ProductRow } from '@/types/product';

export const revalidate = 60;

/** 3D 북커버 (mockup .book-3d 정합) — 썸네일 있으면 이미지, 없으면 그라데이션 커버 */
function BookCover({ book }: { book: ProductRow }) {
  const free = book.price === 0;
  if (book.thumbnail_url) {
    return (
      <img
        src={book.thumbnail_url}
        alt={book.title}
        className="h-full w-full rounded-[2px_10px_10px_2px] object-cover shadow-[10px_10px_24px_rgba(0,0,0,.25),2px_0_4px_rgba(0,0,0,.1)]"
      />
    );
  }
  const gradient = free
    ? 'bg-[linear-gradient(160deg,#0f172a_0%,#1e3a5f_40%,#2563eb_100%)]'
    : 'bg-[linear-gradient(160deg,#0a0a0a_0%,#1a1a2e_50%,#312e81_100%)]';
  return (
    <div
      className={`flex h-full w-full flex-col rounded-[2px_10px_10px_2px] px-5 py-6 text-white shadow-[10px_10px_24px_rgba(0,0,0,.25),2px_0_4px_rgba(0,0,0,.1)] ${gradient}`}
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.1em] opacity-60">
          Caselab ebook
        </div>
        <div className="text-[22px] font-black leading-[1.2] tracking-[-0.03em] break-keep">
          {book.title}
        </div>
        {book.body?.subtitle && (
          <div className="mt-2 line-clamp-2 text-[12px] font-semibold opacity-70 break-keep">
            {book.body.subtitle}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-white/10 pt-3">
        <span className="text-[10px] font-semibold opacity-50">{book.body?.volume ?? 'Caselab'}</span>
        <span className="font-serif text-[12px] font-bold italic opacity-50">Caselab</span>
      </div>
    </div>
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
  const free = book.price === 0;
  const comingSoon = body.comingSoon === true;
  const orderHref = `/ebooks/${slug}/order`;
  const cta = free ? '무료로 받기' : '주문하기';

  const meta = [
    { label: '저자', value: body.author ?? 'Caselab' },
    body.format && { label: '포맷', value: body.format },
    body.volume && { label: '분량', value: body.volume },
    body.jobs && { label: '직무', value: body.jobs },
    body.updated && { label: '업데이트', value: body.updated },
  ].filter(Boolean) as { label: string; value: string }[];

  const hasImages = (body.detailImages?.length ?? 0) > 0;

  const tabs: EbookNavTab[] = [
    body.intro?.length && { id: 'intro', label: '책 소개' },
    body.toc?.length && { id: 'toc', label: '목차' },
    hasImages && { id: 'images', label: '상세 이미지' },
    { id: 'reviews', label: '리뷰' },
  ].filter(Boolean) as EbookNavTab[];

  return (
    <>
      <ProductViewTracker productId={book.id} />
      {/* ebook 읽기 퍼널 — 체류시간 + 스크롤 깊이(상세 정독 신호) */}
      <DwellTracker />
      <ScrollTracker />
      {/* Product top */}
      <div className="mx-auto flex max-w-[1100px] flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:gap-12 md:py-12">
        {/* 3D Book */}
        <div className="flex shrink-0 items-center justify-center rounded-2xl bg-muted px-8 py-12 md:w-[360px]">
          <div className="h-[280px] w-[200px] [transform:perspective(1000px)_rotateY(-12deg)] [transform-style:preserve-3d] transition-transform duration-500 hover:[transform:perspective(1000px)_rotateY(-4deg)]">
            <BookCover book={book} />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <span
            className={`mb-3 inline-block rounded-md px-3 py-1 text-xs font-bold ${
              comingSoon
                ? 'bg-ink/10 text-ink/50'
                : free
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-accent-50 text-accent'
            }`}
          >
            {comingSoon ? '준비 중' : free ? '무료 배포' : 'EBOOK'}
          </span>
          <h1 className="text-[26px] font-extrabold leading-[1.3] tracking-[-0.03em] break-keep md:text-[30px]">
            {book.title}
          </h1>
          {body.subtitle && (
            <p className="mt-2 text-[15px] text-ink/60 break-keep">{body.subtitle}</p>
          )}

          <dl className="my-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-y border-border py-4 text-sm">
            {meta.map((m) => (
              <div key={m.label} className="contents">
                <dt className="font-medium text-ink/50">{m.label}</dt>
                <dd className="font-semibold">{m.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mb-6">
            <div className="mb-1 text-[13px] text-ink/50">가격</div>
            <div className="text-[28px] font-extrabold text-accent">
              {free ? '무료' : `${book.price.toLocaleString()}원`}
            </div>
          </div>

          <div className="mb-4 flex gap-2.5">
            {comingSoon ? (
              <span
                aria-disabled="true"
                className="flex flex-1 cursor-not-allowed items-center justify-center rounded-[10px] bg-muted px-4 py-4 text-base font-bold tracking-[-0.02em] text-ink/40"
              >
                판매 준비 중
              </span>
            ) : (
              <Link
                href={orderHref}
                className="flex flex-1 items-center justify-center rounded-[10px] bg-accent px-4 py-4 text-base font-bold tracking-[-0.02em] text-white transition-colors hover:bg-accent-700"
              >
                {cta}
              </Link>
            )}
            <EbookActions productId={book.id} />
          </div>
          <p className="text-center text-xs text-ink/40 break-keep">
            {comingSoon
              ? '이 전자책은 현재 준비 중이라 판매를 잠시 멈췄어요. 곧 다시 만나요.'
              : free
                ? '로그인 후 마이페이지에서 PDF 다운로드 및 뷰어로 읽을 수 있습니다.'
                : '결제 후 마이페이지에서 PDF 다운로드 및 뷰어로 읽을 수 있습니다.'}
          </p>
        </div>
      </div>

      {/* Detail sections */}
      <div className="mx-auto max-w-[1100px] px-4 pb-16 sm:px-6">
        {tabs.length > 0 && <EbookDetailNav tabs={tabs} />}

        {/* 책 소개 */}
        {body.intro && body.intro.length > 0 && (
          <section id="intro" className="scroll-mt-[120px] border-b border-border py-10">
            <h2 className="mb-4 text-xl font-extrabold tracking-[-0.025em]">책 소개</h2>
            {body.lead && (
              <div className="mb-6 text-[22px] font-extrabold leading-[1.5] tracking-[-0.025em] break-keep">
                {body.lead.split('\n').map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </div>
            )}
            <div className="max-w-[760px] space-y-3.5">
              {body.intro.map((p, i) => (
                <p key={i} className="text-[15px] leading-[1.85] text-ink/80 break-keep">
                  {p}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* 목차 */}
        {body.toc && body.toc.length > 0 && (
          <section id="toc" className="scroll-mt-[120px] border-b border-border py-10">
            <h2 className="mb-4 text-xl font-extrabold tracking-[-0.025em]">목차</h2>
            <EbookToc items={body.toc} />
          </section>
        )}

        {/* 상세 이미지 */}
        {hasImages && (
          <section id="images" className="scroll-mt-[120px] border-b border-border py-10">
            <h2 className="mb-4 text-xl font-extrabold tracking-[-0.025em]">상세 이미지</h2>
            <div className="space-y-4">
              {body.detailImages!.map((src, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${book.title} 상세 이미지 ${i + 1}`} className="block h-auto w-full" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 리뷰 — DB 배선 (구매자만 작성, 실제 리뷰만 표시) */}
        <section id="reviews" className="scroll-mt-[120px] border-b border-border py-10">
          <EbookReviews productId={book.id} />
        </section>

        {/* 하단 구독 CTA */}
        <div className="my-8 rounded-2xl border border-border bg-muted px-6 py-10 text-center">
          <h3 className="text-[22px] font-extrabold leading-snug tracking-[-0.025em] break-keep">
            새로운 무료 ebook과 검증된 컨텐츠를
          </h3>
          <p className="mx-auto mb-5 mt-2 max-w-[480px] text-sm leading-relaxed text-ink/60 break-keep">
            가장 먼저 받아보세요. Caselab 뉴스레터를 구독하시면 신규 자료를 메일로 보내드려요.
          </p>
          <EbookSubscribeButton />
        </div>

        {/* 공유 */}
        <EbookShare title={book.title} imageUrl={book.thumbnail_url ?? body.detailImages?.[0]} productId={book.id} />
      </div>
    </>
  );
}
