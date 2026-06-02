'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  nav: { label: string; href: string }[];
}

export function MobileNav({ open, onClose, nav }: Props) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 lg:hidden transition-opacity',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <aside className={cn(
        'absolute right-0 top-0 h-full w-72 bg-white shadow-elevated transition-transform',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        <header className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-serif text-lg font-bold">메뉴</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <nav className="p-4 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={onClose}
              className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted"
            >
              {n.label}
            </Link>
          ))}
          <hr className="my-3 border-border" />
          <Link
            href="/login"
            onClick={onClose}
            className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted"
          >
            로그인
          </Link>
          <Link
            href="/mypage"
            onClick={onClose}
            className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted"
          >
            마이페이지
          </Link>
        </nav>
      </aside>
    </div>
  );
}
