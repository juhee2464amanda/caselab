import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { listProducts } from '@/lib/data/products';
import { Button } from '@/components/ui/button';
import type { ProductRow } from '@/types/product';

export const revalidate = 60;

/** 무료 여부 */
const isFree = (b: ProductRow) => b.price === 0;

/** 썸네일 없는 상품용 — mockup 3D 북커버 (무료=블루, 유료=인디고) */
function BookCover({ book }: { book: ProductRow }) {
  const free = isFree(book);
  if (book.thumbnail_url) {
    return (
      <img
        src={book.thumbnail_url}
        alt={book.title}
        className="h-full w-full rounded-[2px_10px_10px_2px] object-cover shadow-[8px_8px_20px_rgba(0,0,0,.25),2px_0_4px_rgba(0,0,0,.1)]"
      />
    );
  }
  const gradient = free
    ? 'bg-[linear-gradient(160deg,#0f172a_0%,#1e3a5f_40%,#2563eb_100%)]'
    : 'bg-[linear-gradient(160deg,#0a0a0a_0%,#1a1a2e_50%,#312e81_100%)]';
  return (
    <div
      className={`flex h-full w-full flex-col rounded-[2px_10px_10px_2px] px-4 py-5 text-white shadow-[8px_8px_20px_rgba(0,0,0,.25),2px_0_4px_rgba(0,0,0,.1)] ${gradient}`}
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-2 text-[8px] font-bold uppercase tracking-[0.1em] opacity-60">
          Caselab ebook
        </div>
        <div className="text-[17px] font-extrabold leading-[1.2] tracking-[-0.03em] break-keep">
          {book.title}
        </div>
        {book.body?.subtitle && (
          <div className="mt-1.5 line-clamp-2 text-[10px] font-semibold leading-snug opacity-70 break-keep">
            {book.body.subtitle}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-white/10 pt-2.5">
        <span className="text-[9px] font-semibold opacity-50">
          {book.body?.volume ?? 'Caselab'}
        </span>
        <span className="font-serif text-[11px] font-bold italic opacity-50">Caselab</span>
      </div>
    </div>
  );
}

function BookCard({ book }: { book: ProductRow }) {
  const free = isFree(book);
  const href = `/ebooks/${book.slug}`;
  return (
    <li className="group flex flex-col overflow-hidden rounded-2xl border border-border transition-shadow hover:border-ink/15 hover:shadow-elevated">
      {/* 3D 북커버 */}
      <Link href={href} className="flex justify-center bg-muted px-6 pb-9 pt-12">
        <div className="h-[260px] w-[180px] [transform:perspective(1000px)_rotateY(-12deg)] [transform-style:preserve-3d] transition-transform duration-500 group-hover:[transform:perspective(1000px)_rotateY(-4deg)]">
          <BookCover book={book} />
        </div>
      </Link>

      {/* 정보 */}
      <div className="flex flex-1 flex-col p-6">
        <span
          className={`mb-3 inline-block w-fit rounded-md px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] ${
            free ? 'bg-emerald-50 text-emerald-600' : 'bg-accent-50 text-accent'
          }`}
        >
          {free ? 'FREE' : 'PREMIUM'}
        </span>
        <Link href={href}>
          <h3 className="mb-1.5 text-[18px] font-extrabold leading-snug tracking-[-0.02em] break-keep hover:text-accent">
            {book.title}
          </h3>
        </Link>
        {book.description && (
          <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-ink/60 break-keep">
            {book.description}
          </p>
        )}
        <div className="mb-4 text-sm text-ink/50">
          <strong className="text-[22px] font-extrabold text-ink">
            {free ? '무료' : `${book.price.toLocaleString()}원`}
          </strong>
        </div>
        <Link href={href} className="mt-auto">
          <Button variant={free ? 'accent' : 'default'} size="lg" className="w-full">
            자세히 보기
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </li>
  );
}

export default async function EbooksPage() {
  const books = await listProducts();
  const featured = books.find(isFree) ?? books[0];

  return (
    <div className="pb-20">
      {/* Hero */}
      <header className="border-b border-border bg-muted">
        <div className="container-wide py-12 md:py-16">
          <h1 className="text-[32px] font-extrabold tracking-[-0.03em] md:text-[40px]">ebook</h1>
          <p className="mt-2.5 max-w-[480px] text-base text-ink/60 break-keep">
            실무에서 검증된 AI 워크플로우를 한 권에 담았습니다.
          </p>
        </div>
      </header>

      {/* 무료 배포 배너 — 무료 ebook이 있을 때만 */}
      {featured && isFree(featured) && (
        <div className="bg-[linear-gradient(135deg,#1e3a5f,#2563eb)] text-white">
          <div className="container-wide flex flex-wrap items-center justify-between gap-6 py-7">
            <div>
              <span className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold backdrop-blur">
                {featured.body?.comingSoon ? '준비 중' : '무료 배포 중'}
              </span>
              <h2 className="text-[22px] font-extrabold tracking-[-0.03em] break-keep md:text-[26px]">
                {featured.title}
              </h2>
              <p className="mt-1 text-sm text-white/70 break-keep">
                {featured.body?.comingSoon
                  ? '지금 정성껏 다듬고 있어요. 곧 무료로 공개합니다.'
                  : featured.body?.subtitle ?? '이메일을 적어주시면 PDF 다운로드 링크를 보내드려요.'}
              </p>
            </div>
            <Link
              href={`/ebooks/${featured.slug}`}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] bg-white px-7 py-3 text-[15px] font-bold text-ink transition-colors hover:bg-muted"
            >
              {featured.body?.comingSoon ? '자세히 보기' : '무료로 받기'} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 책 목록 */}
      <div className="container-wide pt-12">
        {books.length === 0 ? (
          <div className="card grid place-items-center p-16 text-center text-ink/40">
            첫 전자책을 곧 출간할게요.
          </div>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
