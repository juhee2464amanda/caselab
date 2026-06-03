'use client';

import { useState, useTransition } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * 다뤄줬으면 하는 주제 제안 — input + submit (mockup index L546~549)
 */
export function SuggestInline() {
  const [val, setVal] = useState('');
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const supabase = createSupabaseBrowserClient();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!val.trim()) return;
    startTransition(async () => {
      try {
        await supabase
          .from('topic_suggestions')
          .insert({ title: val.trim(), status: 'open' });
      } catch {
        // best-effort: 인증 없으면 RLS로 차단 가능. silent
      }
      setVal('');
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    });
  }

  return (
    <form onSubmit={submit} className="flex gap-2 mt-3">
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={done ? '고마워요! 검토할게요' : '다뤄줬으면 하는 주제를 적어주세요'}
        disabled={pending || done}
        className="flex-1 px-3.5 py-2.5 text-sm border border-border rounded-lg bg-muted focus:bg-white focus:border-accent outline-none transition-all tracking-tight placeholder:text-ink/40"
      />
      <button
        type="submit"
        disabled={pending || !val.trim()}
        className="px-4 py-2.5 text-sm font-semibold text-white bg-accent hover:bg-accent-hover rounded-lg shrink-0 transition-colors disabled:opacity-50 tracking-tight"
      >
        제안
      </button>
    </form>
  );
}
