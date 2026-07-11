/**
 * Prompt types — mockup prompts.html 정합 (2026-06-07)
 * 데이터는 tools(category='prompt')의 body jsonb에 저장.
 */

export const PROMPT_CATEGORIES = ['think', 'make', 'verify', 'refine'] as const;
export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

export const PROMPT_CATEGORY_LABELS: Record<PromptCategory, string> = {
  think: '사고하기',
  make: '만들기',
  verify: '검증하기',
  refine: '다듬기',
};

export interface PromptItem {
  id: string;
  slug: string;
  /** 카드 제목 (tools.name) */
  title: string;
  /** 복사 박스 밖에 노출되는 설명 (tools.description) — 복사 대상이 아님 */
  description?: string;
  /** 복사 대상 프롬프트 본문 (body.prompt) */
  prompt: string;
  /** 사고하기/만들기/검증하기/다듬기 (body.promptCategory) */
  category: PromptCategory;
  /** 출처 라벨 (예: "Anthropic 공식", "Karpathy") */
  source?: string;
  /** 출처 외부 링크 (있으면 칩 클릭 시 새 탭) */
  sourceUrl?: string;
  /**
   * 에디터 PICK 상단노출 순서 (tools.pick_order).
   * null = 일반(최신순 누적), 숫자 = PICK 밴드에 노출되며 작을수록 앞.
   */
  pickOrder?: number | null;
}
