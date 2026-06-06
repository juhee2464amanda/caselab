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
  status: 'draft' | 'published';
  created_at: string;
}
