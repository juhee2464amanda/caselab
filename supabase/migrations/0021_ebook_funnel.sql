-- ============================================================
-- 0021_ebook_funnel.sql
-- 작성일: 2026-06-26
-- 목적: ebook(무료 리드 마그넷) 구매 퍼널을 admin 분석에 노출.
--   get_ebook_funnel() — product별 조회수(product_view 이벤트) / 주문수(purchases)
--   + 조회→주문 전환율(%) 한 행씩 반환.
-- 스타일: 0002_admin_p0.sql get_north_star 정합 — security definer,
--   authenticated 에게만 execute, public revoke.
-- 의존: 0001_init(products·purchases) + 0011(events.product_id) 적용 후.
-- 멱등: create or replace function → 재실행 안전.
-- 실행: Supabase Dashboard(Caselab-prod) → SQL Editor → 본 파일 전체 Run.
-- ============================================================

-- product별 ebook 퍼널 — 조회(product_view) → 주문(purchases) 전환.
-- 주문수는 metadata.test 행(admin 테스트 발송) 제외해 실제 전환만 집계.
create or replace function public.get_ebook_funnel()
returns table (
  product_id    uuid,
  title         text,
  view_count    bigint,
  order_count   bigint,
  cvr_pct       numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with views as (
    select e.product_id as pid, count(*) as views
    from public.events e
    where e.event_type = 'product_view' and e.product_id is not null
    group by e.product_id
  ),
  orders as (
    select pu.product_id as pid, count(*) as orders
    from public.purchases pu
    where coalesce(pu.metadata->>'test', '') <> 'true'
    group by pu.product_id
  )
  select
    p.id                                  as product_id,
    p.title                               as title,
    coalesce(v.views, 0)::bigint          as view_count,
    coalesce(o.orders, 0)::bigint         as order_count,
    case
      when coalesce(v.views, 0) = 0 then 0::numeric
      else round((coalesce(o.orders, 0)::numeric / v.views::numeric) * 100, 1)
    end                                   as cvr_pct
  from public.products p
  left join views  v on v.pid = p.id
  left join orders o on o.pid = p.id
  order by view_count desc, order_count desc;
end;
$$;

-- RPC 권한: admin/editor(authenticated) 만 호출 가능 (security definer + 명시적 가드)
revoke all on function public.get_ebook_funnel() from public;
grant execute on function public.get_ebook_funnel() to authenticated;

-- ============================================================
-- 검증:
--   select * from public.get_ebook_funnel();
-- ============================================================
-- 0021 끝
-- ============================================================
