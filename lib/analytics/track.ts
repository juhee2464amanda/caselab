'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { GA_ID } from './ga4';
import { attachUtmToMetadata } from './utm';
import { attachIdentity } from './anon';
import { isInternalTraffic } from './internal-traffic';

/**
 * events 테이블 + GA4 통합 적재 wrapper.
 *
 * 결정 출처:
 *   §19 D21 — GA4 event name 매핑 한 곳에 정의
 *   §19 D55 — events.search 추가 (admin/analytics 인기 검색어 적재)
 *   §18.9 — Consent Mode v2 (denied 모드에서도 events 테이블은 적재. GA4만 차단)
 *
 * 사용:
 *   track('prompt_copy', { content_id, label });
 *   track('search', { keyword, results_count, filter });
 *   track('scroll_25', { content_id, depth: 25 });
 */

export type EventType =
  | 'pv'
  | 'deep_read'
  | 'prompt_copy'
  | 'save'
  | 'react_up'
  | 'react_down'
  | 'cta_click'
  | 'ebook_order'
  | 'ebook_download'
  | 'ebook_read_page'
  | 'ebook_finish'
  | 'scroll_25'
  | 'scroll_50'
  | 'scroll_100'
  | 'search'
  | 'product_view'
  | 'subscribe'
  | 'signup'
  | 'login'
  | 'review'
  | 'share'
  | 'dwell'
  | 'banner_view';

/**
 * GA4 event name 매핑. D21 결정 — Phase 4 PG 도입 시점에 ebook_order → 'purchase' 매핑 활성.
 */
const GA4_EVENT_NAME: Record<EventType, string> = {
  pv: 'page_view',
  deep_read: 'deep_read',
  prompt_copy: 'prompt_copy',
  save: 'save',
  react_up: 'react_up',
  react_down: 'react_down',
  cta_click: 'cta_click',
  ebook_order: 'ebook_order', // Phase 4(PG)에 'purchase'로 변경
  ebook_download: 'ebook_download',
  ebook_read_page: 'ebook_read_page',
  ebook_finish: 'ebook_finish',
  scroll_25: 'scroll', // GA4 표준 'scroll' 이벤트로 통합 + depth params
  scroll_50: 'scroll',
  scroll_100: 'scroll',
  search: 'search',
  product_view: 'product_view',
  subscribe: 'newsletter_subscribe',
  signup: 'sign_up',
  login: 'login',
  review: 'post_review',
  share: 'share',
  dwell: 'user_engagement', // GA4 표준 체류시간 이벤트
  banner_view: 'view_promotion', // GA4 표준 프로모션 노출
};

/**
 * DB event_type 매핑 — events 테이블·SQL 뷰(weekly_kpi/get_daily_trend)·admin 쿼리 정합.
 * 일부 EventType은 같은 DB 이벤트로 통합(pv→pageview, react_up/down→react. 방향은 metadata.direction).
 */
const DB_EVENT_NAME: Record<EventType, string> = {
  pv: 'pageview',
  deep_read: 'deep_read',
  prompt_copy: 'prompt_copy',
  save: 'save',
  react_up: 'react',
  react_down: 'react',
  cta_click: 'cta_click',
  ebook_order: 'ebook_order',
  ebook_download: 'ebook_download',
  ebook_read_page: 'ebook_read_page',
  ebook_finish: 'ebook_finish',
  scroll_25: 'scroll_25',
  scroll_50: 'scroll_50',
  scroll_100: 'scroll_100',
  search: 'search',
  product_view: 'product_view',
  subscribe: 'subscribe',
  signup: 'signup',
  login: 'login',
  review: 'review',
  share: 'share',
  dwell: 'dwell',
  banner_view: 'banner_view',
};

/**
 * events 테이블 INSERT + GA4 fire (Consent granted 시).
 * 실패는 silent (운영 흐름 차단 안 함).
 */
export async function track(
  eventType: EventType,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const merged = attachIdentity(attachUtmToMetadata(metadata));

  // 관리자 세션 판별 (§18.21) — GA fire 전에 await해야
  // gtag('set', { traffic_type }) → gtag('event') 순서가 보장됨.
  let internal = false;
  let userId: string | null = null;
  try {
    const supabase = createSupabaseBrowserClient();
    // user_id 채움 — UV distinct 집계 원천 (getSession은 로컬, 네트워크 없음)
    const {
      data: { session },
    } = await supabase.auth.getSession();
    userId = session?.user?.id ?? null;
    internal = await isInternalTraffic(userId);
  } catch {
    // silent — 판별 실패 시 기존과 동일하게 외부 트래픽으로 취급
  }

  // 1) events 테이블 적재 (anon RLS 허용, 익명 사용자도 적재 가능)
  //    관리자 세션은 스킵 — admin 확인 작업이 KPI를 오염시키지 않도록 (§18.21)
  if (!internal) {
    try {
      const supabase = createSupabaseBrowserClient();
      const { content_id, product_id, ...rest } = merged as {
        content_id?: string;
        product_id?: string;
      } & Record<string, unknown>;
      const row: Record<string, unknown> = {
        event_type: DB_EVENT_NAME[eventType],
        content_id: content_id ?? null,
        user_id: userId,
        metadata: rest,
      };
      // product_id는 값이 있을 때만 포함 (0011 미적용 환경에서 일반 이벤트 insert 실패 방지)
      if (product_id) row.product_id = product_id;
      await supabase.from('events').insert(row);
    } catch {
      // silent
    }
  }

  // 2) GA4 fire (Consent granted 시만 — Consent Mode v2가 자동 처리)
  //    관리자 세션도 발화 — traffic_type=internal이 세팅된 상태라 GA4 데이터
  //    필터가 보고서에서 제외하고, DebugView 테스트는 그대로 가능 (§18.21)
  if (
    typeof window !== 'undefined' &&
    GA_ID &&
    typeof window.gtag === 'function'
  ) {
    const ga4Name = GA4_EVENT_NAME[eventType];
    window.gtag('event', ga4Name, merged);
  }
}
