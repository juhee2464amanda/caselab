-- ============================================================
-- 0025_site_content — 홈페이지 인라인 퀵편집 오버라이드
--
-- 관리자가 라이브 홈페이지에서 더블클릭으로 텍스트/이미지를 교체하면
-- 그 값이 key→value 로 여기 저장된다. 서버 렌더가 하드코딩 기본값 위에
-- 이 오버라이드를 병합한다. 원본 contents/tools 는 건드리지 않는다.
--
--   key 예: home.section.cases.title, home.series.tools.name,
--           home.banner.title, home.hero.<slug>.title
-- ============================================================

create table if not exists public.site_content (
  key         text primary key,
  value_type  text not null check (value_type in ('text', 'image')),
  value       text not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

comment on table public.site_content is
  '홈페이지 하드코딩 카피/이미지 + 히어로 표시값 오버라이드 (관리자 인라인 퀵편집)';

alter table public.site_content enable row level security;

-- 공개 읽기 — 렌더 시 anon/서버 모두 조회 가능
drop policy if exists "Anyone reads site_content" on public.site_content;
create policy "Anyone reads site_content"
  on public.site_content for select
  using (true);

-- 쓰기 — 관리자만 (심층방어; API 는 서비스롤로 우회하지만 직접 접근도 차단)
drop policy if exists "Admins manage site_content" on public.site_content;
create policy "Admins manage site_content"
  on public.site_content for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- site-assets 버킷 — 홈 인라인 편집으로 교체하는 이미지 (public read)
-- 경로 규칙: home/{timestamp}-{filename}
-- ============================================================

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

drop policy if exists "Anyone reads site-assets" on storage.objects;
create policy "Anyone reads site-assets"
  on storage.objects for select
  using (bucket_id = 'site-assets');

drop policy if exists "Admins manage site-assets" on storage.objects;
create policy "Admins manage site-assets"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'site-assets' and public.is_admin())
  with check (bucket_id = 'site-assets' and public.is_admin());
