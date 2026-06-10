-- 0016_reviews.sql
-- Date: 2026-06-10
-- 목적: 별점+텍스트 리뷰. 콘텐츠(case/trend)·도구·제품(ebook) 폴리모픽 타깃(셋 중 하나).
-- 정책:
--   · 제품(product_id) 리뷰는 구매자만(무료 ebook 다운로드도 purchases 기록 → 자격). RLS WITH CHECK로 강제.
--   · 콘텐츠/도구 리뷰는 로그인만(구매이력 무관).
--   · 1인 1리뷰(타깃별 부분 unique). 본인 수정/삭제 가능. status='visible' 즉시 노출.
-- 댓글(comments)은 별개 기능이며 변경 없음.

create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  content_id uuid references public.contents on delete cascade,
  tool_id    uuid references public.tools    on delete cascade,
  product_id uuid references public.products on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text not null,
  status text not null default 'visible' check (status in ('visible','hidden','reported')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_one_target check (
    (content_id is not null)::int + (tool_id is not null)::int + (product_id is not null)::int = 1
  )
);

-- 1인 1리뷰: 타깃별 부분 unique
create unique index reviews_user_content_uniq on public.reviews(user_id, content_id) where content_id is not null;
create unique index reviews_user_tool_uniq    on public.reviews(user_id, tool_id)    where tool_id is not null;
create unique index reviews_user_product_uniq on public.reviews(user_id, product_id) where product_id is not null;

create index idx_reviews_content on public.reviews(content_id, created_at desc);
create index idx_reviews_tool    on public.reviews(tool_id, created_at desc);
create index idx_reviews_product on public.reviews(product_id, created_at desc);
create index idx_reviews_status  on public.reviews(status);

alter table public.reviews enable row level security;

create policy "view visible reviews"
  on public.reviews for select using (status = 'visible' or auth.uid() = user_id or public.is_admin());

-- 제품 리뷰는 구매자만, 그 외(콘텐츠/도구)는 로그인만. RLS가 진짜 게이트.
create policy "insert own review"
  on public.reviews for insert with check (
    auth.uid() = user_id
    and (
      product_id is null
      or exists (
        select 1 from public.purchases p
        where p.product_id = reviews.product_id and p.user_id = auth.uid()
      )
    )
  );

create policy "update own review"
  on public.reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own review"
  on public.reviews for delete using (auth.uid() = user_id or public.is_admin());

create policy "admins moderate reviews"
  on public.reviews for update using (public.is_admin());

-- 실행: Supabase Dashboard(Caselab-prod) → SQL Editor → 본 파일 전체 Run.
--       (프로젝트 관행: db push 대신 SQL Editor 수동 실행. 0001/0012 객체에만 의존하여 단독 실행 안전.)
