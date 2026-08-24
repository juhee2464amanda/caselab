import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 마케팅 숏링크 리다이렉트.
 *
 * 리틀리 자동DM 등에 넣는 /l/{code} 링크의 클릭을 서버측에서 link_clicks에
 * 적재한 뒤 UTM 파라미터가 붙은 full_url로 302 리다이렉트한다.
 * 인스타 인앱 브라우저에서 GA4가 유실되어도 클릭 자체는 100% 집계된다.
 * (도착 페이지의 UtmCapture가 GA4/events 2차 집계를 이어받는다)
 *
 * 301이 아닌 302 + no-store: 인앱 브라우저·CDN이 영구 리다이렉트를 캐시하면
 * 클릭 집계가 끊기고 타겟 URL 변경도 반영되지 않는다.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const BOT_UA = /bot|crawler|spider|facebookexternalhit|WhatsApp|Slackbot|TelegramBot|preview/i;

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const home = NextResponse.redirect(new URL('/', SITE), 302);
  home.headers.set('Cache-Control', 'no-store');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey || !code) return home;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: link } = await admin
    .from('utm_links')
    .select('id, full_url, is_active')
    .eq('code', code)
    .maybeSingle();
  if (!link || link.is_active === false || !link.full_url?.startsWith('http')) return home;

  // 클릭 적재 실패가 리다이렉트를 막으면 안 된다
  try {
    const ua = req.headers.get('user-agent') ?? '';
    await admin.from('link_clicks').insert({
      link_id: link.id,
      referer: req.headers.get('referer'),
      user_agent: ua.slice(0, 500) || null,
      is_bot: BOT_UA.test(ua),
    });
  } catch {
    // ignore
  }

  const res = NextResponse.redirect(link.full_url, 302);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
