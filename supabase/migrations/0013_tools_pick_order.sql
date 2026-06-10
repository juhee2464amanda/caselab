-- 0013_tools_pick_order.sql
-- Date: 2026-06-09
-- 관련 PR: feat(prompts) — 바로 쓰는 프롬프트 "에디터 PICK" 상단노출
-- 목적: tools에 pick_order 컬럼 추가. 운영자가 특정 프롬프트를 골라(pick)
--       공개 /prompts 상단 PICK 밴드에 노출하기 위함.
--       NULL = 일반(최신순 누적), 숫자 = PICK 밴드 노출 + 작을수록 앞.
--       category='prompt' 외 다른 tools(도구·가이드)에도 향후 재사용 가능하도록 tools에 직접 추가.
--       기존 데이터 영향 0 (nullable). ADD COLUMN IF NOT EXISTS로 멱등성 보장.

ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS pick_order integer;

COMMENT ON COLUMN public.tools.pick_order IS
  '에디터 PICK 상단노출 순서. NULL=일반(최신순), 숫자=PICK 밴드 노출(작을수록 앞). 공개 /prompts에서 사용.';

-- PICK 항목만 부분 인덱스 (NULL 다수 행은 색인 제외 → 작고 빠름)
CREATE INDEX IF NOT EXISTS idx_tools_pick_order
  ON public.tools (category, pick_order)
  WHERE pick_order IS NOT NULL;

-- 실행 방법:
--   1. Supabase Dashboard → SQL Editor
--   2. 본 파일 내용 전체 복사 → Run
--   3. tools.pick_order 컬럼 + idx_tools_pick_order 인덱스 확인
--   4. caselab_admin/ ToolForm에 pick_order 입력 필드 추가 (별도 작업 — admin repo)
