-- ============================================================
-- 0026_ebook_viewer — 구매자 웹뷰어 (이어읽기 + 북마크)
-- 기획: docs/08_ebook_viewer_plan.md
--
-- ebook_reading_state: 마지막 읽은 페이지 (user×product 1행, upsert)
-- ebook_bookmarks:     페이지 단위 북마크 (user×product×page 유니크)
-- 하이라이트/메모(annotations)는 v2 — 이번 마이그레이션에 포함하지 않음.
--
-- 적용: 대시보드 SQL Editor에서 멱등 실행 (db push 금지 — 이력 드리프트).
-- ============================================================

-- 이어읽기 상태
create table if not exists public.ebook_reading_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  page int not null default 1,
  total_pages int,
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.ebook_reading_state enable row level security;

drop policy if exists "Reading state own" on public.ebook_reading_state;
create policy "Reading state own"
  on public.ebook_reading_state for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 북마크
create table if not exists public.ebook_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  page int not null,
  label text,
  created_at timestamptz not null default now(),
  unique (user_id, product_id, page)
);

alter table public.ebook_bookmarks enable row level security;

drop policy if exists "Bookmarks own" on public.ebook_bookmarks;
create policy "Bookmarks own"
  on public.ebook_bookmarks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_ebook_bookmarks_user_product
  on public.ebook_bookmarks (user_id, product_id);

-- PostgREST 스키마 캐시 갱신
notify pgrst, 'reload schema';
