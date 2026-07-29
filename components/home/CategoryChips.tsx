'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * 카테고리 칩 — 모바일 전용 sticky 가로 스크롤 내비 (요즘IT 패턴)
 *
 * GNB(sticky top-0, h-14) 바로 아래 top-14 로 고정. 데스크톱은 GNB 메뉴가 있으므로 숨김.
 * 현재 경로에 해당하는 칩은 accent 채움으로 강조(활성 상태).
 */

const CHIPS = [
  { label: '실전케이스', href: '/cases' },
  { label: 'AI 트렌드', href: '/trends' },
  { label: 'AI 도구', href: '/tools' },
  { label: '프롬프트', href: '/prompts' },
  { label: '공식 가이드', href: '/guides' },
  { label: 'ebook', href: '/ebooks' },
];

export function CategoryChips() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="카테고리 바로가기"
      className="md:hidden sticky top-14 z-30 bg-white/95 backdrop-blur border-b border-border"
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-none snap-x px-4 py-2.5">
        {CHIPS.map((c) => {
          const active = pathname === c.href || pathname.startsWith(`${c.href}/`);
          return (
            <Link
              key={c.href}
              href={c.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'snap-start shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                active
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-muted text-ink/80 active:bg-border',
              )}
            >
              {c.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
