// Kakao OAuth proxy — Supabase Edge Function (Deno)
// 배포: supabase functions deploy kakao-oauth
//
// 작동 흐름:
// 1. /login → /functions/v1/kakao-oauth?next=... 로 리다이렉트
// 2. Kakao 인가 페이지로 redirect (KAKAO_REST_API_KEY 사용)
// 3. Kakao → /functions/v1/kakao-oauth?code=... 콜백
// 4. code → access_token → 사용자 정보 조회
// 5. Supabase admin client 로 user 생성/연동 → magic link 토큰 발급
// 6. /auth/callback?token_hash=... 로 리다이렉트
//
// 필요한 secret (Supabase functions secrets set ...):
//   KAKAO_REST_API_KEY, KAKAO_CLIENT_SECRET
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (자동 주입됨)
//   SITE_URL (예: https://caselab.vercel.app — Vercel 무료 서브도메인)

// @ts-expect-error - Deno runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error - Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

declare const Deno: { env: { get: (k: string) => string | undefined } };

const KAKAO_REST_API_KEY = Deno.env.get('KAKAO_REST_API_KEY')!;
const KAKAO_CLIENT_SECRET = Deno.env.get('KAKAO_CLIENT_SECRET') ?? '';
const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:3000';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/kakao-oauth`;

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  // Step 1: 인가 페이지로 리다이렉트
  if (!code) {
    const authUrl = new URL('https://kauth.kakao.com/oauth/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', KAKAO_REST_API_KEY);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('state', encodeURIComponent(next));
    return Response.redirect(authUrl.toString(), 302);
  }

  // Step 2: code → access_token
  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY,
      client_secret: KAKAO_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
    }),
  });
  if (!tokenRes.ok) return new Response('kakao token error', { status: 400 });
  const { access_token } = await tokenRes.json();

  // Step 3: 사용자 정보
  const meRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const me = await meRes.json();
  const kakaoId = String(me.id);
  // 이메일 동의 안 한 사용자엔 placeholder 이메일 생성 (Supabase user 식별용)
  const email = me.kakao_account?.email ?? `kakao-${kakaoId}@users.caselab.local`;
  const name = me.kakao_account?.profile?.nickname ?? '카카오 사용자';
  const avatar = me.kakao_account?.profile?.profile_image_url ?? null;

  // Step 4: Supabase 사용자 생성/연동
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let userId: string | null = null;
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing.users.find((u) => u.email === email);
  if (found) {
    userId = found.id;
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: name, avatar_url: avatar, kakao_id: kakaoId },
    });
    if (error) return new Response('supabase create error: ' + error.message, { status: 500 });
    userId = created.user.id;
  }

  // Step 5: magic link 발급 → /auth/callback?token_hash=...
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (linkErr) return new Response('magiclink error', { status: 500 });
  return Response.redirect(link.properties.action_link, 302);
});
