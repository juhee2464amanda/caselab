// send-support-reply — Supabase Edge Function (Deno)
// 트리거: admin이 /admin/support에서 답변 발송 (supabase.functions.invoke)
//   POST { ticket_id, reply_body }
//
// 작동:
// 1. 호출자 admin 검증 (Authorization JWT → profiles.role='admin')
// 2. support_tickets + 제출자 이메일(profiles) 조회
// 3. Gmail SMTP(nodemailer)로 답변 메일 발송 (send-ebook과 동일 인프라 — DMARC 통과)
// 4. support_tickets: status='answered', reply_body, replied_at, replied_by, reply_email_id
//
// 필요한 secret (이미 send-ebook용으로 설정됨):
//   GMAIL_USER, GMAIL_APP_PASSWORD, GMAIL_SENDER_NAME(선택)
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (자동 주입)

// @ts-expect-error - Deno runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error - Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
// @ts-expect-error - Deno runtime (npm 호환)
import nodemailer from 'npm:nodemailer@6.9.16';

declare const Deno: { env: { get: (k: string) => string | undefined } };

const GMAIL_USER = Deno.env.get('GMAIL_USER')!;
const GMAIL_APP_PASSWORD = (Deno.env.get('GMAIL_APP_PASSWORD') ?? '').replace(/\s/g, '');
const GMAIL_SENDER_NAME = Deno.env.get('GMAIL_SENDER_NAME') ?? '케이스랩';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://caselab.vercel.app';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const { ticket_id, reply_body } = await req.json().catch(() => ({}));
  if (!ticket_id || !reply_body || typeof reply_body !== 'string') {
    return json({ error: 'ticket_id, reply_body 필요' }, 400);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. 호출자 admin 검증
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'unauthorized' }, 401);
  const { data: caller } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (caller?.role !== 'admin') return json({ error: 'forbidden' }, 403);

  // 2. 티켓 + 제출자 이메일
  const { data: ticket, error: tErr } = await admin
    .from('support_tickets')
    .select('id, user_id, subject, body, status')
    .eq('id', ticket_id)
    .single();
  if (tErr || !ticket) return json({ error: 'ticket not found' }, 404);

  let toEmail: string | null = null;
  let toName = '고객';
  if (ticket.user_id) {
    const { data: prof } = await admin.from('profiles').select('email, name').eq('id', ticket.user_id).single();
    toEmail = prof?.email ?? null;
    toName = prof?.name ?? '고객';
  }
  if (!toEmail) return json({ error: '제출자 이메일을 찾을 수 없어요 (비로그인 문의)' }, 422);

  // 3. Gmail SMTP 발송
  const replyHtml = esc(reply_body).replace(/\n/g, '<br />');
  const html = `
    <p>안녕하세요 ${esc(toName)}님,</p>
    <p>문의주신 내용에 답변드려요.</p>
    <div style="margin:16px 0;padding:14px 16px;background:#f7f7f7;border-radius:8px;font-size:14px;color:#1F2937">${replyHtml}</div>
    <hr style="margin:24px 0;border:none;border-top:1px solid #E5E5E0" />
    <p style="font-size:12px;color:#737373">
      문의하신 제목: ${esc(ticket.subject)}<br />
      추가 문의는 이 메일에 그대로 답장 주세요.<br />
      — 케이스랩 (${SITE_URL})
    </p>`;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  let messageId: string | null = null;
  try {
    const info = await transporter.sendMail({
      from: { name: GMAIL_SENDER_NAME, address: GMAIL_USER },
      to: toEmail,
      replyTo: GMAIL_USER,
      subject: `[케이스랩] 문의 답변: ${ticket.subject}`,
      html,
    });
    messageId = info?.messageId ?? null;
  } catch (e) {
    return json({ error: `gmail smtp error: ${e instanceof Error ? e.message : String(e)}` }, 502);
  }

  // 4. 티켓 업데이트
  await admin
    .from('support_tickets')
    .update({
      status: 'answered',
      reply_body,
      reply_email_id: messageId,
      replied_by: user.id,
      replied_at: new Date().toISOString(),
    })
    .eq('id', ticket_id);

  return json({ ok: true, sent_to: toEmail });
});
