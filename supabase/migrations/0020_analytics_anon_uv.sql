-- ============================================================
-- CaseLab Supabase Schema — 0020_analytics_anon_uv
-- 북극성/UV 집계를 "전체 방문자(익명 포함)" 기준으로 격상.
--
-- 배경:
--   0002 weekly_kpi 는 distinct UV 를 coalesce(user_id, metadata->>'user_id')
--   로 셌다. 익명 방문자는 user_id=null + metadata.user_id 없음 → 전원이
--   하나의 null 버킷으로 뭉쳐 과소집계됐다.
--   track.ts(anon.ts attachIdentity)가 모든 이벤트 metadata 에 anonymous_id 를
--   심으므로, distinct 키에 anonymous_id 를 추가해 익명 방문자까지 1인 1카운트.
--
-- 결정: 북극성 = "주간 prompt_copy UV (전체 방문자, 익명 포함)" (2026-06 사용자 확정)
--
-- distinct 키 우선순위:
--   user_id            (로그인 — 기기 간 동일인 dedupe)
--   metadata.anonymous_id (익명 — 브라우저/기기 단위 영속)
--   metadata.user_id   (레거시 폴백)
--
-- 멱등성: create or replace view → 재실행 안전.
-- 의존성: 0002_admin_p0.sql (weekly_kpi 최초 정의)
-- ============================================================

create or replace view public.weekly_kpi as
with
this_week as (
  select
    -- 북극성: 주간 prompt_copy UV (전체 방문자 — 익명 포함)
    count(distinct coalesce(user_id::text, metadata->>'anonymous_id', metadata->>'user_id'))
      filter (where event_type='prompt_copy' and created_at > now() - interval '7 days') as prompt_copy_uv_7d,
    -- 5KPI: 방문자 UV (전체 방문자 — 익명 포함)
    count(distinct coalesce(user_id::text, metadata->>'anonymous_id', metadata->>'user_id'))
      filter (where event_type='pageview' and created_at > now() - interval '7 days') as uv_7d,
    count(*) filter (where event_type='pageview' and created_at > now() - interval '7 days') as pv_7d,
    -- 프롬프트 복사 절대 수
    count(*) filter (where event_type='prompt_copy' and created_at > now() - interval '7 days') as prompt_copy_count_7d,
    -- 저장
    count(*) filter (where event_type='save' and created_at > now() - interval '7 days') as save_count_7d,
    -- 반응 (좋아요)
    count(*) filter (where event_type='react' and created_at > now() - interval '7 days') as react_count_7d
  from public.events
),
prev_week as (
  select
    count(distinct coalesce(user_id::text, metadata->>'anonymous_id', metadata->>'user_id'))
      filter (where event_type='prompt_copy' and created_at between now() - interval '14 days' and now() - interval '7 days') as prompt_copy_uv_prev_7d,
    count(distinct coalesce(user_id::text, metadata->>'anonymous_id', metadata->>'user_id'))
      filter (where event_type='pageview' and created_at between now() - interval '14 days' and now() - interval '7 days') as uv_prev_7d
  from public.events
),
profiles_kpi as (
  select
    (select count(*) from public.profiles) as total_users,
    (select count(*) from public.profiles where created_at > now() - interval '7 days') as new_users_7d,
    (select count(*) from public.profiles where created_at between now() - interval '14 days' and now() - interval '7 days') as new_users_prev_7d
)
select * from this_week, prev_week, profiles_kpi;

-- get_north_star() 는 weekly_kpi 를 읽으므로 자동 반영 (변경 불필요).
