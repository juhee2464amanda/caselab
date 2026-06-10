'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  JOB_LABELS,
  JOB_TAGS,
  INTERESTS,
  INTEREST_LABELS,
  AI_TOOLS,
  AI_TOOL_LABELS,
} from '@/types/content';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/**
 * 온보딩 — 4종 입력 (§5-4 + D37 + D39 페르소나 자동 매핑 원천).
 *
 * 결정 출처:
 *   §19 D37 — profiles 4컬럼 확장 (job 필수 + job_title/interests/ai_tools 선택)
 *   §19 D39 — 페르소나 자동 매핑 (0003 trg_profiles_auto_persona가 update of job/interests/ai_tools 발화)
 *   ADMIN_SESSION_NOTES §5-4
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const supabase = createSupabaseBrowserClient();

  const [job, setJob] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [aiTools, setAiTools] = useState<string[]>([]);
  const [newsletter, setNewsletter] = useState(false); // 마케팅 수신 동의 (소셜 가입자 옵트인 지점)

  // 현재 동의 상태를 불러와 토글 초기값으로 (이메일 가입자는 가입 시 선택값이 반영돼 있음)
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('newsletter')
        .eq('id', user.id)
        .maybeSingle();
      if (active && data) setNewsletter(Boolean(data.newsletter));
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  function toggle(arr: string[], v: string): string[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  function submit() {
    if (!job) return;
    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      await supabase
        .from('profiles')
        .update({
          job,
          job_title: jobTitle || null,
          interests,
          ai_tools: aiTools,
          newsletter,
          onboarded: true,
        })
        .eq('id', user.id);
      // → trg_profiles_auto_persona가 job/interests/ai_tools 변경 감지 → persona 자동 매핑 (0003)
      router.push('/');
    });
  }

  return (
    <div className="min-h-[80vh] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        {/* 헤더 */}
        <header className="text-center">
          <h1 className="font-serif text-3xl font-semibold">
            가입을 환영해요. 무슨 일을 하세요?
          </h1>
          <p className="mt-2 text-ink/60">
            맞춤 콘텐츠 추천에만 써요. 마이페이지에서 언제든 바꿀 수 있어요.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mt-8 space-y-8"
        >
          {/* 1. 직무 (필수) */}
          <section>
            <Label>
              직무 <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
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
          </section>

          {/* 2. 직무 세부 (선택, 자유 입력) */}
          <section>
            <Label htmlFor="o-job-title">
              직무 세부{' '}
              <span className="text-ink/40 font-normal">(선택)</span>
            </Label>
            <Input
              id="o-job-title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="예: B2C 마케팅 기획자 / 콘텐츠 PD"
              className="mt-2"
            />
          </section>

          {/* 3. 관심 주제 (선택, 다중) */}
          <section>
            <Label>
              관심 주제{' '}
              <span className="text-ink/40 font-normal">(선택, 다중)</span>
            </Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERESTS.map((i) => {
                const on = interests.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInterests(toggle(interests, i))}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      on
                        ? 'border-accent bg-accent text-white'
                        : 'border-border bg-white text-ink hover:bg-muted'
                    )}
                  >
                    {INTEREST_LABELS[i]}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4. 사용 AI 도구 (선택, 다중) */}
          <section>
            <Label>
              사용 중인 AI 도구{' '}
              <span className="text-ink/40 font-normal">(선택, 다중)</span>
            </Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {AI_TOOLS.map((t) => {
                const on = aiTools.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAiTools(toggle(aiTools, t))}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      on
                        ? 'border-accent bg-accent text-white'
                        : 'border-border bg-white text-ink hover:bg-muted'
                    )}
                  >
                    {AI_TOOL_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 5. 마케팅 수신 동의 (선택) */}
          <section>
            <label className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
              />
              <span className="text-ink/80 keepall">
                <span className="text-ink/40 font-medium">(선택)</span> 뉴스레터·웨비나·새 콘텐츠 안내 등 마케팅 정보 수신에 동의합니다. 마이페이지에서 언제든 변경할 수 있어요.
              </span>
            </label>
          </section>

          {/* CTA */}
          <Button
            type="submit"
            disabled={!job || pending}
            variant="accent"
            className="w-full"
          >
            {pending ? '저장 중…' : '시작하기'}
          </Button>
          <p className="text-center text-xs text-ink/40">
            선택 항목은 비워둬도 시작할 수 있어요. 나중에 마이페이지에서 추가할
            수 있어요.
          </p>
        </form>
      </div>
    </div>
  );
}
