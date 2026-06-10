'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface EbookNavTab {
  id: string;
  label: string;
}

/**
 * ebook 상세 — sticky scroll-spy 탭 (mockup ebook-free.html .detail-nav 정합).
 * GNB(56px) 아래 고정되며, 스크롤 위치에 따라 활성 탭을 표시한다.
 */
export function EbookDetailNav({ tabs }: { tabs: EbookNavTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? '');

  useEffect(() => {
    const ids = tabs.map((t) => t.id);
    function onScroll() {
      const pos = window.scrollY + 130;
      let cur = ids[0] ?? '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= pos) cur = id;
      }
      setActive(cur);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [tabs]);

  function go(e: React.MouseEvent, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav
      aria-label="ebook 상세 섹션"
      className="sticky top-14 z-40 -mx-4 mt-8 flex overflow-x-auto border-b border-border bg-bg px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((t) => (
        <a
          key={t.id}
          href={`#${t.id}`}
          onClick={(e) => go(e, t.id)}
          className={cn(
            '-mb-px whitespace-nowrap border-b-2 px-5 py-3.5 text-[14.5px] font-semibold transition-colors',
            active === t.id
              ? 'border-ink text-ink'
              : 'border-transparent text-ink/45 hover:text-ink/80'
          )}
        >
          {t.label}
        </a>
      ))}
    </nav>
  );
}
