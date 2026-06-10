'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';

/**
 * ebook 위시(♡) 버튼 — mockup ebook-free.html .btn-sub 정합.
 * 비로그인 시 로그인 유도, 로그인 시 토글. (영속 저장은 후속)
 */
export function EbookWishButton() {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(false);

  function onClick() {
    if (!user) {
      router.push('/login');
      return;
    }
    setLiked((v) => !v);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="찜하기"
      aria-pressed={liked}
      className={cn(
        'flex items-center justify-center rounded-[10px] border px-5 py-4 transition-colors',
        liked
          ? 'border-accent text-accent'
          : 'border-border text-ink/50 hover:border-ink/30 hover:text-ink'
      )}
    >
      <Heart className="h-[18px] w-[18px]" fill={liked ? 'currentColor' : 'none'} />
    </button>
  );
}
