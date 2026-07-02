import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 이북 다운로드 리다이렉트 프록시.
 *
 * 발송 이메일의 다운로드 링크가 직접 Storage 서명URL 대신 이 엔드포인트를 가리킨다:
 *   /api/ebook/download?p=<purchaseId>&t=<hmac>
 * 클릭 시 → 토큰 검증 → events.ebook_download 1행 적재 → 신규 서명URL로 302 리다이렉트.
 *
 * 목적: 이메일 링크 클릭(=실제 다운로드 의도)을 events에 기록해 구매 퍼널 하단을 추적.
 * 토큰: HMAC-SHA256(purchaseId, SERVICE_ROLE_KEY) — 별도 시크릿 없이 enumeration 방지.
 *   (send-ebook Edge Function이 같은 키로 토큰을 생성한다)
 */

const SEVEN_DAYS = 60 * 60 * 24 * 7;

function expectedToken(purchaseId: string, secret: string): string {
  return createHmac('sha256', secret).update(purchaseId).digest('hex');
}

function tokenValid(purchaseId: string, token: string, secret: string): boolean {
  const expected = expectedToken(purchaseId, secret);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(token, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const purchaseId = url.searchParams.get('p');
  const token = url.searchParams.get('t');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return new NextResponse('server misconfigured', { status: 500 });
  }
  if (!purchaseId || !token || !tokenValid(purchaseId, token, serviceKey)) {
    return new NextResponse('invalid or expired link', { status: 403 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // purchase + product
  const { data: purchase, error } = await admin
    .from('purchases')
    .select('id, sent_at, products(id, pdf_path)')
    .eq('id', purchaseId)
    .single();
  if (error || !purchase) {
    return new NextResponse('not found', { status: 404 });
  }

  const product = (purchase as unknown as { products?: { id: string; pdf_path: string | null } }).products;
  if (!product?.pdf_path) {
    return new NextResponse('file unavailable', { status: 404 });
  }

  // 발송 후 7일 만료(이메일 안내 문구와 일치). sent_at 없으면 허용.
  const sentAt = (purchase as { sent_at: string | null }).sent_at;
  if (sentAt && Date.now() - new Date(sentAt).getTime() > SEVEN_DAYS * 1000) {
    return new NextResponse('다운로드 링크가 만료되었습니다. 재발송을 요청해 주세요.', {
      status: 410,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  // 신규 서명URL 발급
  const { data: signed, error: signErr } = await admin.storage
    .from('ebooks')
    .createSignedUrl(product.pdf_path, SEVEN_DAYS);
  if (signErr || !signed) {
    return new NextResponse('sign error', { status: 500 });
  }

  // 다운로드 이벤트 적재 (서버측, anon 식별자 없음)
  await admin.from('events').insert({
    event_type: 'ebook_download',
    product_id: product.id,
    metadata: { purchase_id: purchaseId, product_id: product.id },
  });

  return NextResponse.redirect(signed.signedUrl, 302);
}
