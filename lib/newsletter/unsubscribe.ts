import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * 뉴스레터 수신거부 토큰 (서버 전용).
 *
 * 캠페인/안내 메일의 수신거부 링크가 이 토큰을 쓴다:
 *   /unsubscribe?email=<email>&t=<hmac>
 * 토큰: HMAC-SHA256('newsletter-unsub:'+email소문자, SERVICE_ROLE_KEY)
 *   — ebook 다운로드 프록시(app/api/ebook/download)와 같은 패턴.
 *   프리픽스로 다른 용도 토큰과 교차 사용을 차단한다.
 */

const PREFIX = 'newsletter-unsub:';

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

export function unsubscribeToken(email: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정');
  return createHmac('sha256', secret).update(PREFIX + normalize(email)).digest('hex');
}

export function unsubscribeTokenValid(email: string, token: string): boolean {
  try {
    const expected = Buffer.from(unsubscribeToken(email), 'hex');
    const given = Buffer.from(token, 'hex');
    return expected.length === given.length && timingSafeEqual(expected, given);
  } catch {
    return false;
  }
}

/** 캠페인 메일 푸터 등에 넣을 수신거부 URL 생성. */
export function unsubscribeUrl(email: string, origin: string): string {
  return `${origin}/unsubscribe?email=${encodeURIComponent(normalize(email))}&t=${unsubscribeToken(email)}`;
}
