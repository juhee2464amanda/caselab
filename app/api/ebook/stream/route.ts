import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 웹뷰어용 PDF 스트리밍 URL 발급.
 *
 *   /api/ebook/stream?p=<purchaseId>
 *
 * 이메일용 /api/ebook/download(HMAC 토큰, 7일)와 별개 경로 —
 * 여기는 세션 쿠키 기반: 로그인 사용자 본인의 구매만 통과(RLS + 명시 필터).
 * 서명URL 만료를 10분으로 짧게 잡아 URL 공유로 인한 유출을 억제한다.
 * (뷰어는 로드 시 1회 호출하고, PDF.js가 해당 URL로 문서를 스트리밍 렌더)
 */

const TEN_MINUTES = 60 * 10;

export async function GET(req: Request) {
  const purchaseId = new URL(req.url).searchParams.get('p');
  if (!purchaseId) {
    return NextResponse.json({ error: 'missing purchase id' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: purchase } = await supabase
    .from('purchases')
    .select('id, status, products(id, pdf_path)')
    .eq('id', purchaseId)
    .eq('user_id', user.id)
    .maybeSingle();

  const product = (
    purchase as unknown as { products?: { id: string; pdf_path: string | null } } | null
  )?.products;
  if (!purchase || !product?.pdf_path) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  if ((purchase as unknown as { status: string }).status === 'refunded') {
    return NextResponse.json({ error: 'refunded' }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 });
  }

  // ebooks 버킷은 일반 사용자 select 불가 — 서명URL은 admin으로만 발급 가능
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: signed, error: signErr } = await admin.storage
    .from('ebooks')
    .createSignedUrl(product.pdf_path, TEN_MINUTES);
  if (signErr || !signed) {
    return NextResponse.json({ error: 'sign error' }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
