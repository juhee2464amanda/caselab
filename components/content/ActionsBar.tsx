'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics/track';

/**
 * 좋아요·저장 액션 바 — 콘텐츠(contentId)·도구(toolId)·제품(productId) 대상.
 * 로그인 시 reactions/saves에 영속(insert/delete). 비로그인 클릭 → /login.
 */
export function ActionsBar({
  contentId,
  toolId,
  productId,
}: {
  contentId?: string;
  toolId?: string;
  productId?: string;
}) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const col = contentId ? 'content_id' : toolId ? 'tool_id' : 'product_id';
  const id = contentId ?? toolId ?? productId;

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;
      const [{ data: r }, { data: s }] = await Promise.all([
        supabase.from('reactions').select('id').eq('user_id', user.id).eq(col, id).eq('type', 'like').maybeSingle(),
        supabase.from('saves').select('id').eq('user_id', user.id).eq(col, id).maybeSingle(),
      ]);
      if (!active) return;
      setLiked(!!r);
      setSaved(!!s);
    })();
    return () => {
      active = false;
    };
  }, [id, col, supabase]);

  function toggle(kind: 'like' | 'save') {
    if (!id) return;
    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      // events 적재 메타 — content는 content_id(FK), tool은 metadata.tool_id
      const evMeta = contentId ? { content_id: contentId } : { tool_id: toolId };
      if (kind === 'like') {
        if (liked) {
          await supabase.from('reactions').delete().eq('user_id', user.id).eq(col, id).eq('type', 'like');
          setLiked(false);
        } else {
          await supabase.from('reactions').insert({ user_id: user.id, [col]: id, type: 'like' });
          setLiked(true);
          void track('react_up', evMeta); // weekly_kpi 도움률 원천 (DB event_type='react')
        }
      } else {
        if (saved) {
          await supabase.from('saves').delete().eq('user_id', user.id).eq(col, id);
          setSaved(false);
        } else {
          await supabase.from('saves').insert({ user_id: user.id, [col]: id });
          setSaved(true);
          void track('save', evMeta); // weekly_kpi 저장률·퍼널 원천
        }
      }
    });
  }

  return (
    <div className="flex items-center gap-4 py-5 border-y border-border my-10">
      <button
        type="button"
        onClick={() => toggle('like')}
        disabled={pending}
        className={cn(
          'flex items-center gap-1.5 text-sm font-medium transition-colors',
          liked ? 'text-accent' : 'text-ink/60 hover:text-accent',
        )}
      >
        <Heart className="w-[18px] h-[18px]" fill={liked ? 'currentColor' : 'none'} />
        좋아요
      </button>
      <button
        type="button"
        onClick={() => toggle('save')}
        disabled={pending}
        className={cn(
          'flex items-center gap-1.5 text-sm font-medium ml-auto transition-colors',
          saved ? 'text-accent' : 'text-ink/60 hover:text-accent',
        )}
      >
        <Bookmark className="w-[18px] h-[18px]" fill={saved ? 'currentColor' : 'none'} />
        저장
      </button>
    </div>
  );
}
