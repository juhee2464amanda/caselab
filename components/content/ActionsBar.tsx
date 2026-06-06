'use client';

import { useState } from 'react';
import { Heart, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 좋아요·저장 액션 바.
 * 현재 로컬 state만 — DB wiring(Supabase liked_contents·saved_contents)은 다음 PR.
 */
export function ActionsBar() {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex items-center gap-4 py-5 border-y border-border my-10">
      <button
        type="button"
        onClick={() => setLiked((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 text-sm font-medium transition-colors',
          liked ? 'text-accent' : 'text-ink/60 hover:text-accent'
        )}
      >
        <Heart
          className="w-[18px] h-[18px]"
          fill={liked ? 'currentColor' : 'none'}
        />
        좋아요
      </button>
      <button
        type="button"
        onClick={() => setSaved((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 text-sm font-medium ml-auto transition-colors',
          saved ? 'text-accent' : 'text-ink/60 hover:text-accent'
        )}
      >
        <Bookmark
          className="w-[18px] h-[18px]"
          fill={saved ? 'currentColor' : 'none'}
        />
        저장
      </button>
    </div>
  );
}
