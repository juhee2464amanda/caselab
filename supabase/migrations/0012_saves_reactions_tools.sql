-- 0012_saves_reactions_tools.sql
-- Date: 2026-06-07
-- 목적: 좋아요(reactions)·저장(saves)을 콘텐츠뿐 아니라 도구(tools)에도 적용.
--       기존 content_id 전용 → content_id OR tool_id (둘 중 하나).
--       RLS는 user_id 기준이라 변경 불필요. prod saves/reactions 0행이라 안전.

-- ── saves ──
alter table public.saves alter column content_id drop not null;
alter table public.saves add column if not exists tool_id uuid references public.tools on delete cascade;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'saves_one_target') then
    alter table public.saves add constraint saves_one_target check (
      (content_id is not null and tool_id is null) or
      (content_id is null and tool_id is not null)
    );
  end if;
end $$;

create unique index if not exists saves_user_tool_uniq
  on public.saves(user_id, tool_id) where tool_id is not null;
create index if not exists idx_saves_tool on public.saves(tool_id);

-- ── reactions ──
alter table public.reactions alter column content_id drop not null;
alter table public.reactions add column if not exists tool_id uuid references public.tools on delete cascade;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'reactions_one_target') then
    alter table public.reactions add constraint reactions_one_target check (
      (content_id is not null and tool_id is null) or
      (content_id is null and tool_id is not null)
    );
  end if;
end $$;

create unique index if not exists reactions_user_tool_type_uniq
  on public.reactions(user_id, tool_id, type) where tool_id is not null;
create index if not exists idx_reactions_tool on public.reactions(tool_id);

-- 실행: supabase db push (Caselab-prod 링크됨).
