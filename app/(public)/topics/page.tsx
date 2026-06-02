'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ThumbsUp } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface Topic {
  id: string;
  title: string;
  description: string | null;
  vote_count: number;
}

export default function TopicsPage() {
  const supabase = createSupabaseBrowserClient();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      const { data } = await supabase
        .from('topic_suggestions')
        .select('id, title, description, vote_count')
        .eq('status', 'open')
        .order('vote_count', { ascending: false });
      setTopics(data ?? []);
      if (user) {
        const { data: votes } = await supabase
          .from('topic_votes')
          .select('suggestion_id')
          .eq('user_id', user.id);
        setMyVotes(new Set((votes ?? []).map((v) => v.suggestion_id)));
      }
    })();
  }, [supabase]);

  function toggleVote(id: string) {
    if (!user) return alert('로그인이 필요해요');
    startTransition(async () => {
      if (myVotes.has(id)) {
        await supabase.from('topic_votes').delete().eq('user_id', user.id).eq('suggestion_id', id);
        setMyVotes((s) => { const n = new Set(s); n.delete(id); return n; });
        setTopics((t) => t.map((x) => x.id === id ? { ...x, vote_count: Math.max(x.vote_count - 1, 0) } : x));
      } else {
        await supabase.from('topic_votes').insert({ user_id: user.id, suggestion_id: id });
        setMyVotes((s) => new Set(s).add(id));
        setTopics((t) => t.map((x) => x.id === id ? { ...x, vote_count: x.vote_count + 1 } : x));
      }
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    startTransition(async () => {
      const { data } = await supabase
        .from('topic_suggestions')
        .insert({ title: title.trim(), description: desc.trim(), author_id: user.id })
        .select('id, title, description, vote_count')
        .single();
      if (data) setTopics((t) => [data, ...t]);
      setTitle('');
      setDesc('');
    });
  }

  return (
    <div className="container-wide py-10">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold">이런 거 어때요</h1>
        <p className="mt-2 text-ink/60">읽고 싶은 주제 투표 · 새 후보 제안.</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3">
          {topics.length === 0 && <li className="card p-10 text-center text-ink/40">첫 후보를 곧 올릴게요.</li>}
          {topics.map((t) => (
            <li key={t.id} className="card p-5 flex gap-4">
              <button
                type="button"
                onClick={() => toggleVote(t.id)}
                disabled={pending}
                className={`flex flex-col items-center justify-center w-16 shrink-0 rounded-md border ${myVotes.has(t.id) ? 'border-accent bg-accent/10 text-accent' : 'border-border text-ink/60'}`}
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="text-sm font-bold mt-1">{t.vote_count}</span>
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{t.title}</h3>
                {t.description && <p className="text-sm text-ink/70 mt-1">{t.description}</p>}
              </div>
            </li>
          ))}
        </ul>

        <aside className="card p-5 h-fit lg:sticky lg:top-20">
          <h3 className="font-semibold mb-3">새 후보 제안</h3>
          {user ? (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label htmlFor="t-title">제목</Label>
                <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="t-desc">설명 (선택)</Label>
                <Textarea id="t-desc" value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
              <Button type="submit" variant="accent" className="w-full" disabled={pending}>제안하기</Button>
            </form>
          ) : (
            <p className="text-sm text-ink/60">로그인하면 후보를 제안할 수 있어요.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
