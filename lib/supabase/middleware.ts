import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * user app middleware — 2026-06-03 단순화 (§28 정리)
 *
 * admin 가드는 caselab_admin/ 별도 repo로 이관됨.
 * 본 app은 user 가드만 — 로그인 + onboarded 강제.
 */

const PUBLIC_PATHS = ['/login', '/auth', '/links', '/api', '/_next', '/favicon.ico'];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  // Supabase 미설정 — 정적 페이지만 통과
  if (!url || !key) return response;

  // 비로그인(auth 쿠키 없음) — Supabase Auth 왕복 없이 즉시 통과.
  // 익명 방문자의 모든 페이지 이동에서 네트워크 왕복을 제거한다 (모바일 체감속도 핵심).
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
  if (!hasAuthCookie) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;

    // 로그인 유저 onboarded 강제 — 확인 결과는 쿠키에 캐시해 매 이동마다 DB 조회하지 않는다
    if (user && !isPublicPath(pathname) && pathname !== '/onboarding') {
      if (request.cookies.get('cl-onboarded')?.value !== '1') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('id', user.id)
          .maybeSingle();
        if (profile && !profile.onboarded) {
          const redirect = request.nextUrl.clone();
          redirect.pathname = '/onboarding';
          return NextResponse.redirect(redirect);
        }
        if (profile?.onboarded) {
          response.cookies.set('cl-onboarded', '1', { path: '/', maxAge: 60 * 60 * 24 * 30 });
        }
      }
    }
  } catch {
    // Supabase 일시 장애가 사이트 전체 500으로 번지지 않도록 가드 없이 통과
  }

  return response;
}
