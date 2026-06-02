import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/auth', '/links', '/api', '/_next', '/favicon.ico'];

// admin 전용 (editor 진입 차단). 나머지 /admin/* 는 editor 도 허용.
// 계획서 §D17: editor 는 콘텐츠·자료실 운영, 분석·사용자·매출·설정·정산 영역은 admin only
const ADMIN_ONLY_PREFIXES = [
  '/admin/users',
  '/admin/analytics',
  '/admin/revenue',
  '/admin/settings',
  '/admin/ebooks',
  '/admin/opinions',
  '/admin/comments',
  '/admin/newsletters',
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function isAdminOnly(pathname: string) {
  return ADMIN_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
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

  // /admin/* 가드 — role-aware (editor 도 일부 진입 허용, admin only 경로는 별도)
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
    const role = profile?.role ?? 'user';
    const isAdmin = role === 'admin';
    const isEditor = role === 'editor';

    if (!isAdmin && !isEditor) {
      // user 는 /admin 진입 불가
      const redirect = request.nextUrl.clone();
      redirect.pathname = '/';
      return NextResponse.redirect(redirect);
    }
    if (isEditor && isAdminOnly(pathname)) {
      // editor 는 분석·사용자·매출·설정·이메일 운영 영역 진입 불가 → /admin (콘텐츠 목록) 으로 보냄
      const redirect = request.nextUrl.clone();
      redirect.pathname = '/admin';
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
