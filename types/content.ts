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
    z.object({
      type: z.literal('failure'),
      title: z.string().min(1),
      blocks: z.array(BlockSchema).min(1),
    }),
  ])
);

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
}

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
