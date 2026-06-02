'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JOB_LABELS, JOB_TAGS } from '@/types/content';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface Initial {
  id: string;
  name: string | null;
  email: string | null;
  job: string | null;
  newsletter: boolean;
}

export function ProfileForm({ initial }: { initial: Initial | null }) {
  const supabase = createSupabaseBrowserClient();
  const [name, setName] = useState(initial?.name ?? '');
  const [job, setJob] = useState(initial?.job ?? '');
  const [newsletter, setNewsletter] = useState(initial?.newsletter ?? true);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  if (!initial) return <p className="text-sm text-ink/60">프로필을 불러올 수 없어요.</p>;

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await supabase
        .from('profiles')
        .update({ name, job, newsletter })
        .eq('id', initial!.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <form onSubmit={save} className="card p-6 space-y-4 max-w-lg">
      <h2 className="font-semibold mb-2">프로필</h2>
      <div>
        <Label htmlFor="p-email">이메일</Label>
        <Input id="p-email" value={initial.email ?? ''} disabled />
      </div>
      <div>
        <Label htmlFor="p-name">이름</Label>
        <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>직무</Label>
        <Select value={job} onValueChange={setJob}>
          <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
          <SelectContent>
            {JOB_TAGS.map((j) => (
              <SelectItem key={j} value={j}>{JOB_LABELS[j]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={newsletter}
          onChange={(e) => setNewsletter(e.target.checked)}
        />
        뉴스레터 받기
      </label>
      <Button type="submit" variant="accent" disabled={pending}>
        {saved ? '저장됨' : '저장'}
      </Button>
    </form>
  );
}
