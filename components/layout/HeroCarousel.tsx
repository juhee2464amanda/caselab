'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ContentRow } from '@/types/content';
import { cn } from '@/lib/utils';

interface Props {
  items: Pick<ContentRow, 'slug' | 'title' | 'summary' | 'track' | 'thumbnail_url' | 'read_min' | 'apply_min'>[];
}

export function HeroCarousel({ items }: Props) {
  const [idx, setIdx] = useState(0);

  if (!items?.length) {
    return (
      <section className="my-8 rounded-lg bg-muted aspect-[16/9] sm:aspect-[21/9] flex items-center justify-center text-ink/40 text-sm">
        곧 첫 콘텐츠를 발행할게요.
      </section>
    );
  }

  const current = items[idx];

  return (
    <section className="my-8 relative">
      <Link
        href={`/${current.track === 'case' ? 'cases' : 'trends'}/${current.slug}`}
        className="block overflow-hidden rounded-lg border border-border bg-white group"
      >
        <div className="grid sm:grid-cols-[1fr_1.2fr]">
          <div className="p-8 sm:p-10 flex flex-col justify-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
              {current.track === 'case' ? '실전 케이스' : 'AI 트렌드'}
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight">
              {current.title}
            </h2>
            {current.summary && (
              <p className="mt-3 text-sm text-ink/70 leading-relaxed line-clamp-3">
                {current.summary}
              </p>
            )}
            <div className="mt-4 text-xs text-ink/50">
              읽기 {current.read_min}분 · 적용 {current.apply_min}분
            </div>
          </div>
          {current.thumbnail_url ? (
            <img
              src={current.thumbnail_url}
              alt=""
              className="w-full aspect-[16/10] sm:aspect-auto object-cover"
            />
          ) : (
            <div className="aspect-[16/10] sm:aspect-auto bg-muted" />
          )}
        </div>
      </Link>

      {items.length > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === idx ? 'w-6 bg-accent' : 'w-1.5 bg-ink/20'
                )}
                aria-label={`슬라이드 ${i + 1}`}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setIdx((idx - 1 + items.length) % items.length)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border bg-white hover:bg-muted"
              aria-label="이전"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIdx((idx + 1) % items.length)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border bg-white hover:bg-muted"
              aria-label="다음"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
