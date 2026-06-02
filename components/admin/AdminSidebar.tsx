'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FilePlus,
  Users,
  MessageSquare,
  MessagesSquare,
  BarChart3,
  BookOpen,
  Lightbulb,
  Wrench,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { group: '운영', items: [
    { href: '/admin', label: '콘텐츠', icon: LayoutDashboard },
    { href: '/admin/contents/new', label: '새 콘텐츠 작성', icon: FilePlus },
    { href: '/admin/tools', label: '자료실', icon: Wrench },
    { href: '/admin/ebooks', label: '전자책', icon: BookOpen },
    { href: '/admin/analytics', label: '분석', icon: BarChart3 },
  ]},
  { group: '소통', items: [
    { href: '/admin/users', label: '사용자', icon: Users },
    { href: '/admin/opinions', label: '의견함', icon: MessageSquare },
    { href: '/admin/comments', label: '댓글 모더레이션', icon: MessagesSquare },
    { href: '/admin/topics', label: '후보 카드', icon: Lightbulb },
  ]},
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-4">
      {NAV.map((g) => (
        <div key={g.group}>
          <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink/40">
            {g.group}
          </div>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const Icon = it.icon;
              const active = pathname === it.href || (it.href !== '/admin' && pathname.startsWith(it.href));
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm',
                      active ? 'bg-accent/10 text-accent font-medium' : 'text-ink/70 hover:bg-muted'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white px-4 py-3">
        <Link href="/admin" className="font-serif text-base font-bold">
          케이스랩 Admin
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="메뉴 열기"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden transition-opacity',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
        <aside
          className={cn(
            'absolute left-0 top-0 h-full w-72 bg-white shadow-elevated transition-transform',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <header className="flex items-center justify-between p-4 border-b border-border">
            <span className="font-serif text-lg font-bold">케이스랩 Admin</span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="닫기"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="p-4">
            <NavContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </aside>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 shrink-0 border-r border-border bg-white min-h-screen p-4">
        <Link href="/admin" className="block font-serif text-lg font-bold mb-6">
          케이스랩 Admin
        </Link>
        <NavContent />
      </aside>
    </>
  );
}
