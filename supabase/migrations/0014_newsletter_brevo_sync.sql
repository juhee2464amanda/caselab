-- 0014_newsletter_brevo_sync.sql
-- 작성일: 2026-06-10
-- 목적: 0007 주석의 "Day 9 트리거" 구현 —
--       newsletter_subscribers(비로그인 구독자) → sync-brevo-contact Edge Function 자동 호출.
-- 의존: 0007_newsletter_subscribers 적용 후. pg_net(0002에서 생성). supabase_vault(기본 활성).
-- 멱등: create or replace function / drop trigger if exists → 재실행 안전.
--
-- ⚠️ Supabase 관리형은 ALTER DATABASE SET app.* 가 막혀(42501) → Vault로 시크릿 보관.
-- ⚠️ 운영자 1회 설정 필요 (SQL Editor 1회 실행):
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/sync-brevo-contact', 'sync_brevo_url');
--   select vault.create_secret('<SERVICE_ROLE_KEY(eyJ...)>', 'service_role_key');
--   (Vault 시크릿 미설정 시 트리거는 silent skip — 적재는 정상, Brevo 동기화만 보류)
-- 실행: Supabase Dashboard(Caselab-prod) → SQL Editor → 본 파일 전체 Run.
-- ============================================================

create extension if not exists pg_net;

create or replace function public.trg_sync_brevo_newsletter()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  fn_url      text;
  service_key text;
  action      text;
begin
  select decrypted_secret into fn_url      from vault.decrypted_secrets where name = 'sync_brevo_url'   limit 1;
  select decrypted_secret into service_key from vault.decrypted_secrets where name = 'service_role_key' limit 1;

  if fn_url is null or service_key is null then
    return new;
  end if;

  -- 액션 결정
  if (tg_op = 'INSERT') then
    -- 신규 구독자: unsubscribed 로 바로 들어오는 비정상 케이스는 제외
    action := case when new.status = 'unsubscribed' then 'unsubscribe' else 'subscribe' end;
  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    action := case when new.status = 'unsubscribed' then 'unsubscribe' else 'subscribe' end;
  else
    return new;
  end if;

  if new.email is null then
    return new;
  end if;

  perform net.http_post(
    url     := fn_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_key,
      'Content-Type',  'application/json'
    ),
    body    := jsonb_build_object(
      'email',  new.email,
      'name',   coalesce(new.name, ''),
      'action', action
    )
  );
  return new;
end;
$$;

drop trigger if exists sync_brevo_on_newsletter_subscriber on public.newsletter_subscribers;
create trigger sync_brevo_on_newsletter_subscriber
  after insert or update of status on public.newsletter_subscribers
  for each row execute function public.trg_sync_brevo_newsletter();

-- ===== 검증 =====
-- select tgname from pg_trigger where tgrelid = 'public.newsletter_subscribers'::regclass;
--   → sync_brevo_on_newsletter_subscriber 존재해야 함
-- select name from vault.secrets where name in ('sync_brevo_url','service_role_key');  -- 2줄
-- ============================================================
-- 0014 끝
-- ============================================================
