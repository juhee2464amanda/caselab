'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EbookTocItem } from '@/types/product';

/**
 * ebook 목차 — 펼쳐보기/접기 (mockup ebook-free.html .toc-wrap 정합).
 * 접힌 상태는 max-height 284px + 하단 흰색 페이드.
 */
export function EbookToc({ items }: { items: EbookTocItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="relative">
        <ol
          className={cn(
            'list-none transition-[max-height] duration-300',
            !open && 'max-h-[284px] overflow-hidden'
          )}
        >
          {items.map((t, i) => (
            <li key={i} className="flex gap-3.5 border-b border-border py-3.5">
              <span className="min-w-7 text-base font-extrabold text-border">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h4 className="mb-0.5 text-[15px] font-bold tracking-[-0.02em] break-keep">
                  {t.title}
                </h4>
                <p className="text-[13px] text-ink/60 break-keep">{t.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        {!open && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[120px] bg-gradient-to-b from-transparent to-white" />
        )}
      </div>
      {items.length > 4 && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="ml-auto mt-2 flex items-center gap-1 px-1 py-2 text-[13.5px] font-semibold text-accent transition-colors hover:text-ink"
        >
          {open ? '접기' : '펼쳐보기'}
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </button>
      )}
    </div>
  );
}
