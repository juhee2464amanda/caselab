'use client';

/**
 * 익명 방문자 식별자(anonymous_id) + 세션 식별자(session_id).
 *
 * 목적: events.user_id는 로그인 유저만 채워지므로, 익명 방문자의
 *   순방문자(UV)·세션·리텐션·"익명→가입" 퍼널을 추적할 클라이언트 식별자가 필요.
 *   북극성(주간 prompt_copy UV)을 "전체 방문자(익명 포함)" 기준으로 집계하는 전제.
 * 모든 track() 호출의 metadata에 자동 병합된다(track.ts attachIdentity).
 *
 * - anonymous_id: localStorage 영속 UUID (브라우저/기기 단위, 재방문 시 동일)
 * - session_id:   30분 비활동 시 갱신되는 세션 UUID (세션·바운스 분석용)
 */

const ANON_KEY = 'caselab.anon_id';
const SESSION_KEY = 'caselab.session';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30분

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // 폴백 (구형 브라우저)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const ANON_COOKIE = 'cl_aid';
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1년

function readAnonCookie(): string | undefined {
  try {
    const m = document.cookie.match(
      new RegExp(`(?:^|; )${ANON_COOKIE}=([^;]+)`)
    );
    return m?.[1] || undefined;
  } catch {
    return undefined;
  }
}

function writeAnonCookie(id: string): void {
  try {
    document.cookie = `${ANON_COOKIE}=${id}; path=/; max-age=${ANON_COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    // 무시 — localStorage만으로 동작
  }
}

/**
 * 영속 익명 ID (없으면 생성). SSR/스토리지 차단 시 undefined.
 * 쿠키 우선, localStorage 폴백 — 인앱 브라우저(인스타 등)가 localStorage를
 * 초기화해도 쿠키는 살아남는 경우가 많아, 같은 방문자가 매번 새 UV로
 * 잡히는 부풀림을 줄인다. 양쪽에 같은 값을 써서 동기화한다.
 */
export function getAnonId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const fromCookie = readAnonCookie();
  let fromStorage: string | null = null;
  try {
    fromStorage = window.localStorage.getItem(ANON_KEY);
  } catch {
    // 사생활 모드 등 — 쿠키만 사용
  }
  const id = fromCookie ?? fromStorage ?? uuid();
  if (fromCookie !== id) writeAnonCookie(id);
  if (fromStorage !== id) {
    try {
      window.localStorage.setItem(ANON_KEY, id);
    } catch {
      // 무시
    }
  }
  return id;
}

/**
 * 세션 ID. 마지막 활동으로부터 30분 지났으면 새 세션 발급, 아니면 기존 세션 연장.
 * 호출 때마다 lastTs를 갱신(sliding window).
 */
export function getSessionId(nowMs: number = Date.now()): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    let id: string | undefined;
    if (raw) {
      const parsed = JSON.parse(raw) as { id: string; ts: number };
      if (parsed?.id && nowMs - parsed.ts < SESSION_TIMEOUT_MS) {
        id = parsed.id;
      }
    }
    if (!id) id = uuid();
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ id, ts: nowMs }));
    return id;
  } catch {
    return undefined;
  }
}

/** track()에서 모든 이벤트 metadata에 병합할 식별자 묶음. */
export function attachIdentity(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  const anonymous_id = getAnonId();
  const session_id = getSessionId();
  return {
    ...metadata,
    ...(anonymous_id ? { anonymous_id } : {}),
    ...(session_id ? { session_id } : {}),
  };
}
