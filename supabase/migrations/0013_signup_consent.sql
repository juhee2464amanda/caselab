-- ============================================================
-- 0013_signup_consent.sql  (2026-06-09)
-- Marketing consent = explicit opt-in (정보통신망법 제50조 / Korea PECA art.50).
--   1) profiles.newsletter default true -> false (no auto opt-in)
--   2) handle_new_user trigger reflects signup consent value from metadata
--      email signup: signUp options.data.newsletter / social: none -> false (opt-in at onboarding)
-- Idempotent: alter column / create or replace. No effect on existing rows
-- (default applies to new inserts only).
-- Run: Supabase Dashboard (Caselab-prod) -> SQL Editor -> run this file.
-- ============================================================

-- 1) new-signup default = not subscribed
alter table public.profiles
  alter column newsletter set default false;

-- 2) trigger reflects consent value from auth metadata (origin: 0001 handle_new_user)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar_url, onboarded, newsletter)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    false,
    coalesce((new.raw_user_meta_data ->> 'newsletter')::boolean, false)
  );
  return new;
end;
$$;
