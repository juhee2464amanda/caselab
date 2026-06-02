'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { JOB_LABELS, JOB_TAGS } from '@/types/content';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function OnboardingPage() {
  const [job, setJob] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  function submit() {
    if (!job) return;
    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      await supabase
        .from('profiles')
        .update({ job, onboarded: true })
        .eq('id', user.id);
      router.push('/');
    });
  }

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-10">
      <div className="w-full max-w-lg text-center">
        <h1 className="font-serif text-3xl font-semibold">
          가입을 환영해요. 무슨 일을 하세요?
        </h1>
        <p className="mt-2 text-ink/60">
          맞춤 콘텐츠 추천에만 써요. 언제든 마이페이지에서 바꿀 수 있어요.
        </p>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {JOB_TAGS.map((j) => (
            <button
              key={j}
              type="button"
              onClick={() => setJob(j)}
              className={cn(
                'rounded-md border px-4 py-3 text-sm font-medium transition-colors',
                job === j
                  ? 'border-accent bg-accent text-white'
                  : 'border-border bg-white text-ink hover:bg-muted'
              )}
            >
              {JOB_LABELS[j]}
            </button>
          ))}
        </div>

        <Button
          onClick={submit}
          disabled={!job || pending}
          variant="accent"
          className="mt-8 w-full"
        >
          시작하기
        </Button>
      </div>
    </div>
  );
}
