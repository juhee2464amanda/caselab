import { NextResponse } from 'next/server';
import { getIsAdmin } from '@/lib/auth/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 관리자 여부 신호 — 클라이언트 편집모드/배지 노출 판단용.
 * 민감정보 없음(불리언만). 실제 쓰기는 각 admin API 에서 재검증한다.
 */
export async function GET() {
  return NextResponse.json({ admin: await getIsAdmin() });
}
