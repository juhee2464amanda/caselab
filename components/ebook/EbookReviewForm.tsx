'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';

/**
 * ebook 리뷰 작성 폼 (mockup ebook-free.html .review-form 정합).
 * 로그인 후에만 등록 가능. 별점 선택 → textarea → 등록.
 * (백엔드 저장 배선은 후속 — 현재는 입력 UI까지)
 */
export function EbookReviewForm() {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  const filled = hover || rating;
  const canSubmit = !!user && rating > 0 && !done;

  return (
    <div className="mb-5 rounded-xl border border-border bg-white p-5">
      <div className="mb-2.5 text-sm font-extrabold tracking-[-0.02em]">이 책 어떠셨나요?</div>

      <div className="mb-3 inline-flex select-none gap-0.5" role="radiogroup" aria-label="별점">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            aria-label={`${v}점`}
            onMouseEnter={() => setHover(v)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(v)}
            className="leading-none"
          >
            <Star
              className={cn(
                'h-6 w-6 transition-colors',
                v <= filled ? 'text-amber-400' : 'text-border'
              )}
              fill={v <= filled ? 'currentColor' : 'none'}
              strokeWidth={v <= filled ? 0 : 1.5}
            />
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="이 책에서 가장 도움이 된 부분, 아쉬웠던 점을 자유롭게 적어주세요."
        className="min-h-20 w-full resize-y rounded-[10px] border border-border bg-white px-3.5 py-3 text-sm outline-none placeholder:text-ink/40 focus:border-ink"
      />

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-ink/50">
          {done
            ? '소중한 평가 감사합니다. 등록 기능은 곧 제공됩니다.'
            : user
              ? '별점을 선택하고 등록해주세요.'
              : (
                <>
                  <Link href="/login" className="font-semibold text-ink underline underline-offset-2">
                    로그인
                  </Link>{' '}
                  후 평가를 남길 수 있습니다.
                </>
              )}
        </span>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => setDone(true)}
          className="rounded-lg bg-ink px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-border"
        >
          등록
        </button>
      </div>
    </div>
  );
}
