import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 이벤트 적재 API — sendBeacon 수신용.
 *
 * 배경: track.ts가 supabase-js fetch로 직접 INSERT하면 페이지 이탈(unload) 시
 * 요청이 중단돼 유실된다(인앱 브라우저 DM 유입 3건 도착 pv 0건 실측, 2026-08-26).
 * navigator.sendBeacon은 이탈 후에도 브라우저가 전송을 보장하지만 커스텀 헤더를
 * 못 붙이므로, apikey 헤더가 필요한 Supabase REST 대신 이 라우트가 받아
 * service role로 INSERT한다.
 *
 * 신뢰 경계: 기존에도 events는 anon RLS로 누구나 INSERT 가능했으므로 이 라우트가
 * 공격면을 넓히지 않는다. 단 service role을 쓰므로 event_type 화이트리스트와
 * 페이로드 크기 상한으로 임의 데이터 적재를 막는다.
 */

const DB_EVENT_TYPES = new Set([
  'pageview',
  'deep_read',
  'prompt_copy',
  'save',
  'react',
  'cta_click',
  'ebook_order',
  'ebook_download',
  'ebook_read_page',
  'ebook_finish',
  'scroll_25',
  'scroll_50',
  'scroll_100',
  'search',
  'product_view',
  'subscribe',
  'signup',
  'login',
  'review',
  'share',
  'dwell',
  'banner_view',
]);

const MAX_BODY_BYTES = 8 * 1024;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return new NextResponse(null, { status: 204 });

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  if (!raw || raw.length > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 204 });
  }

  let body: {
    event_type?: unknown;
    content_id?: unknown;
    product_id?: unknown;
    user_id?: unknown;
    metadata?: unknown;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const eventType = body.event_type;
  if (typeof eventType !== 'string' || !DB_EVENT_TYPES.has(eventType)) {
    return new NextResponse(null, { status: 204 });
  }

  const uuidOrNull = (v: unknown): string | null =>
    typeof v === 'string' && UUID_RE.test(v) ? v : null;

  const row: Record<string, unknown> = {
    event_type: eventType,
    content_id: uuidOrNull(body.content_id),
    user_id: uuidOrNull(body.user_id),
    metadata:
      body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
  };
  const productId = uuidOrNull(body.product_id);
  if (productId) row.product_id = productId;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    await admin.from('events').insert(row);
  } catch {
    // silent — 적재 실패가 응답을 막지 않는다 (track.ts와 동일 방침)
  }
  return new NextResponse(null, { status: 204 });
}
