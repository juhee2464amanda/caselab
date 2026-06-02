# 케이스랩 출시 런북 (Launch Runbook)

> 작성: 2026-05-30 · 최종 갱신: 2026-06-01
> 대상 독자: 클라우드 배포 처음인 운영자 1인
> 모드: **돈 0원 출시** (도메인·이메일 발송·AI 모두 출시 후 도입)

## 이 문서를 읽는 법

- **순서대로 따라가기**. 각 “Day”는 앞 단계에 의존하니 건너뛰지 마세요.
- 각 Day마다 4가지 블록 반복:
  - ✅ **끝났을 때 동작해야 하는 것**
  - 📋 **체크리스트** — 클릭/입력할 항목
  - 🚨 **의사결정 트리거** — Claude(저)에게 “Day N 시작/막힘” 알려주시면 옵션 띄워드려요
  - 🛠️ **자주 막히는 지점**
- 외부 콘솔 작업의 자세한 체크리스트는 [GitHub Issue #1~#10](https://github.com/juhee2464amanda/caselab/issues) 참고. 런북은 화면 흐름·의사결정 중심.

---

## ✅ 최종 결정값 한눈에 (2026-06-01 확정)

| 항목 | 값 | 활성 시점 |
|---|---|---|
| 도메인 | **Vercel 무료 서브도메인** (예: `caselab.vercel.app`) | Day 10 Vercel 가입 시 결정 |
| 운영자 메일 | `caselab.kr@gmail.com` | Day 0 (이미 보유) |
| 사이트 발송 이메일 | **Gmail SMTP** (발신: `caselab.kr@gmail.com`, 일 500건 무료) | Day 9 |
| Cloudflare | **사용 안 함** | — |
| Resend | **사용 안 함** (Gmail SMTP로 대체) | — |
| Anthropic API (AI 초안) | **출시 후 도입 예정** | — |
| Supabase | 사용 (Free) | Day 1 |
| Vercel | 사용 (Hobby 무료) | Day 10 |
| Google OAuth | 사용 | Day 2 |
| Kakao OAuth | 사용 (선택) | Day 2 |
| GA4 | 사용 (무료) | Day 8 |
| 첫 콘텐츠 | 후보 1번 “빈 입력칸…” | Day 3 |

**연간 운영비 = $0**. 사이트가 자리잡고 매출/필요 생기면 그때 도메인·Resend·Anthropic 도입.

---

## 준비물 (Day 0)

| 항목 | 상태 |
|---|---|
| 노트북 | ☐ |
| Gmail (`caselab.kr@gmail.com`) | ✅ 보유 |
| Google 계정 + Kakao 계정 (운영자 본인 — 일반 사용용 OK) | ☐ |
| 인스타 프로필 편집 권한 | ☐ |
| GitHub `juhee2464amanda/caselab` 권한 | ☐ |
| 로컬 클론 + `npm install --legacy-peer-deps` 성공 | ☐ |

> 💡 **이번 모드는 결제카드 등록 안 해도 됨**. 모든 외부 서비스가 무료 플랜만 사용.

---

## Day 0 — 가입만 (5분)

### ✅ 끝났을 때
- Supabase, Vercel 가입만 완료 (가입 메일은 `caselab.kr@gmail.com`)
- 다음 Day들에서 바로 진입 가능

### 📋 체크리스트
- [ ] [Supabase Sign up](https://supabase.com/dashboard) — Google 로그인 가능
- [ ] [Vercel Sign up](https://vercel.com/signup) — GitHub 로그인 권장 (Day 10에 GitHub 연결 필요하니 미리 연결)
- [ ] 둘 다 무료 플랜으로 가입. 결제 카드 등록 안 해도 됨.

### 건너뛰는 가입 (이번 모드)
- ❌ Cloudflare — 도메인 사용 안 하니까 가입 X
- ❌ Anthropic — AI 초안 출시 후 도입
- ❌ Resend — 이메일 발송 출시 후 도입
- ❌ Kakao 디벨로퍼스 (Day 2 결정에 따라 가입)
- ❌ Google Cloud Console (Day 2)

---

## Day 1 — Supabase 셋업 ([Issue #1](https://github.com/juhee2464amanda/caselab/issues/1))

### ✅ 끝났을 때
- 프로젝트 URL/Key 3종 확보 → `.env.local`에 등록
- 12개 테이블 + RLS + 뷰 2개 모두 생성됨
- `ebooks` Storage 버킷 비공개로 존재 (출시 후 PDF 업로드 예정)
- `npm run dev`에서 로그인 시도 시 Supabase 응답 옴 (아직 OAuth 미설정이라 실패하지만 “연결 자체는 됨”)

### 📋 체크리스트
1. [supabase.com/dashboard](https://supabase.com/dashboard) → New Project
   - Project name: `caselab-prod`
   - Database password: **반드시 비밀번호 관리자에 저장**
   - Region: **Northeast Asia (Seoul)** ⚠️
   - Plan: Free
2. 프로젝트 생성 후 2~3분 대기 → Settings → API에서:
   - **Project URL** → `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ 클라이언트 노출 금지
3. SQL Editor → New query → `supabase/migrations/0001_init.sql` 전체 복붙 → Run
4. Storage → New bucket
   - Name: `ebooks`
   - Public: **OFF**
5. (선택, Day 2에 Kakao 가는 경우) Supabase CLI:
   ```bash
   brew install supabase/tap/supabase
   supabase login
   supabase link --project-ref <your-ref>
   ```

### 🔍 검증
SQL Editor:
```sql
select count(*) from public.profiles;      -- 0
select count(*) from public.contents;      -- 0
select count(*) from public.admin_stats;   -- 1행
```
로컬: `npm run dev` → http://localhost:3000 200

### 🛠️ 막히는 곳
- **migration 중 ERROR**: 0001_init.sql 전체를 한 번에 실행해야 trigger 의존성 OK
- **Region 잘못 선택**: Free는 1프로젝트라 신중히

---

## Day 2 — Google + Kakao 인증 ([Issue #2](https://github.com/juhee2464amanda/caselab/issues/2), [#3](https://github.com/juhee2464amanda/caselab/issues/3))

### ✅ 끝났을 때
- `/login`에서 Google 버튼 → 본인 계정 → `/onboarding` 강제
- (선택) Kakao 동일 흐름
- `profiles` 테이블에 본인 row 보임

### 🚨 의사결정 트리거
**Kakao OAuth 도입할지?** — 권장: Day 2엔 Google만, Kakao는 출시 직전에. 단계 줄임.

### 📋 Google OAuth (최소)
1. [console.cloud.google.com](https://console.cloud.google.com) → 새 프로젝트 `caselab-prod`
2. APIs & Services → OAuth consent screen → External, 앱 이름 `Caselab`, 지원 이메일 본인
3. Scopes: `email`, `profile`, `openid`
4. Credentials → Create Credentials → OAuth client ID
   - Type: Web application
   - Authorized redirect URIs:
     - `https://<supabase-project-ref>.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback`
5. Supabase Dashboard → Authentication → Providers → Google → Enable → 키 입력 → Save

### 📋 Kakao OAuth (선택)
Issue #3 본문 참고 + Edge Function 배포 필요. Day 0에서 Cloudflare 안 쓰니까 Kakao OAuth 셋업도 Day 10 이후로 미뤄도 OK.

### 🔍 검증
- `npm run dev` → `/login` → Google 로그인 → `/onboarding`
- Supabase Studio → profiles → 본인 row ✓

---

## Day 3 — Admin 부여 + 첫 콘텐츠 작성 시동

### ✅ 끝났을 때
- 본인 계정으로 `/admin` 접근 가능
- `/admin/contents/new` 폼이 뜨고 “초안 작성 워크플로우” 사이드바 보임
- Claude Max로 첫 콘텐츠 초안 1편 작성 완료

### 📋 Admin 부여
Supabase Dashboard → SQL Editor:
```sql
update public.profiles
set role = 'admin', onboarded = true
where email = 'caselab.kr@gmail.com';
```

### 📋 Claude Max로 첫 콘텐츠 초안
1. claude.ai 새 대화 열기
2. 시스템 프롬프트(아래 “톤·스키마 프롬프트” 참고)
3. 주제 입력: “빈 입력칸 앞에서 머리가 하얘질 때 — 같이 첫 한 줄 쓰는 5단계”
4. 본문 JSON 받기 (kind: case, framework 5단계, customization 4개 포함)
5. 로컬 `/admin/contents/new` → 본문 JSON 영역에 붙여넣기
6. 메타·태그·페르소나·시간 라벨 채우기
7. 발행 게이트 자동 6 통과 확인 → 발행

### 톤·스키마 프롬프트 (Claude Max에 복붙용)
```
당신은 케이스랩(caselab) 매거진의 운영자 어시스턴트입니다.
케이스랩은 한국 직장인 5인 페르소나(기획자/전략팀/1인사업/영업팀장/스타트업 마케터)에게
"일을 푸는 framework × 단계별 AI 실행 × 솔직한 후기"를 1인칭 톤으로 제공.

다음 JSON 스키마와 정확히 일치하는 객체만 반환:
{
  "kind": "case",
  "essence": [{"type":"text","markdown":"..."}],
  "framework": [
    {
      "name": "Step 1...",
      "description": "...",
      "intent": "이 단계의 의도 한 줄",
      "blocks": [
        {"type":"intent","step":1,"text":"의도 다시"},
        {"type":"text","markdown":"..."},
        ... (role-card, prompt, result-compare, evaluation 등)
      ]
    },
    ... (총 4~6 step)
  ],
  "failures": [...],   // 별로였던 사례 — 전체 분량의 30% 이상
  "review": [...],     // 솔직한 후기
  "customization": ["1단계 ...","2단계 ...","3단계 ...","4단계 ..."]
}

규칙:
- 한국어, 1인칭 ("저도 처음엔...", "이게 진짜 별로였던 게...")
- 각 step의 intent 한 줄 명확히
- failures 분량 ≥ 30%
- customization 정확히 4개
- 광고/유료 강의 링크 X

주제: <여기 입력>
요약: <여기 입력>
```

### 🔍 검증
- `/admin/contents/new` 폼 → JSON 영역에 Max 응답 복붙
- 우측 사이드바 “발행 게이트 자동 6” 모두 ✓
- 수동 확인 3개 체크 → 발행
- `/cases` 가서 발행한 콘텐츠 확인

### 🛠️ 막히는 곳
- **JSON parse 에러**: Max가 가끔 ```json ... ``` 코드 블록으로 감싸요. 백틱 빼고 순수 JSON만 붙여넣기
- **failures 분량 < 30%**: 별로였던 사례를 더 길게 적게 요청

---

## Day 4~7 — 콘텐츠 10개 작성

### ✅ 끝났을 때
- `status='published'` 콘텐츠 10개
- 메인 페이지 Hero + 두 트랙 카드 영역 안 비어 보임
- 페르소나 5명 각각 흥미가지는 콘텐츠 최소 1개씩

### 📋 워크플로우 (콘텐츠 1개당 1~2시간)
1. Claude Max에서 새 대화 + 위 “톤·스키마 프롬프트”
2. 주제·요약 입력 → JSON 받기
3. JSON 검수 + 1인칭 톤 다듬기
4. `/admin/contents/new` → 메타·태그·페르소나·시간 채우기
5. 발행 게이트 자동 6 통과 확인 → 발행

### 🛠️ 막히는 곳
- **AI 톤이 일반론적**: 주제를 더 구체적인 1인칭으로 — “AI를 잘 쓰는 법” → “저도 분명 시간 줄이려고 AI 썼는데 오히려 두 배 걸렸던 이야기”
- **자동저장 안 됨**: localStorage 저장. 같은 브라우저면 복구됨

---

## Day 8 — 보강 코드 검수 + GA4 ([Issue #7](https://github.com/juhee2464amanda/caselab/issues/7))

이전 turn에 코드 추가 끝남. 운영자 작업 = GA4 ID 등록 + 텍스트 검수.

### ✅ 끝났을 때
- 브라우저 탭에 favicon
- `/legal/privacy`, `/legal/terms`, `/robots.txt`, `/sitemap.xml`, `/opengraph-image` 모두 200
- GA4 측정 ID 등록 후 동의하면 실시간에 본인 방문 보임

### 🚨 의사결정 트리거
**쿠키 배너 표시?** — 권장: 표시 + 동의 후 GA4. 한국 가이드 권고.

### 📋 GA4
1. [analytics.google.com](https://analytics.google.com) → 관리 → 속성 만들기
   - 속성 이름: `Caselab`
   - 시간대: Asia/Seoul
2. 데이터 스트림 → 웹 → `http://localhost:3000` (도메인 결정 전이라 임시) → 측정 ID 복사
3. `.env.local`에 `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...`

### 📋 약관 검수
- `app/(public)/legal/privacy/page.tsx` — “운영자: 개인 운영자” 부분 본인 이름 또는 운영명으로 변경
- `app/(public)/legal/terms/page.tsx` 본문 읽기

### 🔍 검증
```bash
npm run dev
open http://localhost:3000/legal/privacy   # 200
open http://localhost:3000/robots.txt
open http://localhost:3000/sitemap.xml
```

---

## Day 9 — Gmail SMTP + 전자책 발송 ([Issue #5](https://github.com/juhee2464amanda/caselab/issues/5))

### ✅ 끝났을 때
- Gmail App Password 발급 + Supabase secrets 등록 완료
- `send-ebook` Edge Function 배포
- 본인 이메일로 전자책 주문 → 1분 내 PDF 다운로드 링크 도착

### 📋 Gmail App Password 발급 (~3분)
1. [myaccount.google.com/security](https://myaccount.google.com/security) → 본인 Gmail(`caselab.kr@gmail.com`) 로그인
2. **2단계 인증 ON** (이미 ON이면 패스)
3. 동일 페이지에서 검색 또는 [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. App name: `Caselab` → Create
5. 16자리 비밀번호 표시됨 → **반드시 복사·메모** (한 번만 표시)

### 📋 Supabase Edge Function 배포 (~5분)
```bash
# Day 1에서 supabase login + link 이미 했다는 전제
supabase secrets set GMAIL_USER=caselab.kr@gmail.com
supabase secrets set GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
supabase secrets set SITE_URL=https://<your>.vercel.app   # Day 10 후 갱신
supabase functions deploy send-ebook
```

### 📋 전자책 PDF 업로드 (첫 책 한 번)
1. PDF 준비 (직접 작성 또는 콘텐츠 10편 합본 PDF)
2. Supabase Dashboard → Storage → ebooks 버킷 → Upload → `ebook-volume-1.pdf`
3. Table Editor → products → Insert:
   - `slug`: `volume-1`
   - `title`: `AI로 일이 풀린 케이스 30개`
   - `price`: `0`
   - `pdf_path`: `ebook-volume-1.pdf`
   - `status`: `active`

### 🔍 검증
1. `/ebooks/volume-1/order` → 본인 이름·이메일 입력 → 신청
2. Supabase Studio → purchases → `status='pending'` row 확인
3. 수동 트리거:
   ```bash
   curl -X POST "https://<project>.supabase.co/functions/v1/send-ebook" \
     -H "Authorization: Bearer <service_role_key>" \
     -H "Content-Type: application/json" \
     -d '{"purchase_id": "<위 row의 id>"}'
   ```
4. 본인 메일함에서 1분 내 도착 확인 (**스팸 폴더도 꼭 확인**). 발신: `caselab.kr@gmail.com`
5. PDF 다운로드 링크 클릭 → 다운로드 성공
6. Supabase Studio에서 row `status='sent'`, `sent_at` 채워짐 확인

### 🛠️ 자주 막히는 지점
- **App Password 발급 안 됨**: 2단계 인증 먼저 ON. 개인 Gmail이면 OK (업무용 Workspace는 관리자 정책 따라 막힐 수 있음)
- **smtp.gmail.com 인증 실패**: App Password 16자리 정확히 입력 (공백 X). 일반 Gmail 비밀번호 X
- **스팸 폴더로 빠짐**: 본인 inbox에서 “스팸 아님” 표시 + 발신주소 주소록 추가. 첫 발송은 흔함
- **일 500건 한도 초과**: 첫해엔 안 부딪힐 가능성 높지만, 도달 시 자체 도메인 + Resend로 전환 검토

### Gmail SMTP의 트레이드오프 (인지하고 진행)
- 발신: `caselab.kr@gmail.com` (도메인 발신이 아니라 “개인 메일” 느낌)
- 사용자 inbox에 “외부 발송” 또는 “이 메일은 처음 받는 발신자” 알림 표시 가능
- 일부 회사 메일 서버(outlook)에서 스팸 폴더로 분류될 수 있음
- → 대신 **연 운영비 $0** + 즉시 사용 가능. 첫해 운영 데이터 보고 도메인 전환 결정.

---

## Day 10 — Vercel 배포 ([Issue #6](https://github.com/juhee2464amanda/caselab/issues/6))

### ✅ 끝났을 때
- `https://caselab.vercel.app` (또는 Vercel이 자동 부여한 서브도메인) 메인 페이지 200
- HTTPS 자동 발급
- 로그인 + 콘텐츠 발행 → 1분 내 메인 반영

### 🚨 의사결정 트리거
**Vercel 프로젝트 이름** — 권장: `caselab` (가능하면). 점유 시 `caselab-mag` 또는 `caselab-kr` 등.

### 📋 Vercel
1. [vercel.com](https://vercel.com) → New Project → `juhee2464amanda/caselab` Import
2. Framework: Next.js (자동)
3. **Install Command 변경**: `npm install --legacy-peer-deps` ⚠️ 필수
4. Environment Variables 등록 (Production·Preview·Development 모두):
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_SITE_URL=https://<your-vercel-subdomain>.vercel.app
   DRAFT_PREVIEW_SECRET            # openssl rand -hex 32
   NEXT_PUBLIC_GA_MEASUREMENT_ID
   ```
   (Resend·Anthropic·Kakao 변수는 등록 안 함 — 출시 후)
5. Deploy → 2~3분
6. Settings → Domains → 기본 `xxx.vercel.app` 도메인 확인. 마음에 안 들면 프로젝트 rename
7. **`NEXT_PUBLIC_SITE_URL`은 최종 서브도메인으로 업데이트** → Redeploy

### 📋 다른 콘솔 URL 업데이트
- **Supabase**: Authentication → URL Configuration
  - Site URL: `https://<your>.vercel.app`
  - Redirect URLs: `https://<your>.vercel.app/auth/callback`
- **Google OAuth**: Cloud Console → OAuth client → Authorized redirect URIs에 production URL 추가

### 🔍 검증
```
https://<your>.vercel.app/             # 200 + Hero
https://<your>.vercel.app/login        # 200 + 로그인 가능
https://<your>.vercel.app/admin        # 비로그인 → /login redirect
https://<your>.vercel.app/sitemap.xml  # 200
```

---

## Day 11 — 페르소나 검증 12개 ([Issue #10](https://github.com/juhee2464amanda/caselab/issues/10))

### 자동 6 (각 콘텐츠 발행 시 Admin Linter 통과 확인)
- [ ] 1. 읽기/적용 시간 라벨
- [ ] 2. 직무 태그 ≥ 1 + 5/10/30분 칩 필터
- [ ] 3. step별 IntentBox 수 = step 수
- [ ] 4. FailureSection ≥ 30%
- [ ] 5. CustomizationChecklist 4개
- [ ] 6. 광고 외부 링크 0

### 수동 (배포 사이트에서 직접)
- [ ] 7. 운영자 1인칭 톤
- [ ] 8. RelatedSidebar/Carousel 작동
- [ ] 9. 모바일에서 본문/CommentThread/ShareButtons
- [ ] 10. PersonaCoverageBadge가 콘텐츠 실효용과 일치

### 운영 원칙
- [ ] 11. 콘텐츠 10편 발행 완료
- [ ] 12. 인스타 → `/links` → 콘텐츠 동선 1회 직접 테스트 (모바일)

---

## Day 12 — 출시

### ✅ 끝났을 때
- 인스타 프로필 “웹사이트” 칸에 `https://<your>.vercel.app/links` URL
- 인스타 첫 공지 포스트 발행

### 📋
1. 인스타 프로필 편집 → 웹사이트 URL
2. 첫 포스트 (Reels 또는 캐러셀) — 콘텐츠 1편 예고
3. 모니터링:
   - Supabase Logs (실시간 에러)
   - Vercel Deployments → Logs

### 첫 24시간 KPI
- `events.deep_read` ≥ 5건
- 가입자 ≥ 3명
- 에러 로그 0건

---

## 출시 이후 — 도입 로드맵

| 항목 | 도입 트리거 |
|---|---|
| Kakao OAuth | 한국 사용자 비중 70%↑ 확인 시 |
| 커스텀 도메인 | 인스타 유입 안정화 + 브랜드 강화 필요 시 |
| Resend 이메일 발송 | 전자책 신청 누적 30건 이상 |
| Anthropic AI 초안 | 콘텐츠 월 5건 이상 + Max 복붙 피로 |
| Lighthouse 90+ 폴리싱 | 데이터로 사용자 이탈 지점 확인 후 |
| 카드뉴스 자동 생성 | 출시 +1개월 |
| Brunch·LinkedIn 외부 채널 | 출시 +3~6개월 |

---

## 부록 — 환경변수 체크리스트

| 변수 | 어디서 | Day | 비고 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API | Day 1 | 필수 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase API | Day 1 | 필수 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase API | Day 1 | 필수 |
| `NEXT_PUBLIC_SITE_URL` | Vercel 서브도메인 | Day 10 | 필수 |
| `DRAFT_PREVIEW_SECRET` | `openssl rand -hex 32` | Day 10 | 필수 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 | Day 8 | 선택 |
| `KAKAO_REST_API_KEY` (Edge Function secret) | Kakao 디벨로퍼스 | Day 2 (선택) | Kakao 도입 시 |
| `KAKAO_CLIENT_SECRET` (Edge Function secret) | Kakao 디벨로퍼스 | Day 2 (선택) | 동일 |
| `GMAIL_USER` (Edge Function secret) | `caselab.kr@gmail.com` | Day 9 | 필수 (전자책 발송) |
| `GMAIL_APP_PASSWORD` (Edge Function secret) | Google 계정 → 보안 → 앱 비밀번호 | Day 9 | 필수 |
| `ANTHROPIC_API_KEY` | Anthropic Console | **출시 후** | 보류 |
| `NEXT_PUBLIC_AI_DRAFT_ENABLED` | `true` | **출시 후** | 보류 (AI 초안 버튼 토글) |

---

> 막힐 때 Claude에게 “Day N 막혔어요, {증상}” 형식으로 알려주시면 그 시점 옵션 또는 트러블슈팅을 같이 봐드릴게요.
