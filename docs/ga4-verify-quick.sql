-- ============================================================
-- 빠른 검증.  ⚠️ 순서 중요:
--   STEP 0) 먼저 브라우저(http://localhost:3000)에서 클릭으로 이벤트를 만든다.
--           예) 홈 열기 → 케이스 상세 클릭 → ♡저장/좋아요 → 뒤로가기(=dwell 발화)
--              → 이북 상세 클릭 → 홈 무료배너 "무료로 받기" 클릭
--   STEP 1) 그 다음 아래 쿼리를 실행 (각 블록 드래그 선택 후 Cmd+Enter).
-- ============================================================

-- [1] 오늘 하루 이벤트 종류별 — 어떤 태깅이 찍혔는지 한눈에
--   기대: pv, dwell, cta_click, save, react_up, share, deep_read, scroll, search 등
select event_type, count(*) as cnt
from events
where created_at > now() - interval '1 day'
group by event_type
order by cnt desc;


-- [5] 식별자 부착 확인 — "방금(10분 내) 클릭한" 이벤트 기준.
--   with_anon = with_session = total 이면 100% 부착 ✅
--   (오늘 변경 이전의 옛 이벤트엔 id가 없으니, 꼭 '방금 클릭한' 10분 범위로 본다)
select
  count(*)                                          as total,
  count(*) filter (where metadata ? 'anonymous_id') as with_anon,
  count(*) filter (where metadata ? 'session_id')   as with_session
from events
where created_at > now() - interval '10 min';
