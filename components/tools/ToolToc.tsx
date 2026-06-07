'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ToolToc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '');

  useEffect(() => {
    function onScroll() {
      const pos = window.scrollY + 120;
      let cur = items[0]?.id ?? '';
      items.forEach((it) => {
        const el = document.getElementById(it.id);
        if (el && el.offsetTop <= pos) cur = it.id;
      });
      setActive(cur);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [items]);

  if (items.length <= 1) return null;

  return (
    <nav className="hidden xl:block w-[180px] shrink-0 pr-8" aria-label="페이지 목차">
      <div className="sticky top-20">
        <div className="text-[11px] font-bold text-ink/40 uppercase tracking-[0.04em] mb-3">목차</div>
        {items.map((it) => (
          <a
            key={it.id}
            href={`#${it.id}`}
            className={cn(
              'block text-[13px] py-1.5 pl-3 border-l-2 transition-colors',
              active === it.id
                ? 'text-accent border-accent font-semibold'
                : 'text-ink/50 border-transparent hover:text-ink',
            )}
          >
            {it.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
