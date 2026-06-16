import { notFound, redirect } from 'next/navigation';
import { getProductBySlug } from '@/lib/data/products';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { OrderForm } from './OrderForm';

export default async function OrderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await getProductBySlug(slug);
  if (!book) notFound();

  // 로그인 필수 — 비로그인 시 로그인 후 이 주문서로 복귀
  let defaults = { name: '', email: '' };
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/login?next=${encodeURIComponent(`/ebooks/${slug}/order`)}`);
    }
    defaults = {
      name: (user.user_metadata?.name ?? user.user_metadata?.full_name ?? '') as string,
      email: user.email ?? '',
    };
  }

  return (
    <OrderForm
      book={{ id: book.id, title: book.title, price: book.price }}
      defaults={defaults}
    />
  );
}
