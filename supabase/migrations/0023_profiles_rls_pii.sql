-- ============================================================
-- 0023_profiles_rls_pii — profiles PII 노출 수정
-- 문제: 0001의 "Public profiles viewable" select using(true) 정책으로
--       anon key만으로 전 회원 email·name·job·admin_note 조회 가능.
-- 해결: select 정책을 본인+관리자로 좁히고, 댓글/리뷰 작성자 표시용
--       안전 컬럼(id, name, avatar_url)만 담은 공개 뷰로 분리.
--
-- 적용: 대시보드 SQL Editor에서 멱등 실행 (db push 금지 — 이력 드리프트).
-- 순서: STEP 1(뷰 생성)은 언제 적용해도 안전(추가만).
--       STEP 2(정책 교체)는 public_profiles를 읽는 프론트 배포 *후* 적용
--       해야 댓글/리뷰 작성자명이 잠시라도 끊기지 않음.
-- ============================================================

-- STEP 1: 공개 프로필 뷰 (owner 권한으로 실행되어 RLS 우회 — 안전 컬럼만 노출)
create or replace view public.public_profiles as
  select id, name, avatar_url from public.profiles;

alter view public.public_profiles set (security_invoker = false);

grant select on public.public_profiles to anon, authenticated;

-- STEP 2: profiles select 정책 교체 (본인 + 관리자만)
drop policy if exists "Public profiles viewable" on public.profiles;
drop policy if exists "Profiles select own or admin" on public.profiles;
create policy "Profiles select own or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- PostgREST 스키마 캐시 갱신 (뷰 임베드 인식)
notify pgrst, 'reload schema';
