-- 0017_comments_polymorphic.sql
-- Date: 2026-06-16
-- 목적: 댓글(comments)을 콘텐츠(case/trend) + 도구(tool) 폴리모픽 타깃으로 확장.
--   · 정책 변경: 상세페이지는 리뷰(별점) 대신 댓글만. 단, ebook(product) 리뷰는 유지(0016 그대로).
--   · 도구 상세에도 댓글을 달 수 있도록 comments.tool_id 추가.
-- 호환: 기존 행은 모두 content_id 보유 → one-target 제약 자동 충족.
-- 실행: Supabase Dashboard(Caselab-prod) → SQL Editor → 본 파일 전체 Run.
--       (프로젝트 관행: db push 대신 SQL Editor 수동 실행.)

-- content_id를 nullable로 완화하고 tool_id 추가
alter table public.comments
  alter column content_id drop not null;

alter table public.comments
  add column if not exists tool_id uuid references public.tools on delete cascade;

-- 타깃은 콘텐츠/도구 중 정확히 하나
alter table public.comments
  add constraint comments_one_target check (
    (content_id is not null)::int + (tool_id is not null)::int = 1
  );

create index if not exists idx_comments_tool on public.comments(tool_id, created_at desc);

-- RLS는 user_id/status 기반이라 변경 불필요(content_id 의존 정책 없음).
