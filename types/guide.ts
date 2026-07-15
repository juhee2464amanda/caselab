/**
 * Guide types — mockup guides.html 정합 (2026-06-07)
 * 데이터는 tools(category in ['guide','context-card'])의 body jsonb + url 컬럼.
 */

import type { RichSection } from '@/types/content';

export const GUIDE_CATEGORIES = [
  'prompt',
  'cases',
  'education',
  'skills',
  'agents',
] as const;
export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

/** 필터 탭에 쓰는 짧은 라벨 */
export const GUIDE_TAB_LABELS: Record<GuideCategory, string> = {
  prompt: '프롬프트 작성법',
  cases: '활용 사례',
  education: '교육 · 튜토리얼',
  skills: 'Skills · Cookbook',
  agents: '에이전트 · 자동화',
};

/** 섹션 헤더 제목 + 설명 */
export const GUIDE_SECTIONS: Record<
  GuideCategory,
  { title: string; desc: string }
> = {
  prompt: {
    title: '프롬프트 작성법',
    desc: 'Anthropic·OpenAI·Google이 직접 쓴 프롬프트 엔지니어링 공식 가이드. 어떤 모델을 쓰든 기본기는 여기서.',
  },
  cases: {
    title: '활용 사례 (Best Cases)',
    desc: '공식이 직접 큐레이션한 실제 도입·적용 사례. 어떤 회사가 AI로 무엇을 어떻게 풀고 있는지 본 다음 우리 일에 옮길 부분을 찾기 좋습니다.',
  },
  education: {
    title: '교육 · 튜토리얼',
    desc: '처음부터 차근차근 따라하며 익히는 무료 코스 모음. 영어이지만 실습이 많아 자막·번역과 함께 보면 됩니다.',
  },
  skills: {
    title: 'Skills · Cookbook',
    desc: '바로 복사해서 쓸 수 있는 검증된 자산 모음. 공식 cookbook과 업계가 가장 많이 별표한 GitHub repo들.',
  },
  agents: {
    title: '에이전트 · 자동화',
    desc: 'AI에게 일을 시키는 구조와 환경. 단순 대화를 넘어 "에이전트"로 옮겨갈 때 보면 좋은 공식 자료들.',
  },
};

/** 출처 배지 색 변형 */
export type GuideSourceType = 'default' | 'github' | 'course';

export interface GuideItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  category: GuideCategory;
  /** 출처 라벨 (예: "공식 문서", "GitHub · 커뮤니티", "무료 코스") */
  source: string;
  /** 배지 색: default(파랑) | github(검정) | course(초록) */
  sourceType: GuideSourceType;
  /** 썸네일 영역에 표시할 브랜드명 (로고 대체 텍스트) */
  thumbLabel: string;
  /** 썸네일 배경색 (없으면 muted) */
  thumbBg?: string;
  /** 썸네일 글자색 (없으면 ink) */
  thumbColor?: string;
  /** 링크 라벨 (예: "docs.anthropic.com") */
  linkLabel?: string;
  /** 상세 본문 (body.bodyRich) — 마커 리치 텍스트. 있으면 카드가 내부 상세로 링크 */
  bodyRich?: string;
  /** 상세 참고 이미지 (body.images) */
  images?: { url: string; caption?: string }[];
  /** 자유 리치 섹션 (body.sections) — 상세 하단에 이미지·링크·갤러리 등 자유 배치 */
  sections?: RichSection[];
}

/** 내부 상세페이지로 열 만한 본문(리치 텍스트/이미지/추가 섹션)이 있는가 */
export function guideHasDetail(g: Pick<GuideItem, 'bodyRich' | 'images' | 'sections'>): boolean {
  return !!(
    g.bodyRich?.trim() ||
    (g.images && g.images.length > 0) ||
    (g.sections && g.sections.some((s) => s.blocks?.length))
  );
}
