/**
 * Tool types — mockup tools.html 정합 (2026-06-06)
 */

import type { Block } from '@/types/content';

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
  /** 선택: 이 기능의 실제 서비스 화면(스크린샷) — 있으면 기능 아래 이미지 영역 표시 */
  image?: { url: string; caption?: string };
}
export interface ToolPricingPlan {
  name: string;
  amount: string;
  includes: string;
}
/**
 * 자유 리치 섹션 — AI 트렌드처럼 각 섹션에 이미지·갤러리·북마크·문단 등
 * 블록을 자유롭게 배치. 고정 섹션(about/features/pricing…) 뒤에 순서대로 렌더.
 */
export interface ToolSection {
  /** 작은 라벨(eyebrow, 예: "더 알아보기"). 없으면 미표시 */
  label?: string;
  /** 섹션 제목(h2). 없으면 미표시 */
  heading?: string;
  /** 리치 블록 — 트렌드 본문과 동일(text·heading·prompt·checklist·image·gallery·bookmark 등) */
  blocks: Block[];
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
  /** 자유 리치 섹션 — 고정 섹션 뒤에 순서대로 렌더 (이미지·링크·갤러리 등) */
  sections?: ToolSection[];
  /** 고정 섹션 소제목·라벨 오버라이드 (키=섹션id, 예: when·when.label). 비면 기본 문구. */
  headings?: Record<string, string>;
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
