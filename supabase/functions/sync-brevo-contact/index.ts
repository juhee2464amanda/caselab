// sync-brevo-contact — Supabase Edge Function (Deno)
// 트리거: DB 트리거 net.http_post (newsletter_subscribers insert, profiles newsletter 전환)
//   curl -X POST .../functions/v1/sync-brevo-contact \
//     -H "Authorization: Bearer <service_role>" \
//     -d '{"email":"a@b.com","name":"홍길동","action":"subscribe"}'
//
// 작동:
//   action='subscribe'   → Brevo Contacts upsert(updateEnabled) + 뉴스레터 리스트 등록
//   action='unsubscribe' → 리스트 해제 + emailBlacklisted=true
//
// 필요한 secret (supabase functions secrets set ...):
//   BREVO_API_KEY              (xkeysib-... — send-ebook과 동일 키 재사용)
//   BREVO_NEWSLETTER_LIST_ID   (Brevo Contacts → Lists 의 숫자 ID. 미설정 시 리스트 없이 컨택만 생성)
//
// Brevo Contacts API: https://developers.brevo.com/reference/createcontact

// @ts-expect-error - Deno runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

declare const Deno: { env: { get: (k: string) => string | undefined } };

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')!;
const LIST_ID_RAW = Deno.env.get('BREVO_NEWSLETTER_LIST_ID');
const LIST_ID = LIST_ID_RAW ? Number(LIST_ID_RAW) : null;

const CONTACTS_ENDPOINT = 'https://api.brevo.com/v3/contacts';

function brevoHeaders() {
  return {
    'accept': 'application/json',
    'content-type': 'application/json',
    'api-key': BREVO_API_KEY,
  };
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  let body: { email?: string; name?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  const email = body.email?.trim();
  const name = body.name?.trim() || '';
  const action = body.action === 'unsubscribe' ? 'unsubscribe' : 'subscribe';
  if (!email) return new Response('email required', { status: 400 });

  if (action === 'subscribe') {
    // upsert: updateEnabled=true → 기존 컨택이면 갱신, 없으면 생성
    const payload: Record<string, unknown> = { email, updateEnabled: true };
    if (name) payload.attributes = { FIRSTNAME: name };
    if (LIST_ID) payload.listIds = [LIST_ID];

    const res = await fetch(CONTACTS_ENDPOINT, {
      method: 'POST',
      headers: brevoHeaders(),
      body: JSON.stringify(payload),
    });
    // 201 created / 204 updated 모두 성공
    if (!res.ok && res.status !== 204) {
      const errBody = await res.text();
      return new Response(`brevo error ${res.status}: ${errBody}`, { status: 502 });
    }
  } else {
    // unsubscribe: 리스트 해제 + 블랙리스트
    const payload: Record<string, unknown> = { emailBlacklisted: true };
    if (LIST_ID) payload.unlinkListIds = [LIST_ID];

    const res = await fetch(`${CONTACTS_ENDPOINT}/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: brevoHeaders(),
      body: JSON.stringify(payload),
    });
    // 404 = 애초에 컨택 없음 → 멱등 성공 처리
    if (!res.ok && res.status !== 404) {
      const errBody = await res.text();
      return new Response(`brevo error ${res.status}: ${errBody}`, { status: 502 });
    }
  }

  return new Response(JSON.stringify({ ok: true, action }), {
    headers: { 'content-type': 'application/json' },
  });
});
