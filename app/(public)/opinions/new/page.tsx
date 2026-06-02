'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function OpinionsNewPage() {
  const supabase = createSupabaseBrowserClient();
  const [body, setBody] = useState('');
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('opinions').insert({
        body: body.trim(),
        email: email || user?.email || null,
        user_id: user?.id ?? null,
      });
      setDone(true);
    });
  }

  return (
    <div className="container-narrow py-10">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold">의견 보내기</h1>
        <p className="mt-2 text-ink/60">
          익명도 괜찮아요. 어떤 콘텐츠가 필요한지, 무엇이 별로였는지 솔직히 알려주세요.
        </p>
      </header>

      {done ? (
        <div className="card p-8 text-center">
          <p className="text-sm">잘 받았어요. 곧 답장 드릴게요. 🙏</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 card p-6">
          <div>
            <Label htmlFor="email">이메일 (선택, 답장받으실 곳)</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="body">의견</Label>
            <Textarea id="body" required value={body} onChange={(e) => setBody(e.target.value)} rows={8} />
          </div>
          <Button type="submit" variant="accent" className="w-full" disabled={pending}>
            보내기
          </Button>
        </form>
      )}
    </div>
  );
}
