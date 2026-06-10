-- check_vault.sql — Vault 비밀값 진단
-- 목적: send_ebook_url / service_role_key 가 decrypted_secrets에 왜 안 보이는지 원인 파악.
-- 사용: SQL Editor에서 아래 3개 쿼리를 "하나씩" 실행하고 결과를 각각 캡처.

-- A) 원본 secrets 테이블 (암호화 전 메타). send_ebook_url, service_role_key 가 여기 있는지 + 이름에 공백 끼었는지 확인
select id, '['||name||']' as name_bracketed, key_id, created_at
from vault.secrets
order by created_at;

-- B) 복호화 뷰 전체 (필터 없이). 어떤 게 복호화돼서 나오고 어떤 게 빠지는지 비교
select '['||name||']' as name_bracketed, length(decrypted_secret) as len
from vault.decrypted_secrets
order by name;

-- C) 이름 중복 여부
select name, count(*) as cnt
from vault.secrets
group by name
having count(*) > 1;
