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
 *
 * 레이스 주의: 로그인 직후 첫 pageview에서는 클라이언트에 세션이 있어도(getSession)
 * 서버 쿠키가 아직 전파되지 않아 /api/analytics/internal이 false를 줄 수 있다.
 * 이 false를 영구 캐시하면 운영자 세션 전체가 새므로(§18.21 버그), 긍정(true)만
 * 캐시하고 부정(false)은 캐시를 비워 다음 이벤트에서 재판별한다. in-flight 프라미스는
 * 그대로 공유되어 동시 다발 pageview가 요청을 중복 발사하지는 않는다.
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
      if (internal) {
        if (typeof window.gtag === 'function') {
          window.gtag('set', { traffic_type: 'internal' });
        }
      } else if (cached?.userId === userId) {
        // 세션 전파 전 false일 수 있음 — 캐시 비워 다음 이벤트에서 재판별
        cached = null;
      }
      return internal;
    })
    .catch(() => {
      if (cached?.userId === userId) cached = null;
      return false;
    });

  cached = { userId, promise };
  return promise;
}

/**
 * 로그인 없이도 판정하는 내부(운영자) 컨텍스트 제외 — §18.21.
 *
 * 로그인 기반 제외(isInternalTraffic)는 로그인된 세션에서만 작동해, 프리뷰
 * 배포·로그아웃·시크릿·localhost 등 세션 없는 맥락의 운영자 트래픽을 못 거른다.
 * 이를 origin/플래그로 보강한다.
 *
 *  - Layer 1: 개발 빌드(localhost)거나, 실서비스 canonical 도메인이 아닌 호스트
 *    (프리뷰 배포 등)면 제외. canonical 도메인의 유일한 출처는 NEXT_PUBLIC_SITE_URL
 *    (metadataBase·robots·sitemap과 동일) — 도메인을 하드코딩하지 않는다.
 *    env 미설정 등으로 canonical을 알 수 없으면 실트래픽을 막지 않도록 fail-open(로그 유지).
 *  - Layer 2: opt-out 플래그. `?cl_optout=1` 방문 시 localStorage에 저장(로그아웃해도
 *    유지)되어 이후 해당 브라우저의 실도메인 로그아웃 방문도 제외. `?cl_optout=0`로 해제.
 */
const OPTOUT_KEY = 'cl_optout';

function canonicalHost(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '').hostname;
  } catch {
    return '';
  }
}

export function isExcludedContext(): boolean {
  if (typeof window === 'undefined') return false;

  // Layer 2 — opt-out 플래그 (URL 파라미터로 토글, localStorage에 영속)
  try {
    const flag = new URL(window.location.href).searchParams.get('cl_optout');
    if (flag === '1') localStorage.setItem(OPTOUT_KEY, '1');
    else if (flag === '0') localStorage.removeItem(OPTOUT_KEY);
    if (localStorage.getItem(OPTOUT_KEY) === '1') return true;
  } catch {
    // localStorage 접근 불가(사생활 모드 등) — 무시하고 Layer 1로 진행
  }

  // Layer 1 — 개발 빌드 제외 (localhost 등). 프리뷰/프로덕션 빌드는 NODE_ENV='production'.
  if (process.env.NODE_ENV !== 'production') return true;
  // canonical(실서비스) 도메인이 아닌 호스트(프리뷰 배포 등)는 제외. 모르면 fail-open.
  const canonical = canonicalHost();
  if (canonical && window.location.hostname !== canonical) return true;
  return false;
}
