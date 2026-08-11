import { z } from 'zod';

export const JOB_TAGS = ['planning', 'marketing', 'sales', 'solo', 'strategy', 'analysis', 'revenue_kpi', 'customer_research'] as const;
export const PERSONAS = ['A', 'B', 'C', 'D', 'E'] as const;

export const JobTagSchema = z.enum(JOB_TAGS);
export const PersonaSchema = z.enum(PERSONAS);

export const TimeMetaSchema = z.object({
  readMin: z.number().int().min(1),
  applyMin: z.number().int().min(1),
});
export const JobTagsSchema = z.array(JobTagSchema).min(1);
export const PersonaCoverageSchema = z.array(PersonaSchema).min(1);

// ───────────────────────────────────────────────────────────
// Block 정의 (discriminated union)
// ───────────────────────────────────────────────────────────
export const TextBlockSchema = z.object({
  type: z.literal('text'),
  markdown: z.string().min(1),
  // 줄간격 — tight(좁게)·normal(보통, 기본)·loose(넓게). 없으면 normal. admin과 동일.
  spacing: z.enum(['tight', 'normal', 'loose']).optional(),
});

// 여백(스페이서) — 영역 사이 빈 공간. sm≈24·md≈48·lg≈80px. 기본 md. admin과 동일.
export const SpacerBlockSchema = z.object({
  type: z.literal('spacer'),
  size: z.enum(['sm', 'md', 'lg']).optional(),
});

// 구분선 — 실선. 굵기 thin/medium(기본)/thick, 색 gray(기본)/black/accent. admin과 동일.
export const DividerBlockSchema = z.object({
  type: z.literal('divider'),
  thickness: z.enum(['thin', 'medium', 'thick']).optional(),
  color: z.enum(['gray', 'black', 'accent']).optional(),
});

// 색상 강조 박스(콜아웃) — 옅은 배경 박스 + 아이콘 + 본문(인라인 마크업). 기본 노랑·💡. admin과 동일.
export const CalloutBlockSchema = z.object({
  type: z.literal('callout'),
  color: z.enum(['yellow', 'blue', 'green', 'red', 'gray']).optional(),
  icon: z.string().optional(),
  markdown: z.string().min(1),
});

export const HeadingBlockSchema = z.object({
  type: z.literal('heading'),
  level: z.union([z.literal(2), z.literal(3)]),
  text: z.string().min(1),
});

export const PromptBlockSchema = z.object({
  type: z.literal('prompt'),
  label: z.string(),
  prompt: z.string().min(1),
});

export const ResultCompareBlockSchema = z.object({
  type: z.literal('result-compare'),
  good: z.string().min(1),
  bad: z.string().min(1),
});

export const RoleCardBlockSchema = z.object({
  type: z.literal('role-card'),
  human: z.string().min(1),
  ai: z.string().min(1),
});

export const IntentBoxBlockSchema = z.object({
  type: z.literal('intent'),
  step: z.number().int().min(1),
  text: z.string().min(1),
});

export const EvaluationBoxBlockSchema = z.object({
  type: z.literal('evaluation'),
  good: z.string().min(1),
  bad: z.string().min(1),
});

export const RebuttalBoxBlockSchema = z.object({
  type: z.literal('rebuttal'),
  hypothesis: z.string().min(1),
  counter: z.string().min(1),
});

export const FrameworkRefBlockSchema = z.object({
  type: z.literal('framework-ref'),
  name: z.string().min(1),
  url: z.string().url().optional(),
});

export const ContextCardBlockSchema = z.object({
  type: z.literal('context-card'),
  title: z.string().min(1),
  fields: z.array(
    z.object({
      label: z.string().min(1),
      value: z.string().min(1),
    })
  ).min(1),
});

export const ChecklistBlockSchema = z.object({
  type: z.literal('checklist'),
  title: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
});

// 이미지 블록 — 운영자가 본문에 직접 삽입(업로드/URL). url은 공개 이미지 주소.
// size: 렌더 폭(small≈320·medium≈480·full=본문폭). 기본 full. admin과 동일.
export const ImageBlockSchema = z.object({
  type: z.literal('image'),
  url: z.string().min(1),
  alt: z.string().optional(),
  caption: z.string().optional(),
  size: z.enum(['small', 'medium', 'full']).optional(),
  align: z.enum(['left', 'center', 'right']).optional(), // small·medium일 때만 의미(full은 무시)
});

// 갤러리(카드뉴스) — 여러 이미지를 좌우로 넘겨 본다. admin types/content.ts와 동일.
export const GalleryBlockSchema = z.object({
  type: z.literal('gallery'),
  images: z.array(z.object({ url: z.string().min(1), caption: z.string().optional() })).min(1),
});

// 북마크 — 링크 카드. title/description/image는 OG 메타 자동. admin과 동일.
export const BookmarkBlockSchema = z.object({
  type: z.literal('bookmark'),
  url: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  favicon: z.string().optional(),
  siteName: z.string().optional(),
});

// FailureSection는 내부에 BlockSchema를 가짐 → lazy 사용
export type Block =
  | z.infer<typeof TextBlockSchema>
  | z.infer<typeof HeadingBlockSchema>
  | z.infer<typeof PromptBlockSchema>
  | z.infer<typeof ResultCompareBlockSchema>
  | z.infer<typeof RoleCardBlockSchema>
  | z.infer<typeof IntentBoxBlockSchema>
  | z.infer<typeof EvaluationBoxBlockSchema>
  | z.infer<typeof RebuttalBoxBlockSchema>
  | z.infer<typeof FrameworkRefBlockSchema>
  | z.infer<typeof ContextCardBlockSchema>
  | z.infer<typeof ChecklistBlockSchema>
  | z.infer<typeof ImageBlockSchema>
  | z.infer<typeof GalleryBlockSchema>
  | z.infer<typeof BookmarkBlockSchema>
  | z.infer<typeof SpacerBlockSchema>
  | z.infer<typeof DividerBlockSchema>
  | z.infer<typeof CalloutBlockSchema>
  | { type: 'failure'; title: string; blocks: Block[] };

export const BlockSchema: z.ZodType<Block> = z.lazy(() =>
  z.discriminatedUnion('type', [
    TextBlockSchema,
    HeadingBlockSchema,
    PromptBlockSchema,
    ResultCompareBlockSchema,
    RoleCardBlockSchema,
    IntentBoxBlockSchema,
    EvaluationBoxBlockSchema,
    RebuttalBoxBlockSchema,
    FrameworkRefBlockSchema,
    ContextCardBlockSchema,
    ChecklistBlockSchema,
    ImageBlockSchema,
    GalleryBlockSchema,
    BookmarkBlockSchema,
    SpacerBlockSchema,
    DividerBlockSchema,
    CalloutBlockSchema,
    z.object({
      type: z.literal('failure'),
      title: z.string().min(1),
      blocks: z.array(BlockSchema).min(1),
    }),
  ])
);

// ───────────────────────────────────────────────────────────
// 자유 리치 섹션 — 트렌드처럼 이미지·갤러리·북마크·문단 등 블록을
// 각 섹션에 자유 배치. 도구·케이스·프롬프트·가이드 상세 공통.
// ───────────────────────────────────────────────────────────
export const RichSectionSchema = z.object({
  label: z.string().optional(),
  heading: z.string().optional(),
  blocks: z.array(BlockSchema),
});
export type RichSection = z.infer<typeof RichSectionSchema>;

// ───────────────────────────────────────────────────────────
// 트랙별 본문 스키마
// ───────────────────────────────────────────────────────────
export const FrameworkStepSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  intent: z.string().min(1),
  blocks: z.array(BlockSchema).min(1),
});

// 신규 (D70, 2026-06-06) — mockup content.html 7섹션 정합용 optional 필드
const PainPointSchema = z.object({
  num: z.string(),
  title: z.string(),
  symptom: z.string(),
  rootCause: z.string(),
});

const FrameworkReferenceSchema = z.object({
  name: z.string(),
  description: z.string(),
  sourceLabel: z.string().optional(),
  sourceTitle: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  sourceThumbnail: z.string().url().optional(),
});

const StepCardSchema = z.object({
  num: z.number().int().min(1),
  label: z.string(),
  description: z.string().optional(),
  human: z.string(),
  ai: z.string(),
  prompt: z.string(),
  goodResult: z.string().optional(),
  badResult: z.string().optional(),
});

const TakingPointSchema = z.object({
  title: z.string(),
  description: z.string(),
  action: z.string().optional(),
});

export const CaseBodySchema = z.object({
  kind: z.literal('case'),

  // 신규 — 모두 optional, 기존 데이터 호환
  forWho: z.array(z.string()).optional(),
  caseIntro: z.array(BlockSchema).optional(),
  painPoints: z.array(PainPointSchema).optional(),
  frameworkReference: FrameworkReferenceSchema.optional(),
  stepCards: z.array(StepCardSchema).optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  takingPoints: z.array(TakingPointSchema).optional(),

  // 자유 리치 섹션 — 고정 7섹션 뒤에 순서대로 렌더 (이미지·링크·갤러리 등)
  sections: z.array(RichSectionSchema).optional(),

  // 고정 섹션 소제목·리드 오버라이드 (키=섹션키, 예: forWho·painPoints.lead). 비면 기본 문구.
  headings: z.record(z.string(), z.string()).optional(),

  // 기존 (legacy 호환 — 4섹션 본문)
  essence: z.array(BlockSchema).min(1),
  framework: z.array(FrameworkStepSchema).min(1),
  failures: z.array(BlockSchema).min(1),
  review: z.array(BlockSchema).min(1),
  customization: z.array(z.string().min(1)).length(4),
});

export type PainPoint = z.infer<typeof PainPointSchema>;
export type FrameworkReference = z.infer<typeof FrameworkReferenceSchema>;
export type StepCard = z.infer<typeof StepCardSchema>;
export type TakingPoint = z.infer<typeof TakingPointSchema>;

/** 트렌드 "누구한테 중요해요" — 직무별 관련도 */
export const TrendForWhoSchema = z.object({
  role: z.string(),
  why: z.string(),
});

/** 트렌드 본문 — AI 소식/화두를 일하는 사람 관점에서 정리.
 *  모든 섹션 optional: 운영자가 기본 7섹션에서 빼거나 추가/수정. 있는 섹션만 렌더. */
export const TrendBodySchema = z.object({
  kind: z.literal('trend'),
  /** 무슨 소식이에요 */
  what: z.array(BlockSchema).optional(),
  /** 왜 지금 화두예요 */
  why: z.array(BlockSchema).optional(),
  /** 누구한테 중요해요 (직무별 관련도) */
  forWho: z.array(TrendForWhoSchema).optional(),
  /** 핵심 3가지 */
  keyPoints: z.array(z.string()).optional(),
  /** 좀 더 들어가면 (선택) */
  deepDive: z.array(BlockSchema).optional(),
  /** 그래서, 내 일엔? */
  soWhat: z.array(BlockSchema).optional(),
  /** 출처·더 보기 */
  sources: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  /** 자유 리치 섹션 — 고정 6섹션 뒤·'출처·더 보기' 앞에 순서대로 렌더 (이미지·링크·갤러리 등) */
  sections: z.array(RichSectionSchema).optional(),
  /** 고정 섹션 소제목 오버라이드 (키=섹션키, 예: what·why). 비면 기본 문구. */
  headings: z.record(z.string(), z.string()).optional(),
});

export const ContentBodySchema = z.discriminatedUnion('kind', [
  CaseBodySchema,
  TrendBodySchema,
]);

export type ContentBody = z.infer<typeof ContentBodySchema>;
export type CaseBody = z.infer<typeof CaseBodySchema>;
export type TrendBody = z.infer<typeof TrendBodySchema>;
export type TrendForWho = z.infer<typeof TrendForWhoSchema>;
export type FrameworkStep = z.infer<typeof FrameworkStepSchema>;
export type JobTag = z.infer<typeof JobTagSchema>;
export type Persona = z.infer<typeof PersonaSchema>;

// ───────────────────────────────────────────────────────────
// Content row (Supabase 매핑)
// ───────────────────────────────────────────────────────────
export interface ContentRow {
  id: string;
  slug: string;
  track: 'case' | 'trend';
  title: string;
  summary: string | null;
  body: ContentBody;
  job_tags: JobTag[];
  persona_coverage: Persona[];
  read_min: number;
  apply_min: number;
  status: 'draft' | 'published' | 'archived';
  curated: boolean;
  thumbnail_url: string | null;
  author_quote: string | null;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  /** 케이스 성격 분류 join (categories via category_id) — 미분류·트렌드는 null */
  category?: { slug: CaseCategory; label: string } | null;
}

// 홈 히어로 캐러셀 아이템 — 콘텐츠(케이스/트렌드) + 도구/프롬프트/가이드 공통 표현.
// admin 큐레이션이 featured_contents에 contents 또는 tools를 배치하면 여기로 정규화된다.
export interface HeroItem {
  slug: string;
  title: string;
  summary: string | null;
  track: 'case' | 'trend' | 'tool' | 'prompt' | 'guide';
  thumbnail_url: string | null;
  read_min: number | null;
  job_tags: JobTag[];
  /** 등록/발행일 (ISO) — 없으면 null */
  date: string | null;
}

// ───────────────────────────────────────────────────────────
// 케이스 성격 분류 — "독자가 가져가는 것" 기준 3종.
// slug/label은 categories(type='content_subcategory', parent_track='case')
// 마이그레이션 1026 seed와 정확히 일치 (tools의 TOOL_CATEGORIES 패턴).
// ───────────────────────────────────────────────────────────
export const CASE_CATEGORIES = ['workflow', 'automation', 'build'] as const;
export type CaseCategory = (typeof CASE_CATEGORIES)[number];
export const CASE_CATEGORY_LABELS: Record<CaseCategory, string> = {
  workflow: '워크플로',
  automation: '자동화',
  build: '제작기',
};

// ───────────────────────────────────────────────────────────
// 직무 한글 라벨
// ───────────────────────────────────────────────────────────
export const JOB_LABELS: Record<JobTag, string> = {
  planning: '기획',
  marketing: '마케팅',
  sales: '영업',
  solo: '1인 사업',
  strategy: '전략',
  analysis: '데이터/분석',
  revenue_kpi: '매출/KPI 관리',
  customer_research: '고객조사',
};

// ─── §5-4 온보딩 4종 추가 (D38) ───
// profiles.interests[], profiles.ai_tools[]에 저장. 영문 슬러그.

export const INTERESTS = [
  'prompt_engineering',
  'data_analysis',
  'workflow_automation',
  'customer_insight',
  'ai_trends',
  'content_strategy',
  'product_planning',
  'ai_ethics',
] as const;
export type Interest = (typeof INTERESTS)[number];

export const INTEREST_LABELS: Record<Interest, string> = {
  prompt_engineering: '프롬프트 엔지니어링',
  data_analysis: '데이터 분석',
  workflow_automation: '워크플로우 자동화',
  customer_insight: '고객 인사이트',
  ai_trends: 'AI 트렌드',
  content_strategy: '콘텐츠 전략',
  product_planning: '제품 기획',
  ai_ethics: 'AI 윤리·보안',
};

export const AI_TOOLS = [
  'chatgpt',
  'claude',
  'gemini',
  'perplexity',
  'notion_ai',
  'cursor',
  'github_copilot',
  'midjourney',
  'other',
] as const;
export type AiTool = (typeof AI_TOOLS)[number];

export const AI_TOOL_LABELS: Record<AiTool, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
  notion_ai: 'Notion AI',
  cursor: 'Cursor',
  github_copilot: 'GitHub Copilot',
  midjourney: 'Midjourney',
  other: '기타',
};

export const PERSONA_LABELS: Record<Persona, string> = {
  A: '기획자',
  B: '전략팀',
  C: '1인 사업',
  D: '영업팀장',
  E: '스타트업 마케터',
};
