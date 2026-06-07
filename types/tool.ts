/**
 * Tool types — mockup tools.html 정합 (2026-06-06)
 */

export const TOOL_CATEGORIES = [
  'design',
  'automation',
  'research',
  'writing',
  'presentation',
  'coding',
] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

export const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
  design: '디자인 / UI',
  automation: '자동화',
  research: '리서치',
  writing: '글쓰기',
  presentation: '프레젠테이션',
  coding: '코딩',
};

/** 도구 상세 페이지 본문 (tools.body jsonb) — mockup tool-snipit.html 정합 */
export interface ToolWhenItem {
  icon?: string;
  title: string;
  desc: string;
}
export interface ToolFeature {
  title: string;
  desc: string;
}
export interface ToolPricingPlan {
  name: string;
  amount: string;
  includes: string;
}
export interface ToolBody {
  /** 히어로 카테고리 옆 대상 (예: "마케터·기획자") */
  audience?: string;
  /** 추가 히어로 태그 (예: ["한국어 지원"]) */
  tags?: string[];
  /** 소개 — 섹션 제목 + 문단들 */
  about?: { heading?: string; paragraphs: string[] };
  /** 언제 쓰면 좋은가 — 칩 카드 */
  whenToUse?: ToolWhenItem[];
  /** 주요 기능 — 번호 리스트 */
  features?: ToolFeature[];
  /** 가격 — 플랜 카드 */
  pricing?: ToolPricingPlan[];
  /** 가격 하단 주석 */
  pricingNote?: string;
  /** 실전 사용기 — 연결 케이스 카드 */
  useCases?: ToolUseCase[];
}
export interface ToolUseCase {
  /** 케이스 링크 (예: /cases/competitor-analysis) */
  href: string;
  tag: string;
  title: string;
  meta: string;
}

export interface Tool {
  id: string;
  slug: string;
  name: string;
  category: ToolCategory;
  description: string;
  thumbnail_url: string | null;
  /** thumbnail_url 없을 때 mockup의 placeholder emoji */
  thumbnail_emoji?: string;
  /** 노출 라벨: "무료 플랜", "유료", "Pro $20/월" 등 */
  pricing_label?: string;
  is_paid?: boolean;
  /** 추가 라벨 (예: "Pro $20/월") */
  pro_pricing?: string;
  /** 사용기 콘텐츠 있음 → "사용기 1편" 배지 */
  has_review?: boolean;
  /** 공식 사이트 링크 (상세 페이지) */
  url?: string | null;
  /** 상세 페이지 본문 (tools.body jsonb) */
  body?: ToolBody | null;
  status: 'draft' | 'published';
  created_at: string;
}
