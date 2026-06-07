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
import type { Tool } from '@/types/tool';
import type { PromptItem } from '@/types/prompt';
import type { GuideItem } from '@/types/guide';

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
  // ── Trends (track:'trend', 발행일 분산: 1/3/6개월 필터 데모용) ──
  {
    id: 'seed-trend-1',
    slug: 'claude-memory-1week',
    track: 'trend',
    title: 'Claude 메모리 기능, 실제로 일에 쓸만한가— 1주일 실험',
    summary:
      '대화를 기억한다는 메모리 기능을 실제 업무 루틴에 1주일 붙여봤다. 어디서 빛나고 어디서 헛도는지.',
    body: minimalCaseBody,
    job_tags: ['planning'],
    persona_coverage: ['A'],
    read_min: 5,
    apply_min: 0,
    status: 'published',
    curated: false,
    thumbnail_url:
      'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=400&q=80',
    author_quote: null,
    view_count: 0,
    published_at: '2026-05-21T00:00:00.000Z',
    created_at: '2026-05-21T00:00:00.000Z',
    updated_at: '2026-05-21T00:00:00.000Z',
  },
  {
    id: 'seed-trend-2',
    slug: 'gemini-vs-gpt-research',
    track: 'trend',
    title: '리서치엔 Gemini, 초안엔 GPT— 한 달 써보고 갈라본 기준',
    summary:
      '두 모델을 같은 업무에 한 달 번갈아 쓰며 정리한, 작업 종류별 선택 기준.',
    body: minimalCaseBody,
    job_tags: ['marketing'],
    persona_coverage: ['E'],
    read_min: 6,
    apply_min: 0,
    status: 'published',
    curated: false,
    thumbnail_url:
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&q=80',
    author_quote: null,
    view_count: 0,
    published_at: '2026-04-10T00:00:00.000Z',
    created_at: '2026-04-10T00:00:00.000Z',
    updated_at: '2026-04-10T00:00:00.000Z',
  },
  {
    id: 'seed-trend-3',
    slug: 'mcp-for-non-devs',
    track: 'trend',
    title: 'MCP, 비개발자에게도 의미 있나— 한 달 지켜본 결론',
    summary:
      'AI 앱을 외부 도구와 잇는 MCP 표준이 실무자에게 어떤 변화를 주는지, 과장 빼고 정리.',
    body: minimalCaseBody,
    job_tags: ['planning', 'marketing'],
    persona_coverage: ['A', 'E'],
    read_min: 7,
    apply_min: 0,
    status: 'published',
    curated: false,
    thumbnail_url:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
    author_quote: null,
    view_count: 0,
    published_at: '2026-01-15T00:00:00.000Z',
    created_at: '2026-01-15T00:00:00.000Z',
    updated_at: '2026-01-15T00:00:00.000Z',
  },
];

// ─────────────────────────────────────────────
// Tools (mockup tools.html 9개 도구 풀 매핑)
// ─────────────────────────────────────────────
export const toolSeed: Tool[] = [
  {
    id: 'seed-tool-1',
    slug: 'snipit',
    name: 'Snipit',
    category: 'research',
    description:
      '경쟁사 메타 광고·레퍼런스를 AI가 알아서 모아주는 마케터·기획자용 도구. 막연한 한 줄만 던져도 됨.',
    thumbnail_url: null,
    thumbnail_emoji: '🔍',
    pricing_label: '무료 플랜',
    is_paid: false,
    has_review: true,
    status: 'published',
    created_at: T,
  },
  {
    id: 'seed-tool-2',
    slug: 'proby',
    name: 'Proby',
    category: 'research',
    description:
      'AI가 사용자에게 꼬리질문까지 던지는 심층 인터뷰 도구. 다국어 인터뷰도 자동 번역·요약·페르소나 도출.',
    thumbnail_url: null,
    thumbnail_emoji: '💬',
    pricing_label: '유료',
    is_paid: true,
    has_review: true,
    status: 'published',
    created_at: T,
  },
  {
    id: 'seed-tool-3',
    slug: 'screenflow',
    name: 'ScreenFlow',
    category: 'design',
    description:
      'URL 하나 넣으면 웹사이트 전체 플로우를 자동 캡처. 피그마로 바로 복사할 수 있어 화면 설계가 빨라짐.',
    thumbnail_url: null,
    thumbnail_emoji: '🖼️',
    pricing_label: '유료',
    is_paid: true,
    has_review: true,
    status: 'published',
    created_at: T,
  },
  {
    id: 'seed-tool-4',
    slug: 'v0',
    name: 'v0',
    category: 'design',
    description:
      '프롬프트로 UI 컴포넌트를 바로 만들어주는 Vercel의 AI 도구. 와이어프레임 단계에서 특히 유용.',
    thumbnail_url: null,
    thumbnail_emoji: '⚡',
    pricing_label: '무료 플랜',
    is_paid: false,
    status: 'published',
    created_at: T,
  },
  {
    id: 'seed-tool-5',
    slug: 'make',
    name: 'Make',
    category: 'automation',
    description:
      '앱 간 자동화 워크플로우. 구글시트 → 슬랙 알림 같은 반복 작업을 코드 없이 연결.',
    thumbnail_url: null,
    thumbnail_emoji: '🔗',
    pricing_label: '무료 플랜',
    is_paid: false,
    status: 'published',
    created_at: T,
  },
  {
    id: 'seed-tool-6',
    slug: 'perplexity',
    name: 'Perplexity',
    category: 'research',
    description:
      '검색 + AI 답변이 합쳐진 리서치 도구. 출처가 달려있어서 사실 확인이 빠름.',
    thumbnail_url: null,
    thumbnail_emoji: '🔎',
    pricing_label: '무료 플랜',
    is_paid: false,
    status: 'published',
    created_at: T,
  },
  {
    id: 'seed-tool-7',
    slug: 'gamma',
    name: 'Gamma',
    category: 'presentation',
    description:
      '프롬프트로 발표 자료를 만들어주는 도구. PPT 디자인 시간을 크게 줄여줌.',
    thumbnail_url: null,
    thumbnail_emoji: '📊',
    pricing_label: '무료 플랜',
    is_paid: false,
    status: 'published',
    created_at: T,
  },
  {
    id: 'seed-tool-8',
    slug: 'deepl-write',
    name: 'DeepL Write',
    category: 'writing',
    description:
      '영문 이메일·보고서 톤을 자연스럽게 다듬어주는 AI 교정 도구. 번역기보다 정확한 뉘앙스.',
    thumbnail_url: null,
    thumbnail_emoji: '✍️',
    pricing_label: '무료 플랜',
    is_paid: false,
    status: 'published',
    created_at: T,
  },
  {
    id: 'seed-tool-9',
    slug: 'cursor',
    name: 'Cursor',
    category: 'coding',
    description:
      'AI가 코드를 같이 짜주는 에디터. 비개발자도 간단한 자동화 스크립트 만들 때 유용.',
    thumbnail_url: null,
    thumbnail_emoji: '💻',
    pricing_label: '무료 플랜',
    is_paid: false,
    pro_pricing: 'Pro $20/월',
    status: 'published',
    created_at: T,
  },
];

// ─────────────────────────────────────────────
// Prompts (mockup prompts.html 8개 정합)
// ─────────────────────────────────────────────
export const promptSeed: PromptItem[] = [
  {
    id: 'seed-prompt-1',
    slug: 'hidden-assumptions-5',
    title: '이 주장이 숨기고 있는 전제 5개 찾기',
    prompt:
      '다음 글이 전제로 깔고 있는 가정 5개를 뽑아주세요. 각 가정은 의문문 형태로 다시 써 주세요.',
    category: 'think',
    source: 'Anthropic 공식',
    sourceUrl:
      'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview',
  },
  {
    id: 'seed-prompt-2',
    slug: 'three-perspectives',
    title: '같은 주제, 세 관점으로 다시 쓰기',
    prompt:
      '이 주제를 [낙관 / 회의 / 현실주의] 세 가지 관점에서 각각 100자 이내로 답해 주세요. 결론까지 포함해서.',
    category: 'think',
    source: 'Karpathy',
  },
  {
    id: 'seed-prompt-3',
    slug: 'strongest-counterarguments',
    title: '결정 직전— "가장 강한 반대 입장 3개"',
    prompt:
      '방금 내가 내린 결정에 대해, 가장 강력한 반대 논리 3개를 만들어 주세요. 각 논리가 사실이라면 어떤 데이터로 입증되는지 한 줄로.',
    category: 'think',
    source: 'Claude Code',
  },
  {
    id: 'seed-prompt-4',
    slug: 'table-to-paragraph',
    title: '표·차트를 한 문단으로 요약',
    prompt:
      '이 표의 핵심 흐름을 사실 → 의미 → 시사점 순서로 한 문단(3~5문장)으로 요약해 주세요. 숫자는 원문 그대로 인용.',
    category: 'make',
    source: 'OpenAI Cookbook',
  },
  {
    id: 'seed-prompt-5',
    slug: 'proposal-first-page',
    title: '기획서 첫 페이지— 전제를 찾아주는 프롬프트',
    prompt:
      '다음 문단이 전제로 깔고 있는 가정 5개를 뽑아주세요. 각 가정은 의문문 형태로 다시 써주세요.',
    category: 'make',
    source: 'Caselab 검증',
  },
  {
    id: 'seed-prompt-6',
    slug: 'find-3-weaknesses',
    title: '방금 답변의 약점 3개 찾아줘',
    prompt:
      '방금 답변에서 사실과 다를 수 있는 부분, 논리적 약점, 빠진 관점 3개를 찾아 주세요.',
    category: 'verify',
    source: 'Anthropic 공식',
  },
  {
    id: 'seed-prompt-7',
    slug: 'biggest-reason-wrong',
    title: '이 결론이 틀릴 수 있는 가장 큰 이유 1개',
    prompt:
      '방금 결론이 틀릴 수 있는 가장 큰 이유를, 가능성 높은 순으로 1개만 말해 주세요. 검증할 방법도 한 줄로.',
    category: 'verify',
    source: 'Latent Space',
  },
  {
    id: 'seed-prompt-8',
    slug: 'markdown-to-slack',
    title: '마크다운 → Slack 붙여넣기용 plain text',
    prompt:
      '아래 마크다운을 Slack에 그대로 붙여넣을 수 있는 plain text로 변환해 주세요. 굵게는 *별표*, 코드 블록은 ``` 로 유지.',
    category: 'refine',
    source: 'Claude Code',
  },
];

// ─────────────────────────────────────────────
// Guides (mockup guides.html 대표 12개)
// ─────────────────────────────────────────────
export const guideSeed: GuideItem[] = [
  {
    id: 'seed-guide-1', slug: 'anthropic-prompt-engineering',
    title: 'Anthropic 프롬프트 엔지니어링 가이드',
    description: 'Claude를 잘 쓰기 위한 공식 가이드. 프롬프트 구조, 역할 지정, 체인 오브 소트까지.',
    url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview',
    category: 'prompt', source: '공식 문서', sourceType: 'default',
    thumbLabel: '✳ Claude API Docs', thumbBg: '#f5f5f0', thumbColor: '#1a1a1a',
    linkLabel: 'docs.anthropic.com',
  },
  {
    id: 'seed-guide-2', slug: 'openai-prompt-best-practices',
    title: 'OpenAI 프롬프트 베스트 프랙티스',
    description: 'GPT를 더 정확하게 쓰는 6가지 전략. 예시가 풍부해서 바로 따라할 수 있음.',
    url: 'https://platform.openai.com/docs/guides/prompt-engineering',
    category: 'prompt', source: '공식 문서', sourceType: 'default',
    thumbLabel: 'OpenAI Developers', thumbBg: '#ffffff', thumbColor: '#000000',
    linkLabel: 'platform.openai.com',
  },
  {
    id: 'seed-guide-3', slug: 'google-gemini-prompt-design',
    title: 'Google Gemini 프롬프트 디자인 전략',
    description: 'Gemini 기준 프롬프트 설계 원칙. Few-shot·Chain-of-thought·시스템 인스트럭션 예시.',
    url: 'https://ai.google.dev/gemini-api/docs/prompting-strategies',
    category: 'prompt', source: '공식 문서', sourceType: 'default',
    thumbLabel: 'Google AI for Developers', thumbBg: '#ffffff', thumbColor: '#333333',
    linkLabel: 'ai.google.dev',
  },
  {
    id: 'seed-guide-4', slug: 'dair-ai-prompt-engineering-guide',
    title: 'Prompt Engineering Guide — 가장 종합적인 커뮤니티 가이드',
    description: '프롬프팅·컨텍스트 엔지니어링·RAG·AI 에이전트까지 다루는 75k stars의 종합 가이드. 13개 언어 번역.',
    url: 'https://github.com/dair-ai/Prompt-Engineering-Guide',
    category: 'prompt', source: 'GitHub · 커뮤니티', sourceType: 'github',
    thumbLabel: 'dair-ai / Prompt-Engineering-Guide  ★ 75k', thumbBg: '#0d1117', thumbColor: '#ffffff',
    linkLabel: 'github.com/dair-ai/Prompt-Engineering-Guide',
  },
  {
    id: 'seed-guide-5', slug: 'anthropic-customer-stories',
    title: 'Anthropic Customer Stories',
    description: 'Notion, Slack, Figma 같은 회사가 Claude를 실제 업무에 어떻게 끼워 넣었는지. 산업·규모·제품별 필터 가능.',
    url: 'https://claude.com/customers',
    category: 'cases', source: '고객 사례', sourceType: 'default',
    thumbLabel: '✳ Claude Customers', thumbBg: '#f5f5f0', thumbColor: '#1a1a1a',
    linkLabel: 'claude.com/customers',
  },
  {
    id: 'seed-guide-6', slug: 'stanford-ai-index',
    title: 'Stanford AI Index — AI 산업 연례 데이터 리포트',
    description: '스탠퍼드 HAI가 매년 발표하는 AI 산업 전체 데이터. 투자·인력·모델 성능·정책까지. 가장 인용되는 공식 리포트.',
    url: 'https://hai.stanford.edu/ai-index',
    category: 'cases', source: '산업 리포트', sourceType: 'default',
    thumbLabel: 'Stanford · HAI', thumbBg: '#8c1515', thumbColor: '#ffffff',
    linkLabel: 'hai.stanford.edu/ai-index',
  },
  {
    id: 'seed-guide-7', slug: 'anthropic-courses',
    title: 'Anthropic Courses — 공식 무료 코스 5종',
    description: 'API 기초·프롬프트 엔지니어링·실전 프롬프팅·평가·도구 사용. Anthropic이 직접 만든 인터랙티브 튜토리얼.',
    url: 'https://github.com/anthropics/courses',
    category: 'education', source: '무료 코스', sourceType: 'course',
    thumbLabel: 'anthropics / courses  ★ 21.6k', thumbBg: '#0d1117', thumbColor: '#ffffff',
    linkLabel: 'github.com/anthropics/courses',
  },
  {
    id: 'seed-guide-8', slug: 'microsoft-genai-for-beginners',
    title: 'Generative AI for Beginners — Microsoft 공식 21레슨',
    description: 'Microsoft가 만든 생성형 AI 입문 코스. LLM, 프롬프트 엔지니어링, RAG, 에이전트, 파인튜닝까지 21레슨.',
    url: 'https://github.com/microsoft/generative-ai-for-beginners',
    category: 'education', source: '무료 코스', sourceType: 'course',
    thumbLabel: 'microsoft / gen-ai-for-beginners  ★ 111k', thumbBg: '#0d1117', thumbColor: '#ffffff',
    linkLabel: 'github.com/microsoft/generative-ai-for-beginners',
  },
  {
    id: 'seed-guide-9', slug: 'anthropic-cookbook',
    title: 'Anthropic Cookbook — Claude 활용 레시피 모음',
    description: '분류·RAG·요약·도구 사용·멀티모달·프롬프트 캐싱·파인튜닝까지 실제로 동작하는 노트북·레시피 모음.',
    url: 'https://github.com/anthropics/anthropic-cookbook',
    category: 'skills', source: 'GitHub · Anthropic 공식', sourceType: 'github',
    thumbLabel: 'anthropics / anthropic-cookbook', thumbBg: '#0d1117', thumbColor: '#ffffff',
    linkLabel: 'github.com/anthropics/anthropic-cookbook',
  },
  {
    id: 'seed-guide-10', slug: 'awesome-chatgpt-prompts',
    title: 'awesome-chatgpt-prompts — 가장 큰 오픈소스 프롬프트 라이브러리',
    description: '"세계 최대 오픈소스 프롬프트 라이브러리." 어떤 모델이든 통하는 검증된 프롬프트 수백 개.',
    url: 'https://github.com/f/awesome-chatgpt-prompts',
    category: 'skills', source: 'GitHub · 커뮤니티', sourceType: 'github',
    thumbLabel: 'f / awesome-chatgpt-prompts  ★ 163k', thumbBg: '#0d1117', thumbColor: '#ffffff',
    linkLabel: 'github.com/f/awesome-chatgpt-prompts',
  },
  {
    id: 'seed-guide-11', slug: 'building-effective-agents',
    title: 'Building Effective Agents — Anthropic 공식',
    description: '복잡한 프레임워크보다 단순·조합 가능한 패턴이 성공한다는 Anthropic의 실전 조언. 에이전트 vs 워크플로우 구분이 핵심.',
    url: 'https://www.anthropic.com/research/building-effective-agents',
    category: 'agents', source: '연구 글', sourceType: 'default',
    thumbLabel: '✳ Anthropic Research', thumbBg: '#f5f5f0', thumbColor: '#1a1a1a',
    linkLabel: 'anthropic.com/research',
  },
  {
    id: 'seed-guide-12', slug: 'model-context-protocol',
    title: 'MCP — AI 앱과 외부 시스템을 잇는 USB-C 표준',
    description: 'Claude·ChatGPT·Cursor·VS Code가 모두 따르는 오픈 표준. 데이터·도구·워크플로우를 한 번 만들면 어디서든 연결.',
    url: 'https://modelcontextprotocol.io',
    category: 'agents', source: '공식 표준', sourceType: 'default',
    thumbLabel: '⬡ Model Context Protocol', thumbBg: '#0a0a0a', thumbColor: '#ffffff',
    linkLabel: 'modelcontextprotocol.io',
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
