import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

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

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // /admin/* 가드
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = '/login';
      redirect.searchParams.set('next', pathname);
      return NextResponse.redirect(redirect);
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role !== 'admin') {
      const redirect = request.nextUrl.clone();
      redirect.pathname = '/';
      return NextResponse.redirect(redirect);
    }
  }

  // 로그인 유저 onboarded 강제
  if (user && !isPublicPath(pathname) && pathname !== '/onboarding') {
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
  }

  return response;
}
