import Link from 'next/link';
import { listProducts } from '@/lib/data/products';

export const revalidate = 60;

export default async function EbooksPage() {
  const books = await listProducts();
  return (
    <div className="container-wide py-10">
      <header className="mb-10 text-center">
        <span className="badge mb-2">무료 전자책</span>
        <h1 className="font-serif text-3xl font-semibold">읽고 정리한 케이스를 책으로</h1>
        <p className="mt-2 text-ink/60">이메일을 적어주시면 PDF 다운로드 링크를 보내드려요.</p>
      </header>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {books.length === 0 ? (
          <li className="card p-10 text-center text-ink/40 col-span-full">
            첫 전자책을 곧 출간할게요.
          </li>
        ) : (
          books.map((b) => (
            <li key={b.id}>
              <Link href={`/ebooks/${b.slug}`} className="block group">
                <div className="aspect-[3/4] rounded-lg bg-muted relative overflow-hidden shadow-elevated group-hover:scale-[1.02] transition-transform">
                  {b.thumbnail_url ? (
                    <img src={b.thumbnail_url} alt={b.title} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-ink/30 font-serif text-2xl text-center p-6">
                      {b.title}
                    </div>
                  )}
                  <div className="absolute right-0 inset-y-0 w-1.5 bg-black/10" />
                </div>
                <h3 className="mt-3 font-serif text-lg font-semibold leading-snug">{b.title}</h3>
                <p className="mt-1 text-sm text-ink/60">{b.price === 0 ? '무료' : `${b.price.toLocaleString()}원`}</p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
