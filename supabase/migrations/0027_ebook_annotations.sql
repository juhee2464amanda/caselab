-- ============================================================
-- 0027_ebook_annotations — 웹뷰어 하이라이트/메모 (v2 선행 구현)
-- 기획: docs/08_ebook_viewer_plan.md §V2 하이라이트/메모 구현 방안 상세
--
-- rects: 페이지 기준 정규화 좌표 배열 [{x,y,w,h}] (0..1) — PDF는 고정 레이아웃이라
--        정규화 rect가 줌/뷰포트와 무관하게 안정적. 페이지 경계 걸침은 클라이언트에서
--        단일 페이지로 제한(예스24 페이지 경계 버그 사례 회피).
-- note:  하이라이트에 선택적으로 붙는 메모 (교보처럼 강제 입력하지 않음)
--
-- 적용: 대시보드 SQL Editor에서 멱등 실행 (db push 금지 — 이력 드리프트).
-- ============================================================

create table if not exists public.ebook_annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  page int not null,
  color text not null default 'yellow',
  selected_text text,
  rects jsonb not null default '[]'::jsonb,
  note text,
  created_at timestamptz not null default now()
);

alter table public.ebook_annotations enable row level security;

drop policy if exists "Annotations own" on public.ebook_annotations;
create policy "Annotations own"
  on public.ebook_annotations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_ebook_annotations_user_product
  on public.ebook_annotations (user_id, product_id);

-- PostgREST 스키마 캐시 갱신
notify pgrst, 'reload schema';
