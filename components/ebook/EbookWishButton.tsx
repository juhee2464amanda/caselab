'use client';

import { useEffect, useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * ebook 위시(♡) 버튼 — mockup ebook-free.html .btn-sub 정합.
 * 로그인 시 saves(product_id)에 영속(insert/delete) → /mypage/saved 노출. 비로그인 → /login.
 */
export function EbookWishButton({ productId }: { productId: string }) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      const { data } = await supabase
        .from('saves')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();
      if (active) setSaved(!!data);
    })();
    return () => {
      active = false;
    };
  }, [productId, supabase]);

  function onClick() {
    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      if (saved) {
        await supabase.from('saves').delete().eq('user_id', user.id).eq('product_id', productId);
        setSaved(false);
      } else {
        await supabase.from('saves').insert({ user_id: user.id, product_id: productId });
        setSaved(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label="찜하기"
      aria-pressed={saved}
      className={cn(
        'flex items-center justify-center rounded-[10px] border px-5 py-4 transition-colors',
        saved
          ? 'border-accent text-accent'
          : 'border-border text-ink/50 hover:border-ink/30 hover:text-ink'
      )}
    >
      <Heart className="h-[18px] w-[18px]" fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}
