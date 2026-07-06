# 마이그레이션 규칙 (caselab 본가)

이 repo는 admin(caselab_admin)과 **같은 Supabase prod(jsresrgzrsxotopfzpos)를 공유**한다.
원격 마이그레이션 이력(supabase_migrations)은 실제 적용 상태와 다르다(초기 일부만 기록,
이후는 대시보드 단발 적용). 그래서:

## 절대 규칙

1. **`supabase db push` 금지.** 이력이 어긋난 상태에서 push하면 다른 내용의
   같은 번호가 조용히 skip되거나 의도치 않은 DDL이 적용될 수 있다.
2. DDL 적용은 **대시보드 SQL Editor에서 파일 내용을 멱등 실행**
   (`if not exists` / `drop ... if exists` 선행). 이 디렉터리의 파일은 기록용 정본.

## 번호 네임스페이스 (2026-07-06 분리)

| 범위 | 소유 | 비고 |
|---|---|---|
| `0001`~`0999` | **본가 전용** | 새 본가 DDL은 이 범위에서 순번 증가 |
| `1000`~ | **admin 전용** | 이 repo에 1xxx 파일을 만들면 CI(migrations-guard)가 실패한다 |

admin의 0001~0011은 본가의 바이트 동일 사본(공유 베이스)이며, admin 전용 DDL은
1012부터 시작한다(구 0012~0016 리네임). 스키마 전체를 재현하려면 두 repo를 합쳐야
한다는 점에 유의 — 본가 0001~0999 + admin 1xxx.
