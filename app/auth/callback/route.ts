import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  // login 페이지가 어떤 provider 버튼을 눌렀는지 전달 (구글/카카오). 콜백과의 계약.
  const usedProvider = searchParams.get('provider');

  // OAuth provider가 에러로 돌려준 경우 (사용자 동의 취소 등)
  if (searchParams.get('error')) {
    return NextResponse.redirect(`${origin}/login?error=oauth_denied`);
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // 쿠키를 버퍼에 누적했다가 최종 확정된 redirect 응답에 일괄 적용한다.
  // (성공/차단 redirect URL이 갈리고, signOut()이 쿠키 삭제를 다시 트리거하기 때문)
  const cookieBuffer: CookieToSet[] = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies: CookieToSet[]) => {
          for (const c of cookies) {
            const idx = cookieBuffer.findIndex((b) => b.name === c.name);
            if (idx >= 0) cookieBuffer[idx] = c; // 나중 호출이 우선 (예: signOut의 삭제 쿠키)
            else cookieBuffer.push(c);
          }
        },
      },
    }
  );

  const redirectWithCookies = (path: string) => {
    const res = NextResponse.redirect(`${origin}${path}`);
    for (const { name, value, options } of cookieBuffer) {
      res.cookies.set(name, value, options);
    }
    return res;
  };

  // 1. 코드 → 세션 교환 (setAll로 세션 쿠키가 버퍼에 쌓임)
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  // 2. automatic linking이 반영된 최신 user/identities 조회
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  const identities = user.identities ?? [];

  // 3. 신규가입(identity 1개 이하) → 검증 불필요, 통과
  // 4. provider 파라미터 누락 → fail-safe로 통과 (정상 로그인을 막지 않음)
  if (identities.length <= 1 || !usedProvider) {
    return redirectWithCookies(next);
  }

  // 5. 가장 먼저 가입한 provider = created_at 최소값
  const sorted = [...identities].sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : Number.POSITIVE_INFINITY;
    const tb = b.created_at ? Date.parse(b.created_at) : Number.POSITIVE_INFINITY;
    return ta - tb;
  });
  const originalProvider = sorted[0]?.provider;

  // 6. 방금 쓴 방식 == 최초 가입 방식 → 정상 통과
  if (!originalProvider || usedProvider === originalProvider) {
    return redirectWithCookies(next);
  }

  // 7. 다른 방식으로 로그인 시도 → 자동연결된 identity 제거 + 세션 무효화 + 차단
  const { data: idData } = await supabase.auth.getUserIdentities();
  const target = idData?.identities.find((i) => i.provider === usedProvider);
  if (target) {
    const { error: unlinkError } = await supabase.auth.unlinkIdentity(target);
    // Manual Linking 미설정 등으로 실패해도 로그인은 차단 (보안 우선). DB 정리는 운영 모니터링.
    if (unlinkError) {
      console.error('[auth/callback] unlinkIdentity failed:', unlinkError.message);
    }
  }
  await supabase.auth.signOut();

  return redirectWithCookies(
    `/login?error=email_in_use&provider=${encodeURIComponent(originalProvider)}`
  );
}
