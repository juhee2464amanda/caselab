import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser } from '@/lib/auth/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 홈 인라인 편집 저장 — site_content 에 key→value upsert.
 * 관리자만(403). 서비스롤로 RLS 우회 upsert 후 홈 재검증.
 */
export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 });
  }

  let body: { key?: unknown; value_type?: unknown; value?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const key = typeof body.key === 'string' ? body.key.trim() : '';
  const valueType = body.value_type === 'image' ? 'image' : 'text';
  const value = typeof body.value === 'string' ? body.value : '';
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await db.from('site_content').upsert(
    {
      key,
      value_type: valueType,
      value,
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    },
    { onConflict: 'key' },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/');
  return NextResponse.json({ ok: true });
}
