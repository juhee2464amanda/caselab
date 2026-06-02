# Kakao OAuth Edge Function — 배포 가이드 (Day 11)

> 계획서 v2 D10: Kakao OAuth 출시 직전 도입
> 함수 코드: `index.ts` (이미 작성됨, 배포만 남음)
> 런북 Day 11 에 흡수 예정

---

## 사전 준비 (~10분)

### A. Kakao Developers 콘솔
1. https://developers.kakao.com → 내 애플리케이션 → **애플리케이션 추가하기**
   - 앱 이름: `Caselab`
   - 회사명: (개인) 본인 이름 또는 운영명
2. 앱 생성 후 → **앱 키** 메뉴
   - **REST API 키** 복사 (`KAKAO_REST_API_KEY` 로 사용)
3. **제품 설정 → 카카오 로그인** → 활성화 ON
4. **카카오 로그인 → Redirect URI** 등록:
   ```
   https://<your-project-ref>.supabase.co/functions/v1/kakao-oauth
   ```
5. **제품 설정 → 카카오 로그인 → 동의항목**
   - 닉네임: 필수 동의
   - 프로필 사진: 선택 동의
   - 카카오계정(이메일): 선택 동의 (없으면 placeholder 이메일 생성됨)
6. **보안 → Client Secret 코드** → 생성 → **활성화 상태: ON**
   - 생성된 키 복사 (`KAKAO_CLIENT_SECRET` 로 사용)

### B. Supabase
- Day 1 에서 이미 `supabase login` + `supabase link --project-ref <ref>` 완료한 상태 전제

---

## 배포 (~3분)

```bash
# 1) Secrets 등록 (Edge Function 환경변수)
supabase secrets set KAKAO_REST_API_KEY=<위 A-2 의 REST API 키>
supabase secrets set KAKAO_CLIENT_SECRET=<위 A-6 의 Client Secret>
supabase secrets set SITE_URL=https://<your>.vercel.app

# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 는 자동 주입되므로 별도 등록 X

# 2) 함수 배포
supabase functions deploy kakao-oauth

# 3) 배포 확인
supabase functions list
# kakao-oauth | ACTIVE | https://<ref>.supabase.co/functions/v1/kakao-oauth
```

---

## 클라이언트 연결

`app/login/page.tsx` (또는 LoginButton 컴포넌트) 에서 카카오 버튼 클릭 시:

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const kakaoLoginUrl = `${supabaseUrl}/functions/v1/kakao-oauth?next=${encodeURIComponent('/')}`;
// <Link href={kakaoLoginUrl}>Kakao 로그인</Link>
```

(별도 Supabase Provider 등록 불필요 — Custom OAuth proxy 패턴)

---

## 검증

1. 시크릿 창에서 `/login` → **Kakao 로그인** 클릭
2. Kakao 로그인 화면 → 동의 → 콜백
3. `/auth/callback?token_hash=...` 자동 처리 → `/onboarding` 강제 (신규)
4. Supabase Studio → `profiles` 테이블에 신규 row 확인
   - `email`: kakao 동의 시 실제 이메일, 미동의 시 `kakao-<id>@users.caselab.local`
   - `name`: 카카오 닉네임
   - `avatar_url`: 카카오 프로필 사진

---

## 자주 막히는 지점

- **`KOE006` 또는 `redirect_uri mismatch`**: Kakao 콘솔 Redirect URI 가 `https://<ref>.supabase.co/functions/v1/kakao-oauth` 와 정확히 일치하는지 확인 (http vs https, trailing slash 없음)
- **`KOE320` Client Secret 오류**: A-6 단계 Client Secret 상태 = "사용함" 인지 확인
- **이메일 없는 사용자**: 동의 거부 시 `kakao-<id>@users.caselab.local` placeholder 이메일 생성됨. profiles.email 도 같은 값. 이메일 발송이 필요한 흐름 (전자책 등) 은 동의 필수.
- **첫 사용자가 admin 권한 필요**: SQL Editor 에서 `update profiles set role='admin', onboarded=true where email='caselab.kr@gmail.com';` (이미 Day 3 에 했다면 skip)

---

## 출시 후 도입 트리거 (런북 부합)

§18.3 — Kakao OAuth 는 "한국 사용자 비중 70%+" 확인 시 가속화. 출시 직전 (Day 11) 도입하면 첫날부터 측정 가능.
