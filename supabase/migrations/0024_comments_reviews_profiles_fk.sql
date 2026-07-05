-- ============================================================
-- 0024_comments_reviews_profiles_fk — 댓글/리뷰 작성자 임베드 FK
-- 문제: comments.user_id·reviews.user_id가 auth.users만 참조해서
--       PostgREST가 comments→profiles(→public_profiles) 관계를 못 찾음
--       (PGRST200). 작성자 이름 임베드는 처음부터 동작한 적 없던 잠복 버그
--       — prod 댓글·리뷰 0건이라 미발견 상태였음.
-- 해결: profiles(id)로의 FK를 추가(같은 컬럼에 auth.users FK와 공존).
--       profiles는 가입 트리거로 auth.users와 1:1이라 데이터 위반 없음.
--       FK가 생기면 public_profiles 뷰 임베드도 자동 인식됨.
--
-- 적용: 대시보드 SQL Editor에서 멱등 실행 (db push 금지 — 이력 드리프트).
-- ============================================================

alter table public.comments
  drop constraint if exists comments_user_id_profiles_fkey;
alter table public.comments
  add constraint comments_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.reviews
  drop constraint if exists reviews_user_id_profiles_fkey;
alter table public.reviews
  add constraint reviews_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- PostgREST 스키마 캐시 갱신 (임베드 관계 인식)
notify pgrst, 'reload schema';
