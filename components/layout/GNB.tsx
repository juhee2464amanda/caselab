'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Search, User, Menu, ChevronDown } from 'lucide-react';
import { MegaMenu } from './MegaMenu';
import { MobileNav } from './MobileNav';
import { SubscribeModal } from './SubscribeModal';
import { cn } from '@/lib/utils';

/**
 * GNB — user mockup index.html 정합 (2026-06-03 풀 정합)
 *
 * 구조: Playfair italic "Caselab" 로고 + sub message + 메뉴(메가드롭다운)
 *       + 구독 버튼(파란) + 검색·로그인 아이콘
 *
 * mockup 출처: docs/design_mockup/user/index.html L250~315
 */

const NAV = [
  // mockup 순서 + 라벨
  { label: 'AI 자료실', href: '/tools', mega: true },
  { label: 'AI 실전케이스', href: '/cases' },
  { label: '바로 쓰는 프롬프트', href: '/prompts' },
  { label: 'ebook', href: '/ebooks' },
];

export function GNB() {
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openMega() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(true);
  }

  function closeMega() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaOpen(false), 250);
  }

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 w-full bg-white border-b border-border'
        )}
      >
        <div className="mx-auto max-w-[1100px] px-6 flex h-14 items-center justify-between gap-4">
          {/* 로고 + sub message */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-['Playfair_Display'] italic text-[28px] font-bold tracking-tight leading-none"
            >
              Caselab
            </Link>
            <span className="hidden md:inline-block text-xs font-medium text-ink/30 border-l border-border pl-3 ml-1 tracking-tight">
              일잘러의 검증된 AI 큐레이션
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* 네비 메뉴 */}
            <nav className="hidden md:flex items-center gap-[22px] text-[15px] font-medium text-ink/60 mr-4">
              {NAV.map((n) =>
                n.mega ? (
                  <div
                    key={n.href}
                    className="relative"
                    onMouseEnter={openMega}
                    onMouseLeave={closeMega}
                  >
                    <Link
                      href={n.href}
                      className="inline-flex items-center gap-0.5 hover:text-ink transition-colors"
                    >
                      {n.label}
                      <ChevronDown className="h-3 w-3" />
                    </Link>
                    {megaOpen && (
                      <MegaMenu
                        onClose={() => setMegaOpen(false)}
                        onMouseEnter={openMega}
                        onMouseLeave={closeMega}
                      />
                    )}
                  </div>
                ) : (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="hover:text-ink transition-colors"
                  >
                    {n.label}
                  </Link>
                )
              )}
            </nav>

            {/* 구독 버튼 (파란) */}
            <button
              type="button"
              onClick={() => setSubscribeOpen(true)}
              className="hidden sm:inline-flex items-center text-sm font-semibold text-white bg-accent hover:bg-accent-hover px-4 py-1.5 rounded-lg transition-colors"
            >
              구독하기
            </button>

            {/* 검색·로그인 아이콘 */}
            <Link
              href="/login"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink/60 hover:bg-muted transition-colors"
              aria-label="로그인"
            >
              <User className="h-5 w-5" strokeWidth={1.8} />
            </Link>
            <Link
              href="/search"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink/60 hover:bg-muted transition-colors"
              aria-label="검색"
            >
              <Search className="h-5 w-5" strokeWidth={1.8} />
            </Link>

            {/* 모바일 햄버거 */}
            <button
              type="button"
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
              onClick={() => setMobileOpen(true)}
              aria-label="메뉴 열기"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        nav={NAV}
        onSubscribe={() => setSubscribeOpen(true)}
      />
      <SubscribeModal open={subscribeOpen} onOpenChange={setSubscribeOpen} />
    </>
  );
}
