import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 회원 탈퇴 — 개인정보처리방침 '회원 탈퇴 시까지 보관' 이행 경로.
 *
 * POST (본인 세션 필수) →
 *  1) profiles.newsletter=false — 0019 트리거가 Brevo 해지(blacklist)까지 전파
 *  2) auth.admin.deleteUser — auth.users 삭제, FK cascade로
 *     profiles·comments·reviews·saves·reactions 등 회원 데이터 일괄 파기
 * 클라이언트는 성공 후 로컬 세션을 정리하고 홈으로 이동한다.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 });
  }
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 탈퇴 전에 뉴스레터를 끊어 Brevo 해지를 전파(행 삭제는 트리거를 못 태움)
  await admin.from('profiles').update({ newsletter: false }).eq('id', user.id);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
