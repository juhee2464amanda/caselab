'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, User, Menu, Instagram } from 'lucide-react';
import { MegaMenu } from './MegaMenu';
import { MobileNav } from './MobileNav';
import { SubscribeModal } from './SubscribeModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { INSTAGRAM_URL } from '@/lib/constants';

const NAV = [
  { label: '실전 케이스', href: '/cases' },
  { label: 'AI 트렌드', href: '/trends' },
  { label: '자료실', href: '/tools', mega: true },
  { label: '전자책', href: '/ebooks' },
  { label: '이런 거 어때요', href: '/topics' },
];

export function GNB() {
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);

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
          'sticky top-0 z-40 w-full bg-bg/95 backdrop-blur transition-shadow',
          scrolled && 'border-b border-border shadow-card'
        )}
      >
        <div className="container-wide flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-serif text-xl font-bold tracking-tight">
              케이스랩
            </Link>
            <nav className="hidden lg:flex items-center gap-1">
              {NAV.map((n) => (
                <div
                  key={n.href}
                  className="relative"
                  onMouseEnter={() => n.mega && setMegaOpen(true)}
                  onMouseLeave={() => n.mega && setMegaOpen(false)}
                >
                  <Link
                    href={n.href}
                    className="px-3 py-2 text-sm font-medium text-ink/80 hover:text-ink"
                  >
                    {n.label}
                  </Link>
                  {n.mega && megaOpen && <MegaMenu onClose={() => setMegaOpen(false)} />}
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
              aria-label="인스타그램"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <Link
              href="/search"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
              aria-label="검색"
            >
              <Search className="h-4 w-4" />
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => setSubscribeOpen(true)}
            >
              구독
            </Button>
            <Link
              href="/login"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
              aria-label="로그인"
            >
              <User className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
              onClick={() => setMobileOpen(true)}
              aria-label="메뉴 열기"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} nav={NAV} />
      <SubscribeModal open={subscribeOpen} onOpenChange={setSubscribeOpen} />
    </>
  );
}
