import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * 관리자 판별 — 인라인 퀵편집 권한 게이트.
 *
 * 두 신호를 OR 로 확인한다:
 *   1) 이메일 allowlist (env ADMIN_EMAILS, 기본 caselab.kr@gmail.com)
 *      — profiles.role 세팅과 무관하게 지정 계정을 관리자로 보장.
 *   2) profiles.role === 'admin' (app/api/revalidate/route.ts 와 동일 패턴)
 *
 * 클라이언트 번들에 allowlist 를 노출하지 않기 위해 서버 전용.
 */

const DEFAULT_ADMIN_EMAILS = 'caselab.kr@gmail.com';

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? DEFAULT_ADMIN_EMAILS)
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminUser(): Promise<{ id: string; email: string | null } | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const email = user.email?.toLowerCase() ?? null;
  if (email && adminEmails().includes(email)) {
    return { id: user.id, email };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role === 'admin') {
    return { id: user.id, email };
  }

  return null;
}

export async function getIsAdmin(): Promise<boolean> {
  return (await getAdminUser()) !== null;
}
