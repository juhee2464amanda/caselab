'use client';

import { useEffect, useState, useTransition } from 'react';
import { Heart, Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * ebook 좋아요(♡)·저장(🔖) 버튼 — 콘텐츠/도구 ActionsBar와 동일 동작.
 * 좋아요 → reactions(like) → /mypage/liked, 저장 → saves → /mypage/saved (둘 다 product_id).
 * 비로그인 클릭 → /login. mockup .btn-sub 스타일 정합.
 */
export function EbookActions({ productId }: { productId: string }) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      const [{ data: r }, { data: s }] = await Promise.all([
        supabase.from('reactions').select('id').eq('user_id', user.id).eq('product_id', productId).eq('type', 'like').maybeSingle(),
        supabase.from('saves').select('id').eq('user_id', user.id).eq('product_id', productId).maybeSingle(),
      ]);
      if (!active) return;
      setLiked(!!r);
      setSaved(!!s);
    })();
    return () => {
      active = false;
    };
  }, [productId, supabase]);

  function toggle(kind: 'like' | 'save') {
    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      if (kind === 'like') {
        if (liked) {
          await supabase.from('reactions').delete().eq('user_id', user.id).eq('product_id', productId).eq('type', 'like');
          setLiked(false);
        } else {
          await supabase.from('reactions').insert({ user_id: user.id, product_id: productId, type: 'like' });
          setLiked(true);
        }
      } else {
        if (saved) {
          await supabase.from('saves').delete().eq('user_id', user.id).eq('product_id', productId);
          setSaved(false);
        } else {
          await supabase.from('saves').insert({ user_id: user.id, product_id: productId });
          setSaved(true);
        }
      }
    });
  }

  const base = 'flex items-center justify-center rounded-[10px] border px-5 py-4 transition-colors disabled:opacity-50';

  return (
    <>
      <button
        type="button"
        onClick={() => toggle('like')}
        disabled={pending}
        aria-label="좋아요"
        aria-pressed={liked}
        className={cn(base, liked ? 'border-accent text-accent' : 'border-border text-ink/50 hover:border-ink/30 hover:text-ink')}
      >
        <Heart className="h-[18px] w-[18px]" fill={liked ? 'currentColor' : 'none'} />
      </button>
      <button
        type="button"
        onClick={() => toggle('save')}
        disabled={pending}
        aria-label="저장"
        aria-pressed={saved}
        className={cn(base, saved ? 'border-accent text-accent' : 'border-border text-ink/50 hover:border-ink/30 hover:text-ink')}
      >
        <Bookmark className="h-[18px] w-[18px]" fill={saved ? 'currentColor' : 'none'} />
      </button>
    </>
  );
}
