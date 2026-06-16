-- ============================================================
-- GA4/events 태깅 검증 쿼리  (worktree: feat+ga4-tagging)
-- 사용법: Supabase 대시보드 → SQL editor 에 이 파일 내용 붙여넣고 실행.
-- 선행: http://localhost:3000/?utm_source=test&utm_campaign=launch 로 진입 후
--       ♡저장·공유·구독·이북신청·로그인 등 클릭으로 이벤트를 먼저 생성할 것.
-- ============================================================

-- [1] 최근 10분 이벤트 종류별 집계
--   기대값: pv(진입) + 클릭한 이벤트들
--   (product_view, ebook_order, subscribe, save, react_up, review, share, signup, login, search, deep_read, prompt_copy)
select event_type, count(*) as cnt
from events
where created_at > now() - interval '10 min'
group by event_type
order by cnt desc;


-- [2] 채널 유입 귀속 확인 (UTM)
--   기대값: utm_source = 'test' 행이 보이면 채널 어트리뷰션 정상
select
  metadata->>'utm_source'   as utm_source,
  metadata->>'utm_campaign' as utm_campaign,
  count(*)                  as cnt
from events
where created_at > now() - interval '10 min'
group by 1, 2
order by cnt desc;


-- [3] 구매 퍼널 단계별 집계 (이번 라운드 핵심)
--   pv → product_view → ebook_order  (단계별 수가 줄어드는 깔때기 모양이면 정상)
select
  count(*) filter (where event_type = 'pv')           as step1_pv,
  count(*) filter (where event_type = 'product_view') as step2_product_view,
  count(*) filter (where event_type = 'ebook_order')  as step3_ebook_order
from events
where created_at > now() - interval '1 hour';


-- [4] 최근 이벤트 원본 20건 (metadata 내용까지 눈으로 확인)
select created_at, event_type, content_id, metadata
from events
order by created_at desc
limit 20;


-- ===== 2차 추가분 검증 (anonymous_id · dwell · cta_click · ebook_download) =====

-- [5] 익명 식별자 부착 확인 — 모든 이벤트에 anonymous_id/session_id가 실렸는지
select
  count(*)                                              as total,
  count(*) filter (where metadata ? 'anonymous_id')     as with_anon,
  count(*) filter (where metadata ? 'session_id')        as with_session
from events
where created_at > now() - interval '10 min';

-- [6] 순방문자(UV) — anonymous_id 기준 (이제 '페이지뷰 수'가 아니라 '방문자 수')
select
  count(*)                                       as total_pv,
  count(distinct metadata->>'anonymous_id')      as unique_visitors,
  count(distinct metadata->>'session_id')        as sessions
from events
where event_type = 'pv' and created_at > now() - interval '1 day';

-- [7] 체류시간(dwell) — 콘텐츠별 평균/최대 초
select
  content_id,
  count(*)                                  as samples,
  round(avg((metadata->>'seconds')::int))   as avg_sec,
  max((metadata->>'seconds')::int)          as max_sec
from events
where event_type = 'dwell' and created_at > now() - interval '1 day'
group by content_id
order by samples desc;

-- [8] CTA 클릭 — 라벨별
select metadata->>'label' as cta, count(*) as cnt
from events
where event_type = 'cta_click' and created_at > now() - interval '1 day'
group by 1 order by cnt desc;

-- [9] 다운로드(ebook_download) — 프록시 경유 (Edge Function 재배포 후 prod에서 발생)
select metadata->>'product_id' as product_id, count(*) as downloads,
       count(distinct metadata->>'purchase_id') as unique_purchases
from events
where event_type = 'ebook_download' and created_at > now() - interval '7 days'
group by 1 order by downloads desc;
