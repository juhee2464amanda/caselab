import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * 관리자(내부) 트래픽 판별 API — §18.21.
 *
 * 현재 세션 이메일이 관리자 allowlist에 해당하면 { internal: true }.
 * allowlist는 서버 전용(env ADMIN_EMAILS, 기본값 caselab.kr@gmail.com) —
 * 클라이언트 번들에 관리자 이메일 목록을 노출하지 않기 위해 API로 감쌈.
 * (admin repo의 lib/supabase/middleware.ts와 같은 패턴)
 */

const DEFAULT_ADMIN_EMAILS = 'caselab.kr@gmail.com';

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? DEFAULT_ADMIN_EMAILS)
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  const internal = Boolean(email && adminEmails().includes(email));
  return NextResponse.json({ internal });
}
