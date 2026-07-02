/**
 * UTM 파라미터 파싱 + sessionStorage 저장 + track wrapper 자동 병합
 *
 * 결정 출처: §19 D25 (UTM Builder) + D26 (utm_channel seed) + §18.10
 *
 * 흐름:
 *   1. 사용자가 ?utm_source=instagram&utm_medium=social&utm_campaign=xxx 로 진입
 *   2. <UtmCapture /> 컴포넌트가 mount 시 parseUtmFromSearch() → saveUtmToSession()
 *   3. 이후 track() 호출 시 attachUtmToMetadata()가 events.metadata에 자동 병합
 *   4. admin/utm 히스토리에서 events GROUP BY metadata->>'utm_campaign'으로 채널별 분석
 */

export type Utm = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
};

const SESSION_KEY = 'caselab_utm';
const REFERRER_KEY = 'caselab_referrer';

const KEYS: (keyof Utm)[] = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
];

export function parseUtmFromSearch(search: string): Utm | null {
  if (!search) return null;
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const utm: Utm = {};
  let found = false;
  for (const k of KEYS) {
    const v = params.get(k);
    if (v) {
      utm[k] = v;
      found = true;
    }
  }
  return found ? utm : null;
}

export function saveUtmToSession(utm: Utm) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(utm));
  } catch {
    // sessionStorage 비활성 (시크릿 모드 등) — silent fail
  }
}

export function getUtm(): Utm {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Utm) : {};
  } catch {
    return {};
  }
}

export function clearUtm() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(REFERRER_KEY);
  } catch {
    // silent
  }
}

/**
 * document.referrer 에서 외부 유입 host 만 추출.
 * referrer 없음(직접 유입) 또는 자기 도메인 내부 이동이면 null.
 */
function referrerHost(): string | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  const ref = document.referrer;
  if (!ref) return null;
  try {
    const host = new URL(ref).hostname.replace(/^www\./, '');
    const self = window.location.hostname.replace(/^www\./, '');
    if (!host || host === self) return null; // 내부 이동 제외
    return host;
  } catch {
    return null;
  }
}

/**
 * 첫 로드 시 referrer 폴백 1회 캡처.
 * - utm 파라미터가 이미 세션에 있으면 skip (빈 객체 반환).
 * - 없으면 document.referrer host 를 { utm_source, utm_medium:'referral', referrer }
 *   로 세션에 1회 저장하고 반환.
 * - 직접 유입(외부 referrer 없음)이면 빈 객체로 마킹해 재계산을 막는다.
 */
export function captureReferrerFallback(): Utm {
  if (typeof window === 'undefined') return {};
  // 명시적 utm 파라미터가 잡혀 있으면 referrer 폴백 불필요
  if (getUtm().utm_source) return {};
  try {
    const raw = window.sessionStorage.getItem(REFERRER_KEY);
    if (raw !== null) return JSON.parse(raw) as Utm; // 이미 1회 판정됨
  } catch {
    return {};
  }
  const host = referrerHost();
  const utm: Utm = host
    ? { utm_source: host, utm_medium: 'referral', referrer: host }
    : {};
  try {
    window.sessionStorage.setItem(REFERRER_KEY, JSON.stringify(utm));
  } catch {
    // sessionStorage 비활성 — silent fail
  }
  return utm;
}

/**
 * track() wrapper가 호출. events.metadata에 utm_* 자동 병합.
 * utm 파라미터가 없으면 document.referrer host 를 채널 폴백으로 보강한다.
 */
export function attachUtmToMetadata(
  metadata: Record<string, unknown> = {}
): Record<string, unknown> {
  const utm = getUtm();
  // utm 파라미터가 없을 때만 referrer 폴백을 깔아준다 (명시 utm 이 항상 우선)
  const fallback = utm.utm_source ? {} : captureReferrerFallback();
  return { ...fallback, ...utm, ...metadata }; // 명시 metadata가 utm/referrer를 override
}
