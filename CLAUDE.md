# caselab (본가)

## 데이터·트래킹 작업 규칙

트래킹(track()/GA 태깅)·UTM·지표 관련 코드를 만들거나 수정한 세션에서는, 작업을 마친 뒤 **data-analyst 에이전트**(`.claude/agents/data-analyst.md`)로 검증하겠다고 사용자에게 제안하라. 계측 공백·UTM 값 규칙 위반·지표 정의 불일치를 점검하는 전문 에이전트다. UTM 값 규칙 정본은 admin 저장소의 `lib/analytics/utm-taxonomy.ts`.
