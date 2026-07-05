import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unsubscribeTokenValid } from '@/lib/newsletter/unsubscribe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 뉴스레터 수신거부 처리.
 *
 * POST { email, token } — /unsubscribe 페이지의 확인 버튼이 호출.
 * (GET으로 즉시 처리하지 않는 이유: 메일 클라이언트 링크 프리페치가
 *  본인 의사 없이 수신거부를 실행할 수 있어서.)
 *
 * 반영 대상 두 경로 모두:
 *  - newsletter_subscribers.status → 'unsubscribed' (비로그인 구독자)
 *  - profiles.newsletter → false (회원)
 * 각각 DB 트리거(0014/0019)가 Brevo 해지(blacklist)까지 전파한다.
 * 멱등: 이미 해지됐거나 존재하지 않는 이메일도 성공으로 응답.
 */
export async function POST(req: Request) {
  let email = '';
  let token = '';
  try {
    const body = (await req.json()) as { email?: string; token?: string };
    email = (body.email ?? '').trim().toLowerCase();
    token = body.token ?? '';
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  if (!email || !token || !unsubscribeTokenValid(email, token)) {
    return NextResponse.json({ error: '유효하지 않은 링크예요.' }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 });
  }
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const subs = await admin
    .from('newsletter_subscribers')
    .update({ status: 'unsubscribed' })
    .eq('email', email);
  const prof = await admin.from('profiles').update({ newsletter: false }).eq('email', email);

  if (subs.error || prof.error) {
    return NextResponse.json(
      { error: subs.error?.message ?? prof.error?.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
