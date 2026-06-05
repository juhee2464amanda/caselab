/**
 * Dev seed — Supabase 빈 결과일 때만 fallback (NODE_ENV=development 한정)
 *
 * 출처: docs/design_mockup/user/cases.html 의 정적 article 5개
 * 가드: process.env.NODE_ENV === 'development' && Supabase 결과 비어있을 때
 * production 영향: 0 (NODE_ENV=production에선 import만 되고 사용 안 됨)
 *
 * 출시 Day 3~7에 Supabase에 실제 콘텐츠 INSERT되면 자동으로 fallback이 안 쓰임.
 */

import type { ContentRow, CaseBody, JobTag } from '@/types/content';

const minimalCaseBody: CaseBody = {
  kind: 'case',
  essence: [{ type: 'text', markdown: '(dev seed — 본문은 상세 페이지 작업 시 추가)' }],
  framework: [
    {
      name: 'Step 1',
      description: '',
      intent: '의도 정리',
      blocks: [{ type: 'text', markdown: '(dev seed)' }],
    },
  ],
  failures: [{ type: 'text', markdown: '(dev seed)' }],
  review: [{ type: 'text', markdown: '(dev seed)' }],
  customization: ['시점', '톤', '범위', '깊이'],
};

const T = '2026-06-03T00:00:00.000Z';

export const caseSeed: ContentRow[] = [
  {
    id: 'seed-case-1',
    slug: 'intent-5-steps',
    track: 'case',
    title: "기획서 첫 페이지가 안 풀릴 때— '의도' 던지는 5단계",
    summary:
      '빈 입력칸 앞에서 막막한 이유는 AI가 부족해서가 아니라, 의도가 흐려서다. 종이 한 장으로 시작하는 5단계.',
    body: minimalCaseBody,
    job_tags: ['planning'],
    persona_coverage: ['A'],
    read_min: 8,
    apply_min: 30,
    status: 'published',
    curated: false,
    thumbnail_url:
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&q=80',
    author_quote: null,
    view_count: 0,
    published_at: T,
    created_at: T,
    updated_at: T,
  },
  {
    id: 'seed-case-2',
    slug: 'competitor-analysis',
    track: 'case',
    title: '경쟁사 분석, AI가 표면만 긁고 끝나는 이유',
    summary:
      '"경쟁사 5곳 분석해줘"는 거의 모두 실패한다. AI에게 깊이를 만들게 하려면 사람이 먼저 좁혀야 한다 — 4단계.',
    body: minimalCaseBody,
    job_tags: ['marketing'],
    persona_coverage: ['E'],
    read_min: 7,
    apply_min: 40,
    status: 'published',
    curated: false,
    thumbnail_url:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
    author_quote: null,
    view_count: 0,
    published_at: T,
    created_at: T,
    updated_at: T,
  },
  {
    id: 'seed-case-3',
    slug: 'tone-3-steps',
    track: 'case',
    title: '윗사람 톤에 안 맞는 결과물— AI에게 다시 시키는 3단계',
    summary:
      '"이거 윗분이 안 좋아할 거 같은데"의 95%는 톤 문제다. 톤을 잡는 한국형 프롬프트 패턴.',
    body: minimalCaseBody,
    job_tags: ['sales'],
    persona_coverage: ['D'],
    read_min: 6,
    apply_min: 25,
    status: 'published',
    curated: false,
    thumbnail_url:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80',
    author_quote: null,
    view_count: 0,
    published_at: T,
    created_at: T,
    updated_at: T,
  },
  {
    id: 'seed-case-4',
    slug: 'interview-organize',
    track: 'case',
    title: '고객 인터뷰 정리— AI에게 시킬 것·시키지 말 것',
    summary:
      '인터뷰 녹취 20시간을 AI에 통째로 던지면 다 비슷한 요약이 나온다. 사람이 먼저 분리해야 하는 두 가지.',
    body: minimalCaseBody,
    job_tags: ['solo'],
    persona_coverage: ['C'],
    read_min: 9,
    apply_min: 60,
    status: 'published',
    curated: false,
    thumbnail_url:
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80',
    author_quote: null,
    view_count: 0,
    published_at: T,
    created_at: T,
    updated_at: T,
  },
  {
    id: 'seed-case-5',
    slug: 'rebuttal-4-methods',
    track: 'case',
    title: 'AI가 정당화만 한다?— 반박시키는 4가지 지시법',
    summary:
      '가설을 던지면 반박이 아니라 정당화가 돌아온다. 약점 찾기, 반대 입장, 역사적 실패, 숨은 가정으로 깨는 법.',
    body: minimalCaseBody,
    job_tags: ['planning', 'marketing'],
    persona_coverage: ['A', 'E'],
    read_min: 8,
    apply_min: 10,
    status: 'published',
    curated: false,
    thumbnail_url:
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80',
    author_quote: null,
    view_count: 0,
    published_at: T,
    created_at: T,
    updated_at: T,
  },
];

export function applyCaseFilters(
  items: ContentRow[],
  opts: {
    track?: 'case' | 'trend';
    job?: string;
    timeCap?: number;
    limit?: number;
    curated?: boolean;
  }
): ContentRow[] {
  let result = items;
  if (opts.track) result = result.filter((c) => c.track === opts.track);
  if (opts.curated) result = result.filter((c) => c.curated);
  if (opts.job) {
    const j = opts.job as JobTag;
    result = result.filter((c) => c.job_tags.includes(j));
  }
  if (opts.timeCap) result = result.filter((c) => c.read_min <= opts.timeCap!);
  if (opts.limit) result = result.slice(0, opts.limit);
  return result;
}
