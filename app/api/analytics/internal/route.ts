import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * 관리자(내부) 트래픽 판별 API — §18.21.
 *
 * 현재 세션 이메일이 내부(운영자) allowlist에 해당하면 { internal: true }.
 * allowlist는 서버 전용(env ADMIN_EMAILS, 기본값 아래 목록) —
 * 클라이언트 번들에 이메일 목록을 노출하지 않기 위해 API로 감쌈.
 * (admin repo의 lib/supabase/middleware.ts와 같은 패턴)
 *
 * NOTE: 이 목록은 "권한"이 아니라 "애널리틱스 제외" 전용이다. 실제 권한은
 * profiles.role='admin'으로 별개 판정하므로, 운영자가 평소 테스트에 쓰는
 * 개인 계정(role=user)도 KPI 오염 방지를 위해 여기 포함한다. (§18.21)
 */

const DEFAULT_ADMIN_EMAILS =
  'caselab.kr@gmail.com,juhee2464@gmail.com,amandajuhee@gmail.com';

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
