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

// case-1 (intent-5-steps) — mockup content.html 7섹션 풀 매핑
const intent5StepsBody: CaseBody = {
  kind: 'case',
  forWho: [
    '기획서 앞에서 빈 입력칸만 보면 머리가 하얘지는 분',
    'AI에게 뭘 시켜야 할지 모르겠어서 "기획서 써줘" 한 줄로 끝나는 분',
    'AI 결과물이 그럴듯한데 윗사람한테 가져가면 항상 막히는 분',
  ],
  caseIntro: [
    {
      type: 'text',
      markdown:
        '기획서는 답을 적는 자리가 아니라 질문을 적는 자리입니다. 그런데 막상 빈 화면 앞에 앉으면 무엇을 묻고 싶은지가 자기 안에서도 흐리고, 그래서 AI에 "기획서 좀 써줘"라고 던지게 됩니다.',
    },
    {
      type: 'text',
      markdown:
        '이 글은 그 막막함을 푸는 **5단계 의도 던지기** 케이스를 다룹니다. AI를 켜기 전 종이 한 장에서 시작해, 단계마다 사람이 의도를 만들고 AI가 그 의도를 비추는 구조로 가져갑니다.',
    },
  ],
  painPoints: [
    {
      num: '01',
      title: '"기획서 써줘" 한 줄로 시작',
      symptom: 'AI가 일반론을 쏟아내고, 받아 쓰는 사람이 추리는 데 더 오래 걸림.',
      rootCause: '의도가 없으면 AI는 가장 안전한 평균만 만든다.',
    },
    {
      num: '02',
      title: '결과물이 윗사람에게 막힘',
      symptom: '그럴듯한데 깊이가 없다는 피드백.',
      rootCause: '전제·가설을 건너뛰고 결론부터 적었기 때문에 질문에 못 버틴다.',
    },
    {
      num: '03',
      title: '한 번에 5단계를 다 시킴',
      symptom: 'AI가 가운데부터 헷갈리고 톤이 튀어다님.',
      rootCause: '단계마다 입력이 다른데 한 대화창에서 처리하려고 한다.',
    },
  ],
  frameworkReference: {
    name: '가설 기반 기획법 (Hypothesis-Driven Planning)',
    description:
      '문제정의 → 가설 → 검증 → 실행 → 측정의 5단계로 기획서를 구조화하는 방법론. 맥킨지·BCG 등 컨설팅펌에서 쓰는 가설 중심 사고법을 기획서 작성에 적용했습니다.',
    sourceLabel: '참고 영상 · 생각정리알고리즘',
    sourceTitle: '기획의 정석',
    sourceUrl: 'https://youtube.com/watch?v=l-sHPi44l1U',
    sourceThumbnail: 'https://i.ytimg.com/vi/l-sHPi44l1U/mqdefault.jpg',
  },
  stepCards: [
    {
      num: 1,
      label: '문제정의',
      description: '우리는 무엇을 모르고 있나.',
      human: '현재 알고 있는 것·모르는 것을 <strong>한 문단으로</strong> 적는다.',
      ai: '그 문단에서 "전제로 깔고 있는 것"을 찾아내게 한다.',
      prompt: `다음 문단은 [업무 맥락]에 대해 내가 지금 알고 있는 것이다.
이 문단이 전제로 깔고 있는 가정 5개를 뽑아주세요.
각 가정은 한 줄로, 의문문 형태로 다시 써주세요.

[문단 붙여넣기]`,
      goodResult:
        '"사용자가 매주 같은 화면에서 막힌다는 게 <em>정말 매주인가, 처음 시작할 때만인가</em>?"',
      badResult: '"사용자 인터뷰가 필요합니다." — 다음 단계 답을 미리 줌.',
    },
    {
      num: 2,
      label: '가설',
      description: '답이 어디 있을 것 같은가.',
      human: 'Step 1에서 나온 의문 중 <strong>가장 답답한 것 1개</strong>를 고른다.',
      ai: '그 질문에 대해 <em>서로 모순되는</em> 답 3가지를 만들게 한다.',
      prompt: `다음 질문에 대해, 서로 모순되는 답 3개를 만들어주세요.
각 답이 사실이라면 어떤 데이터로 입증되는지 한 줄로 덧붙여주세요.
선호하는 답을 고르지 마세요.

질문: [질문 붙여넣기]`,
      goodResult:
        'A "처음 시작할 때만 막힘 → 첫 3분 행동 로그", B "매주 막힘 → 주간 로그 비교"',
      badResult: '"사용자에게 직접 물어보세요." — 가설 없이 회피.',
    },
    {
      num: 3,
      label: '검증방법',
      description: '어떻게 확인할 것인가.',
      human: '가설 중 <strong>가장 빨리 답이 나올 것</strong>을 1개 고른다.',
      ai: '그 가설을 <em>1주일 안에</em> 검증하는 방법 3가지를 제안하게 한다.',
      prompt: `다음 가설을 1주일 안에 검증하는 방법 3가지를 제안하세요.
각 방법은:
- 무엇을 측정하는가
- 누구에게 시키는가
- 시간 비용 (시간 단위)
- 한계 (이걸로 못 잡는 것)

가설: [가설 붙여넣기]`,
    },
    {
      num: 4,
      label: '실행안',
      description: '그래서 무엇을 할 것인가.',
      human: '검증방법 1개를 골라 <strong>실행 단위</strong>로 쪼갠다.',
      ai: '각 단위를 "이번 주 안에 할 일"로 다시 써주게 한다.',
      prompt: `다음 검증방법을 이번 주 안에 끝낼 작업 5개로 쪼개주세요.
각 작업은:
- 동사로 시작
- 산출물 1개
- 예상 소요시간

검증방법: [검증방법 붙여넣기]`,
    },
    {
      num: 5,
      label: '측정',
      description: '잘 됐는지 어떻게 알 것인가.',
      human: '작업이 끝났을 때의 "성공" 기준을 <strong>한 줄</strong>로.',
      ai: '그 기준이 <em>실패</em>했다는 걸 가장 빨리 알 시그널 3가지를 정의하게 한다.',
      prompt: `다음 작업의 성공 기준이 [기준]입니다.
이 기준이 실패했다는 걸 가장 빨리 알 수 있는 시그널 3가지를 정의해주세요.

작업: [작업 붙여넣기]`,
    },
  ],
  pros: [
    '종이에 한 문단을 먼저 쓰니까 Step 1·2가 빠르고 깊어졌다',
    'Step 3·4(쪼개기·실행안)에서 AI가 가장 강했다',
    '단계마다 새 대화창으로 끊은 게 톤 유지에 결정적이었다',
  ],
  cons: [
    '한 번에 5단계를 다 시켰을 때 가운데부터 헷갈렸다',
    '프롬프트에 "예시"를 넣었더니 AI가 그 예시만 베껴왔다',
    'Step 5(측정)는 사실 AI 없이 사람이 하는 게 더 빠르다',
  ],
  takingPoints: [
    {
      title: 'AI를 켜기 전, 종이에 한 문단을 먼저 쓴다',
      description:
        '"내가 지금 무엇을 모르고 있는가"가 또렷해지면 AI 출력 품질이 한 차원 올라간다. 의도가 빠지면 결과가 평균화된다.',
      action: '바로 시도 → 다음 기획서에 종이 한 장 룰 적용',
    },
    {
      title: '단계마다 새 대화창으로 끊는다',
      description:
        '단계별 입력 맥락이 다른데 한 대화창에서 처리하면 톤이 튀고 가운데부터 헷갈린다.',
      action: '바로 시도 → Step별 대화 분리 룰',
    },
    {
      title: 'AI 강점은 쪼개기·실행안 — 의도 만들기는 사람이 더 잘한다',
      description:
        'Step 1·2(질문 만들기)는 사람이 종이로, Step 3·4(쪼개기·실행안)는 AI 위주. 시간 대비 결과가 가장 좋다.',
      action: '바로 시도 → 단계별 도구 분담 표 만들기',
    },
  ],

  // legacy 호환 — 기존 4섹션 필드 minimal로
  essence: [{ type: 'text', markdown: '(legacy)' }],
  framework: [
    {
      name: '(legacy)',
      description: '',
      intent: '(legacy)',
      blocks: [{ type: 'text', markdown: '(legacy)' }],
    },
  ],
  failures: [{ type: 'text', markdown: '(legacy)' }],
  review: [{ type: 'text', markdown: '(legacy)' }],
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
      '빈 입력칸 앞에서 막막한 이유는 AI가 부족해서가 아니라, 의도가 흐려서다.',
    body: intent5StepsBody,
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
