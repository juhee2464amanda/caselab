'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const TOC = [
  { id: 's1', label: '01. 이런 분들을 위한 글' },
  { id: 's2', label: '02. 어떤 케이스를 다루나요' },
  { id: 's3', label: '03. 막히는 이유' },
  { id: 's4', label: '04. 적용한 Framework' },
  { id: 's5', label: '05. 단계별 AI 활용' },
  { id: 's6', label: '06. 좋았던 점·아쉬웠던 점' },
  { id: 's7', label: '07. 핵심 Taking point' },
];

export function LeftToc() {
  const [active, setActive] = useState('s1');

  useEffect(() => {
    function onScroll() {
      const scrollPos = window.scrollY + 120;
      let current = '';
      TOC.forEach((t) => {
        const el = document.getElementById(t.id);
        if (el && el.offsetTop <= scrollPos) current = t.id;
      });
      if (current) setActive(current);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className="hidden xl:block w-[200px] flex-shrink-0 py-10 pr-6">
      <div className="sticky top-[72px]">
        <div className="text-[11px] font-bold text-ink/40 uppercase tracking-[0.04em] mb-3">
          목차
        </div>
        {TOC.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            className={cn(
              'block text-[13px] font-medium py-1.5 pl-3 border-l-2 transition-colors',
              active === t.id
                ? 'text-accent border-accent font-semibold'
                : 'text-ink/40 border-transparent hover:text-ink'
            )}
          >
            {t.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
