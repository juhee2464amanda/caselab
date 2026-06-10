-- 0015_saves_reactions_products.sql
-- Date: 2026-06-10
-- 목적: 좋아요(reactions)·저장(saves)을 콘텐츠·도구에 더해 제품(products, ebook)에도 적용.
--       기존 content_id OR tool_id (0012) → content_id OR tool_id OR product_id (셋 중 하나).
--       RLS는 user_id 기준이라 변경 불필요. prod saves/reactions 0행이라 안전.

-- ── saves ──
alter table public.saves add column if not exists product_id uuid references public.products on delete cascade;

alter table public.saves drop constraint if exists saves_one_target;
alter table public.saves add constraint saves_one_target check (
  (content_id is not null)::int + (tool_id is not null)::int + (product_id is not null)::int = 1
);

create unique index if not exists saves_user_product_uniq
  on public.saves(user_id, product_id) where product_id is not null;
create index if not exists idx_saves_product on public.saves(product_id);

-- ── reactions ──
alter table public.reactions add column if not exists product_id uuid references public.products on delete cascade;

alter table public.reactions drop constraint if exists reactions_one_target;
alter table public.reactions add constraint reactions_one_target check (
  (content_id is not null)::int + (tool_id is not null)::int + (product_id is not null)::int = 1
);

create unique index if not exists reactions_user_product_type_uniq
  on public.reactions(user_id, product_id, type) where product_id is not null;
create index if not exists idx_reactions_product on public.reactions(product_id);

-- 실행: Supabase Dashboard(Caselab-prod) → SQL Editor → 본 파일 전체 Run.
--       (프로젝트 관행: db push 대신 SQL Editor 수동 실행. 0001/0012 객체에만 의존하여 단독 실행 안전.)
