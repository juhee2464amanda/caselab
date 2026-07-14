import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

/**
 * 홈페이지 오버라이드 로드 — site_content 전량을 key→value 맵으로.
 *
 * 하드코딩 카피/이미지 및 히어로 표시값의 "덮어쓰기"만 담는다.
 * 오버라이드가 없으면 호출측이 하드코딩 기본값을 그대로 쓴다(pick 참고).
 */
export async function getSiteOverrides(): Promise<Map<string, string>> {
  if (!isSupabaseConfigured()) return new Map();
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from('site_content').select('key, value');
    return new Map((data ?? []).map((r) => [r.key as string, r.value as string]));
  } catch {
    return new Map();
  }
}

/** 오버라이드가 있으면 그 값, 없으면 하드코딩 기본값. */
export function pick(map: Map<string, string>, key: string, fallback: string): string {
  const v = map.get(key);
  return v != null && v !== '' ? v : fallback;
}
