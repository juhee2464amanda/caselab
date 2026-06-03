'use client';

import { useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * 이런 거 다뤄주세요 — 후보 카드 compact (mockup index L542~545)
 *
 * ↑ 버튼 + 카운트 + 제목 한 줄. mockup 정합.
 */

export interface VoteItem {
  id: string;
  title: string;
  vote_count: number;
}

export function VoteCompact({ items: initial }: { items: VoteItem[] }) {
  const [items, setItems] = useState(initial);
  const supabase = createSupabaseBrowserClient();

  async function vote(id: string) {
    const next = items.map((it) =>
      it.id === id ? { ...it, vote_count: it.vote_count + 1 } : it
    );
    setItems(next);
    try {
      // best-effort. 인증 없으면 RLS로 차단됨 → silent
      await supabase.rpc('vote_topic', { topic_id: id });
    } catch {
      // silent
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-3">
      {items.map((it) => (
        <div
          key={it.id}
          className="flex items-center gap-2.5 py-2 border-b border-muted last:border-b-0"
        >
          <button
            type="button"
            onClick={() => vote(it.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1 border border-border rounded-md bg-white text-[13px] font-bold text-ink/50 hover:border-accent hover:text-accent hover:bg-accent/10 transition-all shrink-0"
          >
            <ChevronUp className="h-3 w-3" />
            <span className="min-w-[18px] text-center">{it.vote_count}</span>
          </button>
          <span className="text-sm font-medium text-ink/80 tracking-tight keepall">
            {it.title}
          </span>
        </div>
      ))}
    </div>
  );
}
