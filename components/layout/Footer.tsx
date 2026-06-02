import Link from 'next/link';
import { Instagram } from 'lucide-react';
import { INSTAGRAM_URL, INSTAGRAM_HANDLE, CONTACT_EMAIL } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-white">
      <div className="container-wide py-10 text-sm text-ink/60">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="font-serif text-lg font-bold text-ink mb-2">케이스랩</div>
            <p className="text-xs leading-relaxed">
              일이 풀리는 AI 사용법. Framework × 단계별 AI 실행 × 솔직한 후기.
            </p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-ink/70 hover:text-ink"
            >
              <Instagram className="h-3.5 w-3.5" />
              {INSTAGRAM_HANDLE}
            </a>
          </div>
          <div>
            <div className="font-semibold text-ink mb-2 text-sm">콘텐츠</div>
            <ul className="space-y-1.5">
              <li><Link href="/cases">실전 케이스</Link></li>
              <li><Link href="/trends">AI 트렌드</Link></li>
              <li><Link href="/tools">자료실</Link></li>
              <li><Link href="/ebooks">전자책</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-ink mb-2 text-sm">소통</div>
            <ul className="space-y-1.5">
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-ink"
                >
                  <Instagram className="h-3.5 w-3.5" /> 인스타그램
                </a>
              </li>
              <li><Link href="/topics">이런 거 어때요</Link></li>
              <li><Link href="/opinions/new">의견 보내기</Link></li>
              <li><Link href="/mypage/support">고객센터</Link></li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink">
                  문의: {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border text-xs flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
          <div>© 2026 케이스랩. 개인 운영. All rights reserved.</div>
          <nav className="flex gap-3">
            <Link href="/legal/privacy" className="hover:text-ink">개인정보처리방침</Link>
            <Link href="/legal/terms" className="hover:text-ink">이용약관</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
