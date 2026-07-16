import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { EbookViewer } from '@/components/ebook/viewer/EbookViewer';
import type { EbookBody } from '@/types/product';

export const metadata: Metadata = {
  title: '전자책 읽기',
  robots: { index: false, follow: false },
};

/**
 * 구매자 전용 웹뷰어 — /read/<purchaseId>
 * (public) 그룹 밖 라우트: 사이트 헤더/푸터 없이 몰입형 전체화면.
 * 소유권은 RLS + user_id 명시 필터로 이중 검증. 기획: docs/08_ebook_viewer_plan.md
 */
export default async function ReadPage({
  params,
}: {
  params: Promise<{ purchaseId: string }>;
}) {
  const { purchaseId } = await params;
  if (!isSupabaseConfigured()) redirect('/mypage/ebooks');

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/read/${purchaseId}`);

  const { data: purchase } = await supabase
    .from('purchases')
    .select('id, status, products(id, title, body)')
    .eq('id', purchaseId)
    .eq('user_id', user.id)
    .maybeSingle();

  const product = (
    purchase as unknown as {
      status: string;
      products?: { id: string; title: string; body: EbookBody | null };
    } | null
  )?.products;
  if (!purchase || !product) notFound();
  if ((purchase as unknown as { status: string }).status === 'refunded') notFound();

  // 이어읽기: 마지막 위치 복원 (테이블 미적용 환경이면 data null → 1페이지)
  const { data: state } = await supabase
    .from('ebook_reading_state')
    .select('page')
    .eq('user_id', user.id)
    .eq('product_id', product.id)
    .maybeSingle();

  return (
    <EbookViewer
      purchaseId={purchaseId}
      productId={product.id}
      userId={user.id}
      title={product.title}
      initialPage={state?.page ?? 1}
      fallbackToc={(product.body?.toc ?? []).map((t) => t.title)}
    />
  );
}
