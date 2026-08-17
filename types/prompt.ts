/**
 * Prompt types — mockup prompts.html 정합 (2026-06-07)
 * 데이터는 tools(category='prompt')의 body jsonb에 저장.
 */

import type { RichSection } from '@/types/content';

// 순서 = /prompts 필터 탭 순서(작업 흐름 순).
// admin lib/prompt-body.ts(발행 게이트·AI 초안)와 값이 반드시 같아야 한다 —
// admin이 여기 없는 키로 발행하면 mapPromptRow가 'think'로 폴백해 잘못 묶인다.
export const PROMPT_CATEGORIES = ['think', 'organize', 'make', 'verify', 'refine'] as const;
export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

export const PROMPT_CATEGORY_LABELS: Record<PromptCategory, string> = {
  think: '사고하기',
  organize: '정리하기',
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
  /** 리스트 카드·히어로 썸네일 (tools.thumbnail_url). 없으면 브랜드 플레이스홀더 폴백 */
  thumbnailUrl?: string | null;
  /** 썸네일 없을 때 모바일 피드 카드의 이모지 타일 (tools.thumbnail_emoji) */
  thumbnailEmoji?: string | null;
  /** 등록일 ISO (tools.created_at) — 모바일 피드 카드 날짜 표기용 */
  createdAt?: string | null;
  /** 복사 대상 프롬프트 본문 (body.prompt) */
  prompt: string;
  /** 사고하기/만들기/검증하기/다듬기 (body.promptCategory) */
  category: PromptCategory;
  /** 출처 라벨 (예: "Anthropic 공식", "Karpathy") */
  source?: string;
  /** 출처 외부 링크 (있으면 칩 클릭 시 새 탭) */
  sourceUrl?: string;
  /** 참고 이미지 (body.images) — 상세에서 프롬프트 본문 아래 노출. 2장 이상이면 갤러리 */
  images?: { url: string; caption?: string }[];
  /** 자유 리치 섹션 (body.sections) — 상세 하단에 이미지·링크·갤러리 등 자유 배치 */
  sections?: RichSection[];
  /**
   * 에디터 PICK 상단노출 순서 (tools.pick_order).
   * null = 일반(최신순 누적), 숫자 = PICK 밴드에 노출되며 작을수록 앞.
   */
  pickOrder?: number | null;
}
