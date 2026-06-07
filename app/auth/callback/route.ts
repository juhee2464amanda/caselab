import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // OAuth provider가 에러로 돌려준 경우 (사용자 동의 취소 등)
  if (searchParams.get('error')) {
    return NextResponse.redirect(`${origin}/login?error=oauth_denied`);
  }

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookies: { name: string; value: string; options?: CookieOptions }[]) => {
            cookies.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
    }
    return response;
  }
  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
