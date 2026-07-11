'use client';

/**
 * 관리자(내부) 트래픽 판별 — §18.21.
 *
 * 로그인 세션이 관리자 allowlist(서버 판별)에 해당하면:
 *   - GA4: gtag('set', { traffic_type: 'internal' }) — 이후 모든 이벤트에 파라미터가
 *     붙고, GA4 콘솔의 Internal Traffic 데이터 필터(활성화 필요)가 보고서에서 제외.
 *     GA 스크립트는 그대로 심으므로 관리자 계정으로 DebugView 테스트 가능.
 *   - events 테이블: track.ts가 이 결과로 INSERT를 스킵.
 *
 * 판별은 /api/analytics/internal(서버)에서 수행 — allowlist를 번들에 노출하지 않음.
 * 결과는 userId 단위 메모이즈(로그인/로그아웃으로 사용자가 바뀌면 재판별).
 */

let cached: { userId: string; promise: Promise<boolean> } | null = null;

export function isInternalTraffic(
  userId: string | null | undefined
): Promise<boolean> {
  if (!userId) return Promise.resolve(false); // 비로그인은 항상 외부 트래픽
  if (cached?.userId === userId) return cached.promise;

  const promise = fetch('/api/analytics/internal', {
    credentials: 'same-origin',
  })
    .then((res) => (res.ok ? res.json() : { internal: false }))
    .then((data: { internal?: boolean }) => {
      const internal = Boolean(data?.internal);
      if (internal && typeof window.gtag === 'function') {
        window.gtag('set', { traffic_type: 'internal' });
      }
      return internal;
    })
    .catch(() => false);

  cached = { userId, promise };
  return promise;
}
