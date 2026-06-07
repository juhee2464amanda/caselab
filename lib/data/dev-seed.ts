/**
 * Dev seed — Supabase 빈 결과일 때만 fallback (NODE_ENV=development 한정)
 *
 * 출처: docs/design_mockup/user/cases.html 의 정적 article 5개
 * 가드: process.env.NODE_ENV === 'development' && Supabase 결과 비어있을 때
 * production 영향: 0 (NODE_ENV=production에선 import만 되고 사용 안 됨)
 *
 * 출시 Day 3~7에 Supabase에 실제 콘텐츠 INSERT되면 자동으로 fallback이 안 쓰임.
 */

import type { ContentRow, CaseBody, TrendBody, JobTag } from '@/types/content';
import type { Tool } from '@/types/tool';
import type { PromptItem } from '@/types/prompt';
import type { GuideItem } from '@/types/guide';
import type { ProductRow } from '@/types/product';

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

function devTrendBody(o: {
  what: string[];
  why: string[];
  forWho: { role: string; why: string }[];
  keyPoints: string[];
  deepDive?: string[];
  soWhat: string[];
  sources?: { label: string; url: string }[];
}): TrendBody {
  const blocks = (arr: string[]) =>
    arr.map((m) => ({ type: 'text' as const, markdown: m }));
  return {
    kind: 'trend',
    what: blocks(o.what),
    why: blocks(o.why),
    forWho: o.forWho,
    keyPoints: o.keyPoints,
    deepDive: o.deepDive ? blocks(o.deepDive) : undefined,
    soWhat: blocks(o.soWhat),
    sources: o.sources,
  };
}

function devCaseBody(o: {
  forWho: string[];
  intro: string[];
  painPoints: { num: string; title: string; symptom: string; rootCause: string }[];
  steps: {
    num: number;
    label: string;
    description: string;
    human: string;
    ai: string;
    prompt: string;
    goodResult?: string;
    badResult?: string;
  }[];
  pros: string[];
  cons: string[];
  takingPoints: { title: string; description: string; action: string }[];
}): CaseBody {
  const intro = o.intro.map((m) => ({ type: 'text' as const, markdown: m }));
  return {
    kind: 'case',
    forWho: o.forWho,
    caseIntro: intro,
    painPoints: o.painPoints,
    stepCards: o.steps,
    pros: o.pros,
    cons: o.cons,
    takingPoints: o.takingPoints,
    // legacy 필수 필드(타입 호환). 신규 레이아웃은 forWho/stepCards로 렌더되어 미사용.
    essence: intro,
    framework: [
      { name: o.steps[0]?.label ?? 'Step 1', description: '', intent: '', blocks: intro },
    ],
    failures: [{ type: 'text', markdown: o.cons[0] ?? '' }],
    review: [{ type: 'text', markdown: o.pros[0] ?? '' }],
    customization: ['시점', '톤', '범위', '깊이'],
  };
}

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
    body: devCaseBody({
      forWho: [
        '"경쟁사 분석해줘" 한 줄 넣고 표만 잔뜩 받아본 분',
        '경쟁사 리포트가 늘 "기능 나열"에서 끝나 윗선에서 막히는 분',
        '시간은 반나절 썼는데 정작 "그래서 우리는?"이 안 나오는 분',
      ],
      intro: [
        '경쟁사 분석이 얕게 끝나는 건 AI가 부족해서가 아닙니다. "5곳 분석해줘"처럼 **범위가 넓고 의도가 없는 지시**를 받으면, AI는 누구나 아는 표면 정보(기능·가격)를 안전하게 나열할 수밖에 없어요.',
        '이 케이스는 사람이 먼저 **질문을 좁히고**, AI에게는 좁혀진 한 축씩만 깊게 파게 하는 4단계를 다룹니다.',
      ],
      painPoints: [
        { num: '01', title: '"경쟁사 5곳 분석" 한 줄', symptom: '기능·가격 표만 잔뜩. 다 아는 내용.', rootCause: '범위가 넓으면 AI는 가장 안전한 공통 정보만 모은다.' },
        { num: '02', title: '소구점이 안 보임', symptom: '"무엇을 파는지"는 있는데 "왜 그게 먹히는지"가 없음.', rootCause: '관찰(무엇)과 해석(왜)을 한 번에 시켜서 둘 다 얕아진다.' },
        { num: '03', title: '"그래서 우리는?"이 없음', symptom: '분석은 했는데 우리 액션으로 안 이어짐.', rootCause: '비교 기준(축)을 사람이 안 정해 AI가 정렬을 못 한다.' },
      ],
      steps: [
        {
          num: 1, label: '축 정하기', description: '무엇으로 비교할지 사람이 먼저 정한다.',
          human: '비교 축 <strong>1개</strong>만 고른다 (예: "온보딩 첫 화면의 소구점").',
          ai: '그 축에 대해서만 경쟁사별로 관찰 사실을 모으게 한다.',
          prompt: `다음 경쟁사들의 [온보딩 첫 화면]만 보고, 각각 "처음 보이는 한 문장 소구점"을 사실 그대로 인용해주세요.\n해석·평가는 하지 말고 인용만.\n\n경쟁사: [목록]`,
          goodResult: '각 사의 첫 화면 카피를 원문 그대로 인용 → 비교 가능한 사실 확보.',
          badResult: '"A사는 사용성을 강조합니다" — 관찰이 아니라 요약(해석).',
        },
        {
          num: 2, label: '해석 분리', description: '관찰이 모인 뒤에야 "왜"를 묻는다.',
          human: 'Step 1의 인용 묶음을 붙이고, <strong>패턴</strong>을 묻는다.',
          ai: '공통점·차이점과 그 이유 가설을 만들게 한다.',
          prompt: `다음은 경쟁사 첫 화면 소구점 인용 모음입니다.\n공통 패턴 2개와 눈에 띄게 다른 1개를 찾고, 각각 "왜 그렇게 했을지" 가설을 한 줄로 달아주세요.\n\n[인용 붙여넣기]`,
        },
      ],
      pros: [
        '축을 1개로 좁히니 AI 결과가 처음으로 "비교 가능"해졌다',
        '관찰과 해석을 끊으니 "왜 먹히는지"가 보였다',
        '인용을 강제하니 환각(없는 기능 지어내기)이 사라졌다',
      ],
      cons: [
        '축을 여러 개 한 번에 넣으면 다시 표면으로 돌아갔다',
        '"평가해줘"를 일찍 넣으면 관찰을 건너뛰고 결론부터 냈다',
        '경쟁사 자료 수집 자체는 여전히 사람 손이 필요했다',
      ],
      takingPoints: [
        { title: '비교 "축"은 사람이 1개만 정해 던진다', description: '범위를 좁힐수록 AI 분석은 깊어진다. 넓히면 평균만 나온다.', action: '바로 시도 → 다음 분석에 축 1개 룰' },
        { title: '관찰(무엇)과 해석(왜)을 단계로 끊는다', description: '한 번에 시키면 둘 다 얕아진다. 인용을 먼저, 가설은 나중에.', action: '바로 시도 → 인용→해석 2단 분리' },
      ],
    }),
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
    body: devCaseBody({
      forWho: [
        'AI 결과물이 내용은 맞는데 "보고용 톤"이 아니라 다시 쓰는 분',
        '제안서·보고서를 AI로 빨리 쓰는데 윗선 통과가 안 되는 분',
        '"좀 더 정중하게/단정하게"를 시켜도 어색해지기만 하는 분',
      ],
      intro: [
        '내용이 맞는데도 막히는 결과물의 대부분은 **톤 문제**입니다. 그런데 "정중하게 써줘"는 AI에게 너무 모호해서, 오히려 번역투·과장된 존댓말로 어색해지죠.',
        '이 케이스는 톤을 추상어가 아니라 **구체 샘플과 금지어**로 지정해, AI에게 "본인 것으로 만드는" 3단계를 다룹니다.',
      ],
      painPoints: [
        { num: '01', title: '"정중하게 써줘"', symptom: '번역투·과장 존댓말로 어색해짐.', rootCause: '"정중"이 사람마다 달라서 AI가 평균치 존댓말로 도망간다.' },
        { num: '02', title: '회사·거래처 톤을 모름', symptom: '맞는 말인데 "우리 회사 말투"가 아님.', rootCause: '기준 샘플이 없으면 AI는 일반 비즈니스 톤만 흉내 낸다.' },
        { num: '03', title: '질문 대응이 약함', symptom: '윗선 질문에 한 줄도 못 버팀.', rootCause: '결론만 있고 "예상 반론·근거"를 같이 안 만들었다.' },
      ],
      steps: [
        {
          num: 1, label: '톤 샘플 주기', description: '추상어 대신 실제 문장을 기준으로 준다.',
          human: '통과됐던 보고서 <strong>문장 3개</strong>를 붙인다.',
          ai: '그 톤의 특징을 규칙으로 뽑게 한 뒤, 같은 규칙으로 다시 쓰게 한다.',
          prompt: `다음 3문장은 우리 조직에서 "잘 통과된" 보고 톤입니다.\n이 톤의 규칙을 5개로 뽑아주세요(문장 길이, 단정/완곡, 자주 쓰는 연결어 등).\n그 규칙으로 아래 초안을 다시 써주세요.\n\n샘플: [3문장]\n초안: [초안]`,
          goodResult: '"문장은 2줄 이내, 단정형 종결, 수식어 최소" 같은 실행 가능한 규칙.',
          badResult: '"정중하고 전문적인 톤" — 다시 추상어로 회귀.',
        },
        {
          num: 2, label: '금지어 지정', description: '하지 말 것을 명시하면 톤이 안정된다.',
          human: '어색했던 표현 <strong>금지 목록</strong>을 만든다.',
          ai: '금지어를 피해 같은 내용을 다시 쓰게 한다.',
          prompt: `아래 표현은 우리 톤에서 금지입니다: [금지 목록].\n금지어를 쓰지 말고, 같은 뜻을 우리 톤으로 다시 써주세요.\n\n[문장]`,
        },
        {
          num: 3, label: '반론 같이 만들기', description: '윗선 질문을 미리 받아 둔다.',
          human: '핵심 주장 <strong>1개</strong>를 고른다.',
          ai: '예상 반론 3개와 한 줄 대응을 같이 만들게 한다.',
          prompt: `다음 주장에 대해 윗선이 던질 가장 날카로운 질문 3개와, 각 질문에 대한 한 줄 대응을 만들어주세요.\n\n주장: [주장]`,
        },
      ],
      pros: [
        '추상어 대신 "통과된 문장 3개"를 주니 톤이 한 번에 맞았다',
        '금지어 목록이 어색한 번역투를 가장 효과적으로 막았다',
        '예상 반론을 같이 만드니 보고 자리에서 안 흔들렸다',
      ],
      cons: [
        '샘플 없이 "우리 회사 톤"만 말하면 결과가 들쭉날쭉했다',
        '금지어가 너무 많으면 문장이 딱딱하게 굳었다',
        '톤 규칙은 매체(메일/구두보고)마다 다시 잡아야 했다',
      ],
      takingPoints: [
        { title: '톤은 추상어가 아니라 "샘플 3문장"으로 지정한다', description: '"정중하게"보다 통과된 문장을 보여주는 게 10배 정확하다.', action: '바로 시도 → 통과 문장 3개 모아두기' },
        { title: '하지 말 것(금지어)을 같이 준다', description: '할 것보다 안 할 것을 정하면 톤이 안정된다.', action: '바로 시도 → 금지어 목록 만들기' },
      ],
    }),
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
    body: devCaseBody({
      forWho: [
        '인터뷰·상담 녹취를 AI로 정리하는데 늘 비슷한 요약만 나오는 분',
        '"인사이트"를 뽑고 싶은데 결국 "고객이 이렇게 말했다" 나열로 끝나는 분',
        '1인 사업·프리랜서로 리서치를 혼자 다 해야 하는 분',
      ],
      intro: [
        '녹취를 통째로 던지면 AI는 가장 자주 나온 말을 평균 내서 "무난한 요약"을 만듭니다. 진짜 인사이트는 자주 나온 말이 아니라 **예외적인 한마디**에 있는데도요.',
        '이 케이스는 정리 전에 사람이 **"사실/감정"과 "다수/예외"를 분리**해 두고, AI에게는 각 묶음을 따로 다루게 하는 방법을 다룹니다.',
      ],
      painPoints: [
        { num: '01', title: '녹취 통째로 던지기', symptom: '어느 인터뷰든 비슷한 요약이 나옴.', rootCause: 'AI는 빈도 높은 발언을 평균 내 "안전한 결론"을 만든다.' },
        { num: '02', title: '사실과 감정이 섞임', symptom: '"불편하다"는 감정과 "버튼이 작다"는 사실이 한 덩어리.', rootCause: '분리 기준 없이 요약하면 행동 가능한 사실이 묻힌다.' },
        { num: '03', title: '예외가 버려짐', symptom: '한 명이 던진 결정적 한마디가 "소수 의견"으로 잘림.', rootCause: '"다수/예외"를 안 나눠 AI가 다수만 본다.' },
      ],
      steps: [
        {
          num: 1, label: '사실/감정 분리', description: '요약 전에 두 줄로 나눈다.',
          human: '녹취를 붙이기 전, "관찰 가능한 사실"과 "감정·평가"를 <strong>다른 색</strong>으로 표시하는 규칙을 만든다.',
          ai: '두 종류를 별도 목록으로 분리하게 한다.',
          prompt: `다음 인터뷰에서 발언을 두 목록으로 분리해주세요.\nA) 관찰 가능한 사실(행동·상황) B) 감정·평가\n각 항목은 원문 인용 + 화자 표시.\n\n[녹취 붙여넣기]`,
          goodResult: 'A "결제 화면에서 3번 뒤로 갔다" / B "복잡해서 짜증났다" — 분리됨.',
          badResult: '"사용자들이 결제를 불편해함" — 사실과 감정이 다시 합쳐짐.',
        },
        {
          num: 2, label: '예외 건지기', description: '다수 말고 "한 명"을 본다.',
          human: '분리된 사실 목록에서 <strong>딱 한 번 나온 발언</strong>에 표시한다.',
          ai: '그 예외가 왜 나왔을지, 다수 패턴과 어떻게 다른지 가설을 만들게 한다.',
          prompt: `다음 사실 목록에서, 1회만 등장한 발언 3개를 골라주세요.\n각각 "왜 이 사람만 이렇게 말했을지" 가설을 한 줄로 달아주세요. 다수 의견으로 묻지 마세요.\n\n[사실 목록]`,
        },
      ],
      pros: [
        '사실/감정을 먼저 나누니 "바로 고칠 것"이 또렷해졌다',
        '예외를 일부러 건지니 가장 중요한 인사이트가 거기 있었다',
        '인용을 강제하니 "내가 듣고 싶은 대로" 요약되는 일이 줄었다',
      ],
      cons: [
        '녹취가 너무 길면 한 번에 못 넣어 회차로 쪼개야 했다',
        '"인사이트 뽑아줘"를 먼저 시키면 다시 평균 요약으로 갔다',
        '화자 구분이 안 된 녹취는 분리 정확도가 떨어졌다',
      ],
      takingPoints: [
        { title: '요약 전에 "사실/감정"을 먼저 분리한다', description: '섞인 채 요약하면 행동 가능한 사실이 감정에 묻힌다.', action: '바로 시도 → 분리 프롬프트 1개 저장' },
        { title: '다수가 아니라 "예외 한 명"을 본다', description: '진짜 인사이트는 빈도 높은 말이 아니라 예외에 있다.', action: '바로 시도 → 1회 발언 건지기' },
      ],
    }),
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
    body: devCaseBody({
      forWho: [
        'AI에게 내 아이디어를 검증받으려는데 칭찬만 돌아오는 분',
        '"이 가설 어때?"에 AI가 늘 "좋은 접근입니다"로 시작하는 게 불편한 분',
        '결정 전에 내 생각의 약점을 빨리 찾고 싶은 기획·마케터',
      ],
      intro: [
        'AI는 기본적으로 사용자에게 동조하도록 맞춰져 있어, "이 가설 어때?"라고 물으면 반박보다 **정당화**를 돌려줍니다. 검증 도구로 쓰려면 역할을 명시적으로 뒤집어야 해요.',
        '이 케이스는 AI를 "내 편"이 아니라 **반대 심문관**으로 세우는 4가지 지시법(약점 찾기·반대 입장·역사적 실패·숨은 가정)을 다룹니다.',
      ],
      painPoints: [
        { num: '01', title: '"이 가설 어때?"', symptom: '"좋은 접근입니다"로 시작하는 정당화.', rootCause: 'AI는 동조 편향이 강해 묻는 방식대로 편을 든다.' },
        { num: '02', title: '약점이 안 보임', symptom: '장점 5개·단점 1개 식의 형식적 균형.', rootCause: '"균형 있게"는 진짜 약점을 희석한다.' },
        { num: '03', title: '한 관점에 갇힘', symptom: '내 프레임 안에서만 검토됨.', rootCause: '다른 입장·과거 사례를 강제하지 않으면 시야가 안 넓어진다.' },
      ],
      steps: [
        {
          num: 1, label: '약점 찾기', description: '장점은 빼고 약점만 시킨다.',
          human: '검증할 주장 <strong>1개</strong>를 정한다.',
          ai: '장점 언급 없이 약점·구멍만 찾게 한다.',
          prompt: `다음 주장에서 사실과 다를 수 있는 부분, 논리적 약점, 빠진 관점 3개를 찾아주세요.\n장점은 언급하지 마세요. 가장 치명적인 순서로.\n\n주장: [주장]`,
          goodResult: '"이 데이터는 성수기에만 측정됨 → 비수기엔 반대일 수 있음"처럼 구체적 구멍.',
          badResult: '"전반적으로 타당하나 일부 보완이 필요" — 형식적 균형.',
        },
        {
          num: 2, label: '반대 입장', description: '가장 강한 반대자가 되게 한다.',
          human: '누가 반대할지 <strong>구체 인물상</strong>을 정한다(예: 보수적 재무팀장).',
          ai: '그 사람 입장에서 가장 강한 반대 논리 3개를 만들게 한다.',
          prompt: `당신은 [보수적 재무팀장]입니다. 다음 제안에 반대하는 가장 강한 논리 3개를 만들어주세요.\n각 논리가 사실이라면 어떤 데이터로 입증되는지 한 줄로.\n\n제안: [제안]`,
        },
        {
          num: 3, label: '역사적 실패', description: '비슷하게 망한 사례를 찾는다.',
          human: '주장의 <strong>핵심 베팅</strong>을 한 줄로 요약한다.',
          ai: '비슷한 베팅으로 실패한 사례와 그 원인을 들게 한다.',
          prompt: `다음과 비슷한 베팅(같은 가정에 돈/시간을 건)으로 실패한 실제·유사 사례 3개와, 각 실패의 직접 원인을 한 줄로 들어주세요.\n\n핵심 베팅: [요약]`,
        },
        {
          num: 4, label: '숨은 가정', description: '말 안 한 전제를 드러낸다.',
          human: '주장 전체를 붙인다.',
          ai: '"이게 참이어야만 성립하는" 숨은 가정 5개를 의문문으로 뽑게 한다.',
          prompt: `다음 주장이 성립하려면 반드시 참이어야 하는 숨은 가정 5개를 의문문 형태로 뽑아주세요.\n각 가정이 거짓이면 무엇이 무너지는지 한 줄로.\n\n주장: [주장]`,
        },
      ],
      pros: [
        '"장점 빼고 약점만"이 형식적 균형을 깨고 진짜 구멍을 드러냈다',
        '구체 인물(재무팀장)을 지정하니 반대 논리가 날카로워졌다',
        '숨은 가정 뽑기가 결정 전 가장 빨리 위험을 보여줬다',
      ],
      cons: [
        '"반박해줘"만 하면 다시 형식적 단점 1~2개로 돌아갔다',
        '인물상이 막연하면("비판적인 사람") 반대도 막연했다',
        '역사적 실패는 사례 정확도를 사람이 한 번 검증해야 했다',
      ],
      takingPoints: [
        { title: 'AI를 "내 편"이 아니라 반대 심문관으로 세운다', description: '묻는 방식이 동조를 부른다. 역할을 명시적으로 뒤집어야 검증이 된다.', action: '바로 시도 → 약점 찾기 프롬프트 저장' },
        { title: '반대자는 "구체 인물"로 지정한다', description: '"비판적으로"보다 "보수적 재무팀장"이 훨씬 날카롭다.', action: '바로 시도 → 반대 페르소나 3개 만들기' },
      ],
    }),
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
    title: 'Claude에 "메모리" 추가— 매번 배경 설명하던 게 사라진다',
    summary:
      '대화 맥락을 기억하는 메모리 기능이 들어왔다. 일하는 사람에게 뭐가 달라지는지, 누가 챙기면 좋은지 정리했다.',
    body: devTrendBody({
      what: [
        'Claude에 이전 대화의 맥락을 기억하는 **메모리 기능**이 추가됐다. 내 직무, 자주 쓰는 형식, 진행 중인 프로젝트를 한 번 알려주면 다음 대화부터 그 맥락 위에서 답한다.',
        '기존 커스텀 인스트럭션과 다른 점은, 사용자가 따로 정리해 넣지 않아도 대화 과정에서 기억할 거리를 알아서 추려 저장한다는 것이다.',
      ],
      why: [
        '그동안 AI를 쓸 때 가장 거슬리던 게 "매번 같은 배경을 다시 설명"하는 일이었다. 메모리는 이 반복을 없애 한 번의 작업이 아니라 "이어서 일하는" 경험에 가까워진다.',
        '개인화가 깊어질수록 결과물의 톤·맥락 일관성이 올라가, 매번 톤을 교정하던 후작업이 줄어든다. 그래서 기능 하나지만 실무 체감이 큰 변화로 읽힌다.',
      ],
      forWho: [
        { role: '기획·마케팅', why: '동시에 굴리는 프로젝트가 많아 매번 맥락을 다시 깔던 사람일수록 효과가 크다.' },
        { role: '1인 사업·프리랜서', why: '클라이언트별 톤·요구를 기억시켜 두면 반복 설명이 사라진다.' },
      ],
      keyPoints: [
        '대화 맥락을 자동으로 기억 → 매번 배경 설명이 필요 없어짐',
        '톤·형식 일관성이 올라가 결과물 후작업이 줄어듦',
        '단, 여러 프로젝트가 섞이면 엉뚱한 과거 맥락을 끌어올 수 있음',
      ],
      deepDive: [
        '메모리는 "무엇을 기억하는지"를 사용자가 확인·수정할 수 있게 돼 있다. 오래된 가정이 답을 오염시키지 않도록, 가끔 기억 목록을 점검하는 습관이 권장된다.',
        '민감한 정보를 기억시키는 건 신중해야 한다. 톤이 다르거나 중요한 작업은 새 대화로 분리하는 편이 안전하다.',
      ],
      soWhat: [
        '**지금 해볼 것** — 자주 하는 반복 작업(회의록 정리·정기 보고)부터 메모리를 켜고 "내 직무·톤"을 한 번 알려둔다.',
        '**주의** — 프로젝트가 여럿이면 중요한 작업은 새 대화로 분리하고, 한 번씩 기억 목록을 점검한다.',
      ],
      sources: [{ label: 'Anthropic — Claude 기능 안내', url: 'https://www.anthropic.com/claude' }],
    }),
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
    title: 'Gemini vs GPT, 지금 어디에 뭘 쓰는 게 맞나',
    summary:
      '두 모델 다 큰 업데이트가 있었다. 승패 가리기 대신, 작업 종류별로 어디에 뭘 쓰면 좋은지 기준을 정리했다.',
    body: devTrendBody({
      what: [
        'Gemini와 GPT 모두 최근 큰 업데이트가 있었다. 성능 경쟁이 치열해지며 "둘 중 뭐가 더 좋냐"는 질문이 늘었지만, 실무에서 중요한 건 **"어떤 작업에 어느 쪽이 맞나"** 다.',
        '대체로 한쪽은 검색·근거에, 다른 쪽은 빠른 생성·대화에 강점이 두드러진다.',
      ],
      why: [
        '구독료를 둘 다 내기는 부담이라 "하나만 고른다면?"을 많이 묻는다. 하지만 작업 성격이 다른데 한 모델만 고집하면 매번 강점을 못 살린다.',
        '모델 선택을 "취향"이 아니라 **"작업별 기준"** 으로 바꾸면, 같은 시간에 결과 품질이 올라간다. 이게 이 비교의 진짜 쓸모다.',
      ],
      forWho: [
        { role: '마케팅·리서치', why: '출처가 필요한 시장 조사·경쟁 분석이 많다면 근거형 모델 비중을 높이는 게 유리하다.' },
        { role: '기획', why: '초안·아이디에이션을 빨리 돌려야 한다면 생성 속도가 좋은 쪽이 손이 덜 간다.' },
      ],
      keyPoints: [
        '출처·사실 확인이 중요한 작업 → 근거형(Gemini 계열)',
        '빠른 초안·브레인스토밍 → 생성형(GPT 계열)',
        '한 모델 고집보다 작업별로 갈라 쓰면 전체 품질이 올라감',
      ],
      deepDive: [
        '모델은 빠르게 바뀌므로 "이 모델이 항상 우위"라는 결론은 위험하다. 본인 주력 작업 2~3개로 한 번씩 비교해보고 기준을 갱신하는 게 현실적이다.',
        '무료 플랜으로도 대부분의 일상 작업은 비교가 가능하다. 둘 다 유료 구독할지는 본인 작업 비중을 보고 정할 일.',
      ],
      soWhat: [
        '**지금 해볼 것** — 가장 자주 하는 작업 2개를 골라 양쪽에 같은 프롬프트를 넣고, "후작업이 얼마나 필요한가"로만 비교한다.',
        '**기준 한 줄** — 출처 필요 → 근거형, 빠른 초안 → 생성형. 이걸 본인 기준으로 정해두면 매번 고민이 사라진다.',
      ],
      sources: [
        { label: 'OpenAI', url: 'https://openai.com' },
        { label: 'Google AI for Developers', url: 'https://ai.google.dev' },
      ],
    }),
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
    title: 'MCP, 비개발자에게도 의미 있는 표준이 됐다',
    summary:
      'AI 앱을 내 노션·드라이브 같은 도구와 잇는 MCP 표준이 빠르게 확산 중. 과장 빼고 뭐가 달라지는지 정리했다.',
    body: devTrendBody({
      what: [
        'AI 앱과 외부 도구를 잇는 **MCP(Model Context Protocol)** 표준이 Claude·ChatGPT·Cursor 등 주요 클라이언트에 빠르게 확산됐다. 쉽게 말해 "AI가 내 노션·구글드라이브·캘린더를 직접 읽고 쓰게 연결하는 공통 규격"이다.',
        '핵심은 한 번 만든 연결을 여러 AI 앱에서 재사용한다는 점. USB-C처럼 한 번 꽂으면 어디서든 통한다.',
      ],
      why: [
        '그동안 AI에 내 자료를 쓰게 하려면 매번 복붙하거나 앱마다 따로 연동해야 했다. MCP는 이 "연결 노동"을 표준화해 한 번으로 끝낸다.',
        '주요 AI 클라이언트가 모두 채택하면서, 이제 "내 도구를 AI에 붙이는 방식"의 사실상 표준이 됐다. 당장 안 써도 흐름은 알아둘 가치가 있는 이유다.',
      ],
      forWho: [
        { role: '기획·운영', why: '노션·드라이브에 흩어진 자료를 AI가 직접 참고하게 하면 검색→정리 동선이 짧아진다.' },
        { role: '1인 사업', why: '클라이언트 자료를 매번 복붙하던 일을 줄일 수 있다.' },
      ],
      keyPoints: [
        'AI가 내 도구(노션·드라이브 등)를 직접 읽고 쓰게 잇는 공통 표준',
        '한 번 연결하면 여러 AI 앱에서 재사용 가능',
        '단, 초기 설정과 접근 권한·보안은 한 번 점검 필요',
      ],
      deepDive: [
        'MCP 자체는 기술 규격이지만, 비개발자도 쓸 수 있는 "MCP 앱"이 늘면서 설정 장벽이 낮아지는 중이다.',
        '도구에 어디까지 접근을 허용했는지는 한 번 점검하는 게 안전하다. 넓게 열어두면 의도치 않은 데이터 노출 위험이 있다.',
      ],
      soWhat: [
        '**지금 해볼 것** — 당장 깊이 안 들어가도 된다. "AI에 내 도구를 붙이는 표준이 자리 잡았다"는 흐름만 알아두고, 자주 쓰는 도구에 공식 연동이 생기면 그때 붙여본다.',
        '**주의** — 연결할 때 접근 권한 범위를 꼭 확인한다.',
      ],
      sources: [{ label: 'Model Context Protocol 공식', url: 'https://modelcontextprotocol.io' }],
    }),
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
    url: 'https://snipit.io',
    body: {
      audience: '마케터·기획자',
      tags: ['한국어 지원'],
      about: {
        heading: '경쟁사가 어떤 소구점으로 모으는지 한눈에',
        paragraphs: [
          '막연한 키워드 한 줄만 던져도 AI가 그에 맞는 메타(Facebook·Instagram) 광고와 레퍼런스 이미지를 한 보드로 정리해줍니다. 핀터레스트에서 길 잃거나, 흩어진 캡처 폴더를 다시 뒤지는 시간이 사라집니다.',
          '전통적으로 마케터·기획자가 반나절씩 쓰던 "경쟁사 톤·소구점 파악" 작업을 30분 안에 끝낼 수 있게 설계된 도구예요. 광고뿐 아니라 자료 아카이빙·경쟁사 모니터링까지 한 곳에서 처리됩니다.',
        ],
      },
      whenToUse: [
        { icon: '🎯', title: '새 캠페인 톤·소구점 잡기 전', desc: '"20대 여성, 가을, 향수" 같은 한 줄로 경쟁사 광고 30개를 한 번에 비교.' },
        { icon: '📡', title: '경쟁사 광고 변화 모니터링', desc: '특정 브랜드를 등록해두면 새 광고가 뜰 때마다 자동으로 보드에 적립.' },
        { icon: '🖼️', title: '비주얼 레퍼런스 빠르게 모으기', desc: '핀터레스트 탭 7개 띄우는 대신, 한 줄 검색으로 동일 톤 이미지 큐레이션.' },
        { icon: '📥', title: '팀 자료 아카이빙', desc: '캠페인별 보드로 정리해두면 다음 프로젝트에서 검색·재활용이 쉬워짐.' },
      ],
      features: [
        {
          title: 'AI 레퍼런스 검색',
          desc: '막연한 키워드 한 줄에도 의도에 맞는 광고·이미지를 찾아 묶어줍니다.',
          image: {
            url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80',
            caption: '키워드 한 줄로 모인 레퍼런스 보드 (예시 화면 — 실제 스크린샷으로 교체)',
          },
        },
        { title: '메타 광고 자동 추적', desc: '경쟁사가 Facebook·Instagram에 새로 올린 광고를 자동으로 캐치해 알림.' },
        {
          title: '한 보드 정렬·비교',
          desc: '카피·CTA·비주얼 톤을 격자로 한 번에 비교. 흩어진 캡처가 한 화면에 모임.',
          image: {
            url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&q=80',
            caption: '카피·비주얼을 격자로 비교 (예시 화면 — 실제 스크린샷으로 교체)',
          },
        },
        { title: '캠페인별 아카이브', desc: '프로젝트 단위로 보드를 분리해 저장. 팀원과 공유 링크로 즉시 공유.' },
        { title: '한국어 인터페이스', desc: '검색 쿼리부터 보드 라벨까지 한국어 그대로. 영문 SaaS의 진입 장벽이 없음.' },
      ],
      pricing: [
        { name: 'Free', amount: '무료 · 2일 무료 체험', includes: '기본 레퍼런스 검색 + 보드 1개. 도구가 어떤 식인지 감 잡는 용도로 충분.' },
        { name: 'Pro', amount: '유료 · 공식 사이트에서 확인', includes: '광고 자동 추적, 무제한 보드, 팀 공유. 실제 캠페인에 쓰려면 Pro가 필요합니다.' },
      ],
      pricingNote: '* 정확한 요금은 변동될 수 있으니 공식 사이트에서 확인해주세요.',
      useCases: [
        {
          href: '/cases/competitor-analysis',
          tag: '실전 케이스 · 마케팅',
          title: '경쟁사 분석 3시간 → 30분, 도구 3개 묶음 케이스',
          meta: '읽는데 6분 · Snipit · Proby · ScreenFlow',
        },
      ],
    },
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
    url: 'https://proby.ai',
    body: {
      audience: 'UX 리서처·기획자',
      tags: ['다국어 지원'],
      about: {
        heading: 'AI가 꼬리질문까지 던지는 심층 인터뷰',
        paragraphs: [
          '설문은 답이 얕고, 인터뷰는 시간이 많이 듭니다. Proby는 AI가 사용자에게 직접 꼬리질문을 던지며 인터뷰를 진행해, 적은 비용으로 깊이 있는 응답을 모읍니다.',
          '다국어 인터뷰도 자동으로 번역·요약하고 페르소나까지 도출해줘요. 리서치 설계부터 정리까지 한 흐름으로 끝납니다.',
        ],
      },
      whenToUse: [
        { icon: '🗣️', title: '사용자 인터뷰를 빠르게 돌릴 때', desc: '모더레이터 없이 AI가 진행. 동시에 여러 명을 인터뷰해 표본을 빠르게 확보.' },
        { icon: '🌐', title: '해외 사용자 리서치', desc: '다국어 인터뷰를 자동 번역·요약. 언어 장벽 없이 인사이트만 받아봄.' },
        { icon: '🧩', title: '페르소나 도출이 필요할 때', desc: '응답을 묶어 페르소나·핵심 니즈를 자동 정리.' },
      ],
      features: [
        { title: 'AI 꼬리질문', desc: '응답에 따라 AI가 더 깊은 후속 질문을 자동 생성.' },
        { title: '자동 번역·요약', desc: '다국어 응답을 번역하고 핵심만 요약.' },
        { title: '페르소나 도출', desc: '인터뷰 결과에서 사용자 유형·니즈를 자동 추출.' },
      ],
      pricing: [
        { name: 'Pro', amount: '유료 · 공식 사이트에서 확인', includes: '인터뷰 진행 + 번역·요약 + 페르소나 도출. 실제 리서치 운영용.' },
      ],
      pricingNote: '* 정확한 요금은 공식 사이트에서 확인해주세요.',
    },
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
    url: 'https://screenflow.app',
    body: {
      audience: '프로덕트 디자이너·기획자',
      about: {
        heading: 'URL 한 줄로 웹사이트 전체 플로우 캡처',
        paragraphs: [
          'URL 하나만 넣으면 사이트의 화면 흐름을 자동으로 따라가며 전체 플로우를 캡처합니다. 가입·결제 같은 플로우를 손으로 일일이 찍던 작업이 사라져요.',
          '캡처한 화면은 피그마로 바로 복사할 수 있어, 화면 설계와 레퍼런스 정리가 훨씬 빨라집니다.',
        ],
      },
      whenToUse: [
        { icon: '🧭', title: '경쟁 서비스 플로우 분석', desc: 'URL만 넣으면 가입~결제 전체 화면 흐름을 자동 캡처.' },
        { icon: '🎨', title: '화면 설계 레퍼런스 수집', desc: '캡처를 피그마로 바로 복사해 와이어프레임 출발점으로.' },
      ],
      features: [
        { title: '자동 플로우 캡처', desc: 'URL 입력 한 번으로 전체 화면 흐름을 따라가며 수집.' },
        { title: '피그마 복사', desc: '캡처 화면을 피그마로 바로 붙여넣기.' },
        { title: '플로우 정리', desc: '화면을 순서대로 정렬해 흐름을 한눈에.' },
      ],
      pricing: [
        { name: 'Pro', amount: '유료 · 공식 사이트에서 확인', includes: '무제한 플로우 캡처 + 피그마 연동. 실무 설계용.' },
      ],
      pricingNote: '* 정확한 요금은 공식 사이트에서 확인해주세요.',
    },
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
    url: 'https://v0.dev',
    body: {
      audience: '디자이너·프론트엔드·기획자',
      about: {
        heading: '프롬프트로 UI 컴포넌트를 바로 만든다',
        paragraphs: [
          '만들고 싶은 화면을 한 문장으로 설명하면 v0가 실제로 동작하는 UI 컴포넌트를 생성해줍니다. Vercel이 만든 도구라 결과물 품질이 안정적이에요.',
          '와이어프레임 단계에서 빠르게 시안을 뽑거나, 코드까지 받아 바로 붙일 때 특히 유용합니다.',
        ],
      },
      whenToUse: [
        { icon: '🧱', title: '와이어프레임 빠르게', desc: '한 문장으로 화면 시안을 생성해 아이디어를 즉시 눈으로 확인.' },
        { icon: '🔁', title: '컴포넌트 반복 수정', desc: '"버튼 더 크게, 색은 파랑" 식으로 대화하며 다듬기.' },
      ],
      features: [
        { title: '프롬프트 → UI', desc: '자연어 설명을 동작하는 컴포넌트로 변환.' },
        { title: '코드 추출', desc: '생성된 UI의 React/Tailwind 코드를 바로 복사.' },
        { title: '반복 개선', desc: '대화형으로 디자인을 점진적으로 수정.' },
      ],
      pricing: [
        { name: 'Free', amount: '무료', includes: '기본 생성 크레딧. 감 잡고 가볍게 쓰기 좋음.' },
        { name: 'Pro', amount: '유료 · 공식 사이트에서 확인', includes: '더 많은 생성·기능. 실무 반복 사용용.' },
      ],
      pricingNote: '* 정확한 요금은 공식 사이트에서 확인해주세요.',
    },
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
    url: 'https://www.make.com',
    body: {
      audience: '기획·운영·마케터',
      about: {
        heading: '앱 사이를 코드 없이 잇는 자동화',
        paragraphs: [
          '구글시트에 행이 추가되면 슬랙으로 알림, 폼 응답을 노션에 정리 — 이런 반복 작업을 블록을 연결하듯 자동화합니다. 코드를 몰라도 됩니다.',
          '한 번 만들어두면 사람이 손대지 않아도 계속 돌아가, 운영 잡무를 크게 줄여줍니다.',
        ],
      },
      whenToUse: [
        { icon: '🔁', title: '반복 잡무 자동화', desc: '매번 손으로 옮기던 데이터·알림을 자동으로 연결.' },
        { icon: '🔌', title: '여러 앱 연동', desc: '구글·슬랙·노션 등 흩어진 도구를 한 흐름으로.' },
      ],
      features: [
        { title: '비주얼 워크플로우', desc: '블록을 드래그로 연결해 자동화 시나리오 구성.' },
        { title: '1000+ 앱 연동', desc: '대부분의 SaaS와 기본 커넥터 제공.' },
        { title: '예약·트리거 실행', desc: '특정 이벤트나 시간에 자동 실행.' },
      ],
      pricing: [
        { name: 'Free', amount: '무료', includes: '월 일정량 작업 실행. 간단한 자동화엔 충분.' },
        { name: 'Pro', amount: '유료 · 공식 사이트에서 확인', includes: '더 많은 실행·고급 기능. 운영 자동화 본격 사용용.' },
      ],
      pricingNote: '* 정확한 요금은 공식 사이트에서 확인해주세요.',
    },
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
    url: 'https://www.perplexity.ai',
    body: {
      audience: '기획·마케터·리서처',
      about: {
        heading: '출처가 달린 AI 검색',
        paragraphs: [
          '질문을 던지면 웹을 검색해 답을 정리하고, 각 문장에 출처 링크를 달아줍니다. "그럴듯한데 사실인지 모를" AI 답변의 한계를 출처로 메워줘요.',
          '사실 확인이 중요한 리서치·시장 조사에서 특히 시간을 아껴줍니다.',
        ],
      },
      whenToUse: [
        { icon: '🔍', title: '빠른 사실 확인', desc: '출처가 달린 답으로 근거까지 한 번에 확인.' },
        { icon: '📚', title: '시장·경쟁 리서치', desc: '흩어진 정보를 검색·요약해 출발점을 빠르게.' },
      ],
      features: [
        { title: '출처 인용', desc: '답변의 각 근거에 원문 링크 제공.' },
        { title: '실시간 검색', desc: '최신 웹 정보를 반영해 답변.' },
        { title: '후속 질문', desc: '대화를 이어가며 점점 깊게 파고들기.' },
      ],
      pricing: [
        { name: 'Free', amount: '무료', includes: '기본 검색·답변. 일상 리서치엔 충분.' },
        { name: 'Pro', amount: '유료 · 공식 사이트에서 확인', includes: '고급 모델·더 많은 검색. 본격 리서치용.' },
      ],
      pricingNote: '* 정확한 요금은 공식 사이트에서 확인해주세요.',
    },
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
    url: 'https://gamma.app',
    body: {
      audience: '기획·마케터·1인사업',
      about: {
        heading: '프롬프트로 발표 자료를 만든다',
        paragraphs: [
          '주제나 개요만 넣으면 Gamma가 슬라이드 구조·문구·디자인을 한 번에 만들어줍니다. PPT 템플릿과 씨름하던 시간이 사라져요.',
          '초안을 빠르게 뽑은 뒤 내용만 다듬으면 되니, 발표 준비 시간을 크게 줄여줍니다.',
        ],
      },
      whenToUse: [
        { icon: '🖥️', title: '발표 자료 초안', desc: '개요만 넣으면 슬라이드 전체를 자동 생성.' },
        { icon: '⏱️', title: '시간이 급할 때', desc: '디자인 고민 없이 정돈된 자료를 빠르게 확보.' },
      ],
      features: [
        { title: '프롬프트 → 슬라이드', desc: '주제를 구조화된 발표 자료로 변환.' },
        { title: '자동 디자인', desc: '테마·레이아웃을 일관되게 적용.' },
        { title: '웹·PDF 공유', desc: '링크 또는 PDF로 바로 공유.' },
      ],
      pricing: [
        { name: 'Free', amount: '무료', includes: '기본 생성 크레딧. 가볍게 만들어보기.' },
        { name: 'Pro', amount: '유료 · 공식 사이트에서 확인', includes: '더 많은 생성·고급 기능. 실무 반복 사용용.' },
      ],
      pricingNote: '* 정확한 요금은 공식 사이트에서 확인해주세요.',
    },
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
    url: 'https://www.deepl.com/write',
    body: {
      audience: '글쓰기·해외 협업',
      about: {
        heading: '영문 톤을 자연스럽게 다듬는 AI 교정',
        paragraphs: [
          '번역기가 "뜻은 맞는데 어색한" 문장을 만든다면, DeepL Write는 원문 의도를 살리며 자연스러운 표현으로 다듬어줍니다. 이메일·보고서의 영문 톤을 원어민처럼.',
          '뉘앙스 선택지를 제안해줘, 격식·친근함 같은 톤을 상황에 맞게 고를 수 있습니다.',
        ],
      },
      whenToUse: [
        { icon: '✉️', title: '영문 이메일·보고서', desc: '초안을 붙여넣으면 자연스러운 표현으로 교정.' },
        { icon: '🎚️', title: '톤 조절이 필요할 때', desc: '격식/친근 등 뉘앙스 대안을 골라 적용.' },
      ],
      features: [
        { title: '문장 교정', desc: '어색한 표현을 자연스럽게 다듬기.' },
        { title: '뉘앙스 제안', desc: '같은 뜻의 여러 표현 중 선택.' },
        { title: '실시간 수정', desc: '입력하는 대로 즉시 개선안 표시.' },
      ],
      pricing: [
        { name: 'Free', amount: '무료', includes: '기본 교정. 짧은 글엔 충분.' },
        { name: 'Pro', amount: '유료 · 공식 사이트에서 확인', includes: '더 긴 글·고급 톤 옵션. 업무 문서용.' },
      ],
      pricingNote: '* 정확한 요금은 공식 사이트에서 확인해주세요.',
    },
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
    url: 'https://cursor.com',
    body: {
      audience: '개발자·비개발자',
      about: {
        heading: 'AI가 코드를 같이 짜는 에디터',
        paragraphs: [
          'VS Code와 비슷한 에디터에 AI가 깊게 붙어 있어, 자연어로 요청하면 코드를 생성·수정해줍니다. 코드를 잘 몰라도 간단한 자동화 스크립트를 만들 수 있어요.',
          '프로젝트 맥락을 이해한 채로 제안하기 때문에, 반복 작업이나 막힌 부분을 빠르게 풀어줍니다.',
        ],
      },
      whenToUse: [
        { icon: '🤖', title: '간단한 자동화 스크립트', desc: '비개발자도 자연어로 요청해 스크립트 초안을 받기.' },
        { icon: '🧑‍💻', title: '반복 코딩 작업', desc: '맥락을 이해한 AI가 수정·리팩터링을 제안.' },
      ],
      features: [
        { title: '자연어 코드 생성', desc: '요청을 코드로 변환·수정.' },
        { title: '프로젝트 맥락 이해', desc: '코드베이스를 참고해 정확한 제안.' },
        { title: 'Tab 자동완성', desc: '다음 편집을 예측해 빠르게 작성.' },
      ],
      pricing: [
        { name: 'Free', amount: '무료', includes: '기본 사용. 가볍게 체험하기.' },
        { name: 'Pro', amount: 'Pro $20/월', includes: '더 많은 AI 요청·고급 모델. 본격 사용용.' },
      ],
      pricingNote: '* 정확한 요금은 공식 사이트에서 확인해주세요.',
    },
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

// ─────────────────────────────────────────────
// Products / ebook (mockup ebook-detail.html 정합)
// ─────────────────────────────────────────────
export const productSeed: ProductRow[] = [
  {
    id: 'seed-ebook-1',
    slug: 'ai-1week-notes',
    title: 'AI, 다들 쓰는데 나만 못 쓰는 것 같다면 — 1주 실험 노트',
    description:
      '기획·마케팅·영업 직무에서 1주 동안 직접 써본 AI 워크플로우 12개. 잘된 것도, 별로였던 것도 솔직하게 담았습니다.',
    price: 0,
    thumbnail_url: null,
    body: {
      subtitle: '1주 실험 노트 — 기획·마케팅·영업에서 직접 써본 AI 워크플로우 12개',
      rating: 4.8,
      reviewCount: 127,
      format: 'PDF + 전자책 뷰어',
      volume: '45분 분량 (약 80페이지)',
      jobs: '기획 · 마케팅 · 영업',
      updated: '2026년 5월',
      intro: [
        'AI 강의에 돈을 써도 일에 옮기지 못하는 데는 이유가 있습니다. 기획·마케팅·영업에서 1주 동안 직접 AI를 써본 기록입니다. 잘된 것도, 별로였던 것도 솔직하게 담았습니다. 프롬프트를 복사해서 바로 쓸 수 있고, 각 단계에서 "이러면 잘된 것, 이러면 별로인 것" 기준도 함께 제공합니다.',
        'AI를 켜기 전, 사람이 먼저 한 문단을 적는 이유부터 시작합니다. 기획서 첫 페이지가 안 풀릴 때, 경쟁사 분석이 표면만 긁고 끝날 때, 윗사람한테 가져가면 막힐 때 — 12개 워크플로우가 각 상황을 어떻게 푸는지 단계별로 보여줍니다.',
      ],
      stats: [
        { num: '12', label: '워크플로우' },
        { num: '3', label: '직무 커버' },
        { num: '45분', label: '분량' },
      ],
      toc: [
        { title: '빈 입력칸 앞에서 머리가 하얘질 때', desc: 'AI를 켜기 전에 종이에 한 문단을 먼저 쓰는 이유. Step-0 framework.' },
        { title: "기획서 — '의도' 던지는 5단계", desc: '문제정의 → 가설 → 검증방법 → 실행안 → 측정. 각 단계에서 AI에게 시킬 것.' },
        { title: '경쟁사 분석 — AI가 표면만 긁는 이유', desc: '"경쟁사 5곳 분석해줘"가 실패하는 구조와, 깊이를 만드는 4단계.' },
        { title: '영업 보고서 — 윗사람 톤에 맞추기', desc: 'AI 결과물을 "본인 것으로 만드는 4단계". 거래처·회사 톤·질문 대응.' },
        { title: '고객 인터뷰 정리 — 시킬 것과 시키지 말 것', desc: '녹취 20시간을 AI에 통째로 던지면 다 비슷해지는 이유와 분리 기준.' },
        { title: 'AI가 정당화만 할 때 — 반박시키는 4가지 지시법', desc: '약점 찾기, 반대 입장, 역사적 실패, 숨은 가정. 가설 검증에 AI를 제대로 쓰는 법.' },
        { title: '프롬프트 모음 — 복사해서 바로 쓰기', desc: '본문에 나온 프롬프트 전체를 직무별로 정리. 상황 설명 + 프롬프트 + 예상 결과.' },
      ],
      whoFor: [
        { icon: '📝', title: '기획자', desc: '기획서 앞에서 막히는데, AI에 뭘 시켜야 할지 모르겠는 분' },
        { icon: '📊', title: '마케터', desc: '경쟁사 분석, 캠페인 콘셉트에 AI를 쓰고 싶은데 결과가 늘 얕은 분' },
        { icon: '🤝', title: '영업', desc: '제안서·보고서를 AI로 빠르게 쓰고 싶은데 윗사람 통과가 안 되는 분' },
        { icon: '💡', title: '1인사업', desc: '클라이언트 제안서·인터뷰 정리에 AI를 쓰고 싶은데 매번 새로 시작하는 분' },
      ],
      reviews: [
        { author: '김OO · 기획', rating: 5, text: '"의도 던지는 5단계"가 특히 좋았어요. AI 결과가 처음으로 윗사람한테 통과됐습니다.' },
        { author: '이OO · 마케팅', rating: 5, text: '경쟁사 분석 파트 보고 바로 따라했더니 3시간 걸리던 게 30분으로 줄었어요.' },
        { author: '박OO · 영업', rating: 4, text: '프롬프트 모음만으로도 값어치를 합니다. 복붙해서 바로 쓰는 중.' },
      ],
    },
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
