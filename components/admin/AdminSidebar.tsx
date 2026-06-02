'use client';

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

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-white min-h-screen p-4">
      <Link href="/admin" className="block font-serif text-lg font-bold mb-6">
        케이스랩 Admin
      </Link>
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
    </aside>
  );
}
