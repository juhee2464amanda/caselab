'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface Initial {
  id: string;
  name: string | null;
  email: string | null;
  job: string | null;
  job_title: string | null;
  interests: string[] | null;
  ai_tools: string[] | null;
  newsletter: boolean;
}

/**
 * 풀 설정 페이지 (D38) — 온보딩 4종 변경 + 뉴스레터 + 분석 동의.
 *
 * 결정 출처:
 *   §19 D38 — /mypage/profile 풀 설정 (출시 포함)
 *   §19 D37 — profiles 컬럼 확장 (job_title, interests[], ai_tools[])
 *   §18.20 — 분석 동의 UI 제거(고지 기반 수집). analytics_consent 토글 삭제
 */
export function ProfileForm({ initial }: { initial: Initial | null }) {
  const supabase = createSupabaseBrowserClient();
  const [name, setName] = useState(initial?.name ?? '');
  const [job, setJob] = useState(initial?.job ?? '');
  const [jobTitle, setJobTitle] = useState(initial?.job_title ?? '');
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? []);
  const [aiTools, setAiTools] = useState<string[]>(initial?.ai_tools ?? []);
  const [newsletter, setNewsletter] = useState(initial?.newsletter ?? true);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  if (!initial)
    return <p className="text-sm text-ink/60">프로필을 불러올 수 없어요.</p>;

  function toggle(arr: string[], v: string): string[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await supabase
        .from('profiles')
        .update({
          name,
          job,
          job_title: jobTitle || null,
          interests,
          ai_tools: aiTools,
          newsletter,
        })
        .eq('id', initial!.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <form onSubmit={save} className="card p-6 space-y-6 max-w-2xl">
      <header>
        <h2 className="font-serif text-xl font-semibold">프로필</h2>
        <p className="text-xs text-ink/60 mt-1">
          맞춤 콘텐츠 추천에만 써요. 언제든 바꿀 수 있어요.
        </p>
      </header>

      {/* 기본 정보 */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-ink/80">기본 정보</h3>
        <div>
          <Label htmlFor="p-email">이메일</Label>
          <Input id="p-email" value={initial.email ?? ''} disabled />
        </div>
        <div>
          <Label htmlFor="p-name">이름</Label>
          <Input
            id="p-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </section>

      {/* 직무 */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-ink/80">직무 정보</h3>
        <div>
          <Label>
            직무 <span className="text-red-500">*</span>
          </Label>
          <Select value={job} onValueChange={setJob}>
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {JOB_TAGS.map((j) => (
                <SelectItem key={j} value={j}>
                  {JOB_LABELS[j]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="p-job-title">
            직무 세부{' '}
            <span className="text-ink/40 font-normal">(선택, 자유 입력)</span>
          </Label>
          <Input
            id="p-job-title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="예: B2C 마케팅 기획자 / 콘텐츠 PD"
          />
        </div>
      </section>

      {/* 관심 주제 (선택) */}
      <section>
        <Label>
          관심 주제 <span className="text-ink/40 font-normal">(선택, 다중)</span>
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

      {/* AI 도구 (선택) */}
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

      {/* 동의 토글 */}
      <section className="space-y-3 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-ink/80">알림·동의</h3>
        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={newsletter}
            onChange={(e) => setNewsletter(e.target.checked)}
          />
          <span>
            <strong>뉴스레터 받기</strong>
            <span className="block text-xs text-ink/60 mt-0.5">
              새 콘텐츠·후보 카드 결과를 주 1회 받아요.
            </span>
          </span>
        </label>
      </section>

      <Button type="submit" variant="accent" disabled={pending} className="w-full">
        {saved ? '저장됨 ✓' : pending ? '저장 중…' : '저장'}
      </Button>
    </form>
  );
}
