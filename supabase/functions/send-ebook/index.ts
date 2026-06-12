// send-ebook — Supabase Edge Function (Deno)
// 트리거: purchases insert (status='pending') 또는 admin 수동
//   curl -X POST .../functions/v1/send-ebook -d '{"purchase_id": "..."}'
//
// 작동:
// 1. purchase + product 조회
// 2. Storage signed URL 발급 (유효 7일)
// 3. Gmail SMTP(nodemailer)로 다운로드 링크 이메일 발송
// 4. purchases.status = 'sent', sent_at = now()
//
// 왜 Gmail SMTP인가:
//   발신자가 @gmail.com 주소이면 외부 ESP(Brevo 등)로 보낼 때 Gmail이 DMARC 실패로 silent-drop 함.
//   Gmail 자체 SMTP로 보내면 진짜 구글 서버에서 나가므로 SPF/DKIM/DMARC 통과 → 인박스 도달.
//   도메인 구매 불필요(운영비 $0 유지). 무료 Gmail 발송 한도 ~500통/일.
//
// 필요한 secret (Supabase functions secrets set ...):
//   GMAIL_USER           (예: caselab.kr@gmail.com — 발신 Gmail 계정)
//   GMAIL_APP_PASSWORD   (구글 계정 2단계 인증 후 발급한 16자리 앱 비밀번호, 공백 없이)
//   GMAIL_SENDER_NAME    (선택, 기본 '케이스랩')
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (자동 주입)
//   SITE_URL (예: https://caselab.vercel.app)

// @ts-expect-error - Deno runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error - Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
// @ts-expect-error - Deno runtime (npm 호환). nodemailer = MIME/RFC2047 인코딩 정확.
import nodemailer from 'npm:nodemailer@6.9.16';

declare const Deno: { env: { get: (k: string) => string | undefined } };

const GMAIL_USER = Deno.env.get('GMAIL_USER')!;
const GMAIL_APP_PASSWORD = (Deno.env.get('GMAIL_APP_PASSWORD') ?? '').replace(/\s/g, '');
const GMAIL_SENDER_NAME = Deno.env.get('GMAIL_SENDER_NAME') ?? '케이스랩';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://caselab.vercel.app';

const SEVEN_DAYS = 60 * 60 * 24 * 7;

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

  // 3. Gmail SMTP 발송
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

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  try {
    await transporter.sendMail({
      from: { name: GMAIL_SENDER_NAME, address: GMAIL_USER },
      to: purchase.email,
      replyTo: GMAIL_USER,
      subject: `[케이스랩] ${product.title} 다운로드 링크`,
      html: htmlContent,
    });
  } catch (e) {
    await admin.from('purchases').update({ status: 'failed' }).eq('id', purchase_id);
    return new Response(`gmail smtp error: ${e instanceof Error ? e.message : String(e)}`, { status: 500 });
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
