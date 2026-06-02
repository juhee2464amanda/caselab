/**
 * 디자인 토큰 — user / admin set 분리 (D46)
 *
 * 결정 출처:
 *   docs/04_dev_plan.md §2 (admin 토큰 — 배경 #FAFAF7 + 인디고 #1E40AF)
 *   docs/06_admin_dev_plan.md §4.1 (user/admin set 분리표)
 *   docs/design_mockup/admin/ADMIN_SESSION_NOTES.md §5-8 (의도적 분리)
 *
 * 사용:
 *   - user 페이지: `bg-user-base`, `text-user-ink`, `text-user-accent`
 *   - admin 페이지: `bg-admin-base`, `text-admin-ink`, `text-admin-accent`
 *   - 기존 `bg-bg` / `text-ink` / `bg-accent` 등은 admin default 의미로 유지 (점진 마이그레이션)
 *
 * tailwind.config.ts에서 import해서 colors namespace로 전개.
 */

/** user 페이지 토큰 — 매거진/저널리즘 톤 (HBR·Stratechery·NYT Opinion 레퍼런스) */
export const userTokens = {
  bgBase: '#FFFFFF', // 메인 배경 (밝게)
  bgSubtle: '#F7F7F7', // 카드 보조 배경
  ink: '#0A0A0A', // 본문 (공통)
  inkMuted: '#8B95A1', // 보조 텍스트
  accent: '#3182F6', // 토스 블루 — 강조 구간만
  accentHover: '#1B64DA',
  border: '#E5E8EB',
} as const;

/** admin 페이지 토큰 — 인디고 + warm beige 차분한 운영 톤 */
export const adminTokens = {
  bgBase: '#FAFAF7', // warm beige 배경
  bgSubtle: '#F4F4F0', // 사이드바·카드 보조
  ink: '#0A0A0A', // 본문 (공통)
  inkMuted: '#8B8678', // 보조 텍스트 (warm gray)
  accent: '#1E40AF', // Indigo 700 — 강조·CTA
  accentHover: '#1E3A8A',
  border: '#E5E1D5',
} as const;

export type DesignTokens = typeof userTokens;
