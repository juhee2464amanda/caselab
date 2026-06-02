// send-ebook — Supabase Edge Function (Deno)
// 트리거: purchases insert (status='pending') 또는 admin 수동
//   curl -X POST .../functions/v1/send-ebook -d '{"purchase_id": "..."}'
//
// 작동:
// 1. purchase + product 조회
// 2. Storage signed URL 발급 (유효 7일)
// 3. Brevo HTTP API로 다운로드 링크 이메일 발송 (단일 발신자 인증)
// 4. purchases.status = 'sent', sent_at = now()
//
// 필요한 secret (Supabase functions secrets set ...):
//   BREVO_API_KEY        (Brevo dashboard → SMTP & API → API Keys에서 발급, 형식: xkeysib-...)
//   BREVO_SENDER_EMAIL   (예: caselab.kr@gmail.com — Brevo에서 사전 단일 발신자 인증 필수)
//   BREVO_SENDER_NAME    (예: 케이스랩)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (자동 주입)
//   SITE_URL (예: https://caselab.vercel.app)
//
// Brevo 무료 한도: 일 300건 / 월 9,000건. 도메인 없이 단일 발신자 인증으로 외부 발송 가능.

// @ts-expect-error - Deno runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error - Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

declare const Deno: { env: { get: (k: string) => string | undefined } };

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')!;
const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL')!;
const BREVO_SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') ?? '케이스랩';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://caselab.vercel.app';

const SEVEN_DAYS = 60 * 60 * 24 * 7;
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  const { purchase_id } = await req.json();
  if (!purchase_id) return new Response('purchase_id required', { status: 400 });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. purchase + product
  const { data: purchase, error } = await admin
    .from('purchases')
    .select('id, email, name, status, products(title, pdf_path)')
    .eq('id', purchase_id)
    .single();
  if (error || !purchase) return new Response('not found', { status: 404 });
  if (purchase.status === 'sent') {
    return new Response(JSON.stringify({ ok: true, already_sent: true }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const product = (purchase as any).products;
  if (!product?.pdf_path) {
    await admin.from('purchases').update({ status: 'failed' }).eq('id', purchase_id);
    return new Response('product pdf_path missing', { status: 500 });
  }

  // 2. Signed URL
  const { data: signed, error: signErr } = await admin.storage
    .from('ebooks')
    .createSignedUrl(product.pdf_path, SEVEN_DAYS);
  if (signErr || !signed) {
    await admin.from('purchases').update({ status: 'failed' }).eq('id', purchase_id);
    return new Response('sign error: ' + signErr?.message, { status: 500 });
  }

  // 3. Brevo HTTP API 발송
  const htmlContent = `
    <p>안녕하세요 ${purchase.name}님,</p>
    <p>저도 처음에 AI를 적용하기 어려웠어요. 이 책에 그 고민을 정리했어요.</p>
    <p>아래 링크로 7일 동안 다운로드받으실 수 있어요.</p>
    <p><a href="${signed.signedUrl}" style="display:inline-block;padding:12px 20px;background:#1E40AF;color:#fff;border-radius:6px;text-decoration:none">PDF 다운로드</a></p>
    <hr style="margin:24px 0;border:none;border-top:1px solid #E5E5E0" />
    <p style="font-size:12px;color:#737373">
      혹시 안 열리면 ${signed.signedUrl}<br />
      답장 주시면 운영자(저)가 직접 회신드려요.<br />
      — 케이스랩 (${SITE_URL})
    </p>
  `;

  const brevoRes = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
      to: [{ email: purchase.email, name: purchase.name }],
      replyTo: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
      subject: `[케이스랩] ${product.title} 다운로드 링크`,
      htmlContent,
    }),
  });

  if (!brevoRes.ok) {
    const errBody = await brevoRes.text();
    await admin.from('purchases').update({ status: 'failed' }).eq('id', purchase_id);
    return new Response(`brevo error ${brevoRes.status}: ${errBody}`, { status: 500 });
  }

  // 4. status = sent
  await admin
    .from('purchases')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', purchase_id);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
});
