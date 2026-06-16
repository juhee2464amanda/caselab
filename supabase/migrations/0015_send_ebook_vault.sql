-- 0015_send_ebook_vault.sql
-- 작성일: 2026-06-10
-- 목적: 0002의 GUC 기반 트리거 2개를 Vault 방식으로 전환 — prod 복구.
--       ① trg_send_ebook_on_purchase  (purchases insert → send-ebook 자동 발송)
--       ② trg_sync_brevo_contact      (profiles.newsletter 전환 → sync-brevo-contact 호출)
-- 배경: Supabase 관리형은 ALTER DATABASE SET app.* 가 막혀(42501) GUC가 prod에 안 박힘
--       → 0002의 current_setting('app.*') 의존 트리거 2개가 출시 이후 silent skip(미작동)이었음.
--       0014(newsletter_subscribers)와 동일하게 vault.decrypted_secrets 로 전환.
-- 의존: 0002 적용 후. pg_net(0002 생성). supabase_vault(기본 활성).
-- 멱등: create or replace function / drop trigger if exists → 재실행 안전.
--
-- ⚠️ 운영자 1회 설정 필요 (SQL Editor 1회 실행):
--   select vault.create_secret('https://jsresrgzrsxotopfzpos.supabase.co/functions/v1/send-ebook', 'send_ebook_url');
--   -- service_role_key, sync_brevo_url 은 0014에서 이미 등록됨 → 재사용 (없으면 아래도 실행)
--   -- select vault.create_secret('https://jsresrgzrsxotopfzpos.supabase.co/functions/v1/sync-brevo-contact', 'sync_brevo_url');
--   -- select vault.create_secret('<SERVICE_ROLE_KEY(eyJ...)>', 'service_role_key');
--   (Vault 시크릿 미설정 시 트리거는 silent skip — 주문/구독 적재는 정상, 자동발송/동기화만 보류)
-- 실행: Supabase Dashboard(Caselab-prod) → SQL Editor → 본 파일 전체 Run.
-- ============================================================

create extension if not exists pg_net;

-- ============================================================
-- ① 전자책 자동 발송 — GUC → Vault
-- ============================================================
create or replace function public.trg_send_ebook_on_purchase()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  fn_url      text;
  service_key text;
begin
  select decrypted_secret into fn_url      from vault.decrypted_secrets where name = 'send_ebook_url'   limit 1;
  select decrypted_secret into service_key from vault.decrypted_secrets where name = 'service_role_key' limit 1;

  -- Vault 시크릿 누락 시 silent skip
  if fn_url is null or service_key is null then
    return new;
  end if;

  if new.status = 'pending' then
    perform net.http_post(
      url     := fn_url,
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || service_key,
        'Content-Type',  'application/json'
      ),
      body    := jsonb_build_object('purchase_id', new.id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists send_ebook_after_purchase on public.purchases;
create trigger send_ebook_after_purchase
  after insert on public.purchases
  for each row execute function public.trg_send_ebook_on_purchase();

-- ============================================================
-- ② Brevo Contact 동기화 (로그인 유저: profiles.newsletter) — GUC → Vault
-- ============================================================
create or replace function public.trg_sync_brevo_contact()
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
  if (tg_op = 'INSERT' and new.newsletter is true) then
    action := 'subscribe';
  elsif (tg_op = 'UPDATE' and new.newsletter is distinct from old.newsletter) then
    action := case when new.newsletter then 'subscribe' else 'unsubscribe' end;
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

drop trigger if exists sync_brevo_on_newsletter on public.profiles;
create trigger sync_brevo_on_newsletter
  after insert or update of newsletter, email on public.profiles
  for each row execute function public.trg_sync_brevo_contact();

-- ===== 검증 =====
-- select tgname from pg_trigger where tgrelid = 'public.purchases'::regclass;  -- send_ebook_after_purchase
-- select tgname from pg_trigger where tgrelid = 'public.profiles'::regclass;   -- sync_brevo_on_newsletter
-- select name, length(decrypted_secret) len, decrypted_secret ~ '\s' has_space
--   from vault.decrypted_secrets where name in ('send_ebook_url','sync_brevo_url','service_role_key');  -- 3줄, has_space=false
-- ============================================================
-- 0015 끝
-- ============================================================
