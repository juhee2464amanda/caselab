import Link from 'next/link';

/**
 * Footer — user mockup index.html 정합 (L555~564, 2026-06-03)
 *
 * mockup은 한 줄 단순 푸터. 회사 정체성 + 링크 2~3개 + 카피.
 */
export function Footer() {
  return (
    <footer className="mt-14 py-7 border-t border-border">
      <div className="mx-auto max-w-[1100px] px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="text-[13px] text-ink/50 keepall">
          <strong className="font-bold text-ink">케이스랩</strong>
          {' — 내 일에 AI를 어떻게 쓸지, 실험하며 찾아가는 공간.'}
        </div>
        <nav className="flex items-center gap-4 text-[13px] text-ink/50">
          <Link href="/ebooks" className="hover:text-ink/80 transition-colors">
            ebook
          </Link>
          <Link href="/legal/terms" className="hover:text-ink/80 transition-colors">
            이용약관
          </Link>
          <Link href="/legal/privacy" className="hover:text-ink/80 transition-colors">
            개인정보 처리방침
          </Link>
          <span className="text-ink/30">© 2026</span>
        </nav>
      </div>
    </footer>
  );
}
