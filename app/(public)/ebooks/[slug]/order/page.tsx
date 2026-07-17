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

  // 판매 준비중 — 상세 페이지 버튼이 비활성이지만, 직접 URL 접근도 차단
  if (book.body?.comingSoon === true) {
    redirect(`/ebooks/${slug}`);
  }

  // 로그인 필수 — 비로그인 시 로그인 후 이 주문서로 복귀
  let defaults = { name: '', email: '' };
  let alreadySubscribed = false;
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
    // 이미 뉴스레터 구독 중이면 주문 폼의 [선택] 구독 체크박스를 숨긴다
    const { data: profile } = await supabase
      .from('profiles')
      .select('newsletter')
      .eq('id', user.id)
      .maybeSingle();
    alreadySubscribed = !!profile?.newsletter;
  }

  return (
    <OrderForm
      book={{ id: book.id, title: book.title, price: book.price }}
      defaults={defaults}
      alreadySubscribed={alreadySubscribed}
    />
  );
}
