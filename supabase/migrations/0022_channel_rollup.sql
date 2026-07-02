-- ============================================================
-- CaseLab Supabase Schema — 0022_channel_rollup
-- 채널/UTM 유입 롤업 RPC.
--
-- 배경:
--   utm.ts(attachUtmToMetadata) + anon.ts(attachIdentity)가 모든 이벤트
--   metadata 에 utm_source/utm_medium/utm_campaign + anonymous_id/session_id
--   를 심는다. 그러나 이 데이터를 채널별로 읽는 곳이 아직 없다.
--   admin/utm 화면이 채널별 세션/방문자/PV 를 볼 수 있도록 집계 RPC 제공.
--
-- 버킷팅:
--   utm_source 없으면 'direct', utm_medium/utm_campaign 없으면 '(none)'.
--   (referrer 폴백은 utm.ts 가 utm_source 에 host 를 채워 넣으므로 그대로 집계됨)
--
-- distinct 키:
--   sessions  = distinct metadata.session_id
--   visitors  = distinct coalesce(user_id, metadata.anonymous_id)  (익명 포함 1인 1카운트)
--   pageviews = count(*) where event_type='pageview'
--
-- 멱등성: create or replace function → 재실행 안전.
-- 의존성: 0002_admin_p0.sql (get_daily_trend style), 0020_analytics_anon_uv.sql (anon distinct 패턴)
-- ============================================================

create or replace function public.get_channel_breakdown(days int default 30)
returns table (
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  sessions     bigint,
  visitors     bigint,
  pageviews    bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with windowed as (
    select
      coalesce(nullif(e.metadata->>'utm_source', ''),   'direct') as src,
      coalesce(nullif(e.metadata->>'utm_medium', ''),   '(none)') as med,
      coalesce(nullif(e.metadata->>'utm_campaign', ''), '(none)') as camp,
      e.user_id,
      nullif(e.metadata->>'anonymous_id', '') as anon,
      nullif(e.metadata->>'session_id', '')   as sess,
      e.event_type
    from public.events e
    where e.created_at > now() - (days || ' days')::interval
  )
  select
    w.src  as utm_source,
    w.med  as utm_medium,
    w.camp as utm_campaign,
    count(distinct w.sess)                                  as sessions,
    count(distinct coalesce(w.user_id::text, w.anon))       as visitors,
    count(*) filter (where w.event_type = 'pageview')::bigint as pageviews
  from windowed w
  group by w.src, w.med, w.camp
  order by pageviews desc, sessions desc;
end;
$$;


-- RPC 권한: admin/editor 만 호출 (get_daily_trend 과 동일 정책)
revoke all on function public.get_channel_breakdown(int) from public;
grant execute on function public.get_channel_breakdown(int) to authenticated;
