/**
 * Product(ebook) types — mockup ebook-detail.html 정합 (2026-06-07)
 * 풍부한 본문은 products.body jsonb (마이그레이션 0009).
 */

export interface EbookStat {
  num: string;
  label: string;
}
export interface EbookTocItem {
  title: string;
  desc: string;
}
export interface EbookWhoItem {
  icon: string;
  title: string;
  desc: string;
}
export interface EbookReview {
  author: string;
  rating: number;
  text: string;
}
export interface EbookBody {
  /** 커버 부제 */
  subtitle?: string;
  /** 평점 (예: 4.8) */
  rating?: number;
  /** 리뷰 수 (예: 127) */
  reviewCount?: number;
  /** 포맷 (예: "PDF + 전자책 뷰어") */
  format?: string;
  /** 분량 (예: "45분 분량 (약 80페이지)") */
  volume?: string;
  /** 직무 (예: "기획 · 마케팅 · 영업") */
  jobs?: string;
  /** 업데이트 (예: "2026년 5월") */
  updated?: string;
  /** 책 소개 문단 */
  intro?: string[];
  /** 히어로 통계 (예: 12 워크플로우) */
  stats?: EbookStat[];
  /** 목차 */
  toc?: EbookTocItem[];
  /** 이런 분에게 드립니다 */
  whoFor?: EbookWhoItem[];
  /** 샘플 리뷰 */
  reviews?: EbookReview[];
}

export interface ProductRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
  body: EbookBody | null;
}
