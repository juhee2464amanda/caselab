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
export interface EbookBody {
  /** 커버 부제 */
  subtitle?: string;
  /** 히어로 통계 (예: 12 워크플로우) */
  stats?: EbookStat[];
  /** 목차 */
  toc?: EbookTocItem[];
  /** 이런 분에게 드립니다 */
  whoFor?: EbookWhoItem[];
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
