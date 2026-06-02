import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';

export const revalidate = 60;

export default async function EbookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSupabaseConfigured()) notFound();
  const supabase = await createSupabaseServerClient();
  const { data: book } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  if (!book) notFound();

  return (
    <article className="container-wide py-10">
      <Link href="/ebooks" className="text-xs text-ink/50 hover:text-ink">← 전자책 목록으로</Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[420px_1fr] items-start">
        <div className="aspect-[3/4] rounded-lg bg-muted relative overflow-hidden shadow-elevated">
          {book.thumbnail_url ? (
            <img src={book.thumbnail_url} alt={book.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-ink/30 font-serif text-3xl text-center p-8">
              {book.title}
            </div>
          )}
          <div className="absolute right-0 inset-y-0 w-2 bg-black/10" />
        </div>
        <div>
          <span className="badge mb-2">{book.price === 0 ? '무료' : `${book.price.toLocaleString()}원`}</span>
          <h1 className="font-serif text-3xl font-semibold leading-tight">{book.title}</h1>
          <p className="mt-4 text-ink/80 leading-relaxed whitespace-pre-wrap">{book.description}</p>
          <Link href={`/ebooks/${slug}/order`}>
            <Button variant="accent" className="mt-8 w-full sm:w-auto" size="lg">
              {book.price === 0 ? '무료로 받기' : '주문하기'}
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
