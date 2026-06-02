# 케이스랩 (Caselab) — 04 개발 계획서 v2

> 작성일: 2026-05-28
> 기획서: `docs/03_one_page_spec_v3.md` (MVP v3 확정)
> 디자인 목업: `docs/design_mockup/` (user 20개 + admin 9개 + supabase-schema.sql)
> 페르소나: `docs/personas.html` (5명 · 인터뷰 1568건 인용 기반)
> v1 → v2 변경: 점검 결과 반영 (jsonb 스키마 구체화, AI 초안 Phase 1로 이동, 댓글 MVP 포함, 누락 페이지 7개 추가, 페르소나 컴포넌트 보강 등)

---

## Context — 왜 만드는가

**문제**: "AI, 다들 쓰는데 나만 못 쓰는 것 같다"는 자기의심 루프에 빠진 5개 페르소나(기획자·전략팀·1인 사업·영업팀장·스타트업 마케터)가 공유하는 4가지 페인 — ① 그럴듯하지만 쓸 수 없는 결과물, ② AI가 오히려 시간을 잡아먹음, ③ "AI 티 나면 끝"의 사회적 시선, ④ 강의·콘텐츠 자체에 대한 깊은 불신.

**해결 가설**: 단순 프롬프트 모음이 아니라 **"일을 푸는 framework × 단계별 AI 실행 × 솔직한 후기"** 짝으로 풀어내는 매거진형 웹사이트. 콘텐츠 본문에 **시간 라벨·직무 태그·step별 의도(intent) 라벨·"별로였던 사례 ≥30%"·"본인 것으로 만드는 4단계"** 를 구조적으로 박아 페르소나 신뢰 임계를 통과한다.

**이 계획서의 결과물**: 4 Phase + 사이 스프린트(2.5)로 끊은 실행 가능 단계, Supabase 스키마 확정안, jsonb 블록 스키마, 페르소나 검증 체크리스트(자동 6 + 수동 4), Phase별 검증 방법.

---

## 결정 사항 요약

| 결정 | 선택 | v1 → v2 변경 |
|---|---|---|
| MVP 범위 | 목업 전부 포함 | 유지 |
| 콘텐츠 저장 | Supabase `contents.body` jsonb | jsonb 블록 스키마 구체 정의 추가 (4장) |
| 이메일 인프라 | Resend + Supabase Edge Function | PDF는 **Signed URL 다운로드**로 전환 |
| 개발 단계 | Phase 0~3 + 2.5 콘텐츠 스프린트 | **2.5 신설** (출시 콘텐츠 10개 작성) |
| AI 초안 버튼 | **Phase 1 포함** | v1에서 Phase 1.5로 미뤘던 것을 끌어올림 |
| 댓글 시스템 | **MVP 포함 (공개 댓글)** | v1엔 없었음 |
| 유료 전자책 PG | **출시 후 결정 (TBD)** | Phase 2/2.5 미정 |
| 첫 콘텐츠 | **계획서에 후보 3개 나열, 작업 시점 최종 결정** | 라인업 명시 |
| 언어 토글 (EN/KR) | **MVP 제외** | 목업의 GNB 토글은 비활성 |
| 다크 모드 | MVP 제외 | — |

---

## 1. 기술 스택

- **프레임워크**: Next.js 15 (App Router) + TypeScript + Tailwind CSS 3
- **UI 컴포넌트**: shadcn/ui (Dialog, Select, Textarea, Tabs, Toast) + Lucide Icons
- **폼**: React Hook Form + Zod (jsonb 직렬화)
- **렌더링**: 메인·트랙 목록·콘텐츠 상세 ISR + **On-Demand Revalidation** (`revalidateTag`), Admin·마이페이지 SSR/CSR
- **백엔드**: Supabase (Postgres + Auth + Storage + Edge Functions)
- **인증**: Google OAuth (Supabase 공식 Provider) · **Kakao OAuth (Custom: Supabase Auth + Edge Function 프록시)**
- **이메일**: Resend (API) + Supabase Edge Function 트리거 · **PDF는 Signed URL 다운로드**
- **분석**: GA4 (페이지뷰·클릭) + `events` 테이블 (비즈니스 이벤트: deep_read·copy·save·react)
- **AI 초안**: Anthropic Claude API (운영자 admin 폼) — Phase 1
- **호스팅**: Vercel + Supabase Cloud
- **에셋**: Pretendard, Noto Serif KR (Bunny Fonts)
- **마크다운/PDF**: remark + rehype (콘텐츠 자유 서술 블록), react-pdf (전자책 뷰어 — 필요 시)

---

## 2. 디자인 토큰 (기획서 기준으로 통일)

| 항목 | 적용 |
|---|---|
| 배경 | `#FAFAF7` |
| 본문 | `#0A0A0A` |
| 강조 | 인디고 `#1E40AF` |
| 제목 | Noto Serif KR |
| 본문 | Pretendard |

`tailwind.config.ts`의 `colors.bg`, `colors.ink`, `colors.accent` 글로벌 토큰화. 목업의 `#191F28`, `#3182F6`, Playfair Display는 폐기.

---

## 3. 라우팅 전체 맵

### 유저 (`app/(public)/`)
```
/                          메인 (Hero 캐러셀 + 두 트랙 최신 + 후보 투표 미리보기)
/cases                     실전 케이스 목록
/cases/[slug]              실전 케이스 상세 (4단)
/trends                    AI 트렌드 목록
/trends/[slug]             AI 트렌드 상세 (3단)
/tools                     자료실 — 도구 카탈로그
/tools/[slug]              도구 상세
/prompts                   자료실 — 프롬프트
/guides                    자료실 — 가이드
/ebooks                    전자책 목록
/ebooks/[slug]             전자책 상세 (3D 북 디스플레이)
/ebooks/[slug]/order       전자책 주문서 (무료 = 이메일 발송 / 유료 = TBD)
/topics                    "이런 거 어때요" 후보 투표 + 제안
/opinions/new              의견 보내기 (콘텐츠 상세 모달에서도 호출)
/search                    통합 검색
/links                     인스타 → 웹 진입용 랜딩 (linktree 대체)
/login                     로그인
/onboarding                첫 로그인 후 직무 선택 + 환영
/mypage                    리다이렉트 → /mypage/profile
/mypage/profile            프로필 편집
/mypage/saved              저장 목록
/mypage/liked              좋아요 목록
/mypage/subscriptions      구독 관리
/mypage/ebooks             구매한 전자책
/mypage/support            고객센터 (1:1 문의 + FAQ + 이력)
```

### Admin (`app/admin/`)
```
/admin                     콘텐츠 목록 (필터: 발행/초안/큐레이션)
/admin/contents/new        콘텐츠 작성 (2-track 폼 + AI 초안 버튼)
/admin/contents/[id]       편집
/admin/contents/[id]/preview?token=...   Draft Preview (JWT 일회용)
/admin/users               사용자 + 상세 슬라이드 패널
/admin/opinions            의견함 (읽음 표시, 답장)
/admin/comments            댓글 모더레이션
/admin/analytics           핵심 메트릭 + Funnel
/admin/ebooks              전자책 관리 + 배송 재발송
/admin/topics              후보 카드 관리
/admin/tools               자료실 카탈로그 CRUD (tools/prompts/guides 통합)
```

**제외 (MVP)**: 언어 토글(EN/KR), 다크 모드 — 목업 UI는 보이되 비활성/숨김.

---

## 4. 콘텐츠 jsonb 블록 스키마 (확정)

`contents.body`는 다음 Zod discriminated union을 직렬화한 jsonb. **Phase 1 시작 전 필수 확정**.

```typescript
// types/content.ts
const TimeMetaSchema = z.object({ readMin: z.number(), applyMin: z.number() });
const JobTagsSchema = z.array(z.enum(['planning','marketing','sales','solo','strategy','analysis']));

const PersonaCoverageSchema = z.array(z.enum(['A','B','C','D','E']));

// 공통 블록 타입
const TextBlockSchema = z.object({ type: z.literal('text'), markdown: z.string() });
const HeadingBlockSchema = z.object({ type: z.literal('heading'), level: z.union([z.literal(2), z.literal(3)]), text: z.string() });
const PromptBlockSchema = z.object({ type: z.literal('prompt'), label: z.string(), prompt: z.string() });
const ResultCompareBlockSchema = z.object({ type: z.literal('result-compare'), good: z.string(), bad: z.string() });
const RoleCardBlockSchema = z.object({ type: z.literal('role-card'), human: z.string(), ai: z.string() });
const IntentBoxBlockSchema = z.object({ type: z.literal('intent'), step: z.number(), text: z.string() });
const EvaluationBoxBlockSchema = z.object({ type: z.literal('evaluation'), good: z.string(), bad: z.string() });
const RebuttalBoxBlockSchema = z.object({ type: z.literal('rebuttal'), hypothesis: z.string(), counter: z.string() });
const FrameworkRefBlockSchema = z.object({ type: z.literal('framework-ref'), name: z.string(), url: z.string().optional() });
const ContextCardBlockSchema = z.object({ type: z.literal('context-card'), title: z.string(), fields: z.array(z.object({ label: z.string(), value: z.string() })) });
const FailureSectionBlockSchema = z.object({ type: z.literal('failure'), title: z.string(), blocks: z.array(z.lazy(() => BlockSchema)) });
const ChecklistBlockSchema = z.object({ type: z.literal('checklist'), title: z.string(), items: z.array(z.string()) });

const BlockSchema = z.discriminatedUnion('type', [
  TextBlockSchema, HeadingBlockSchema, PromptBlockSchema, ResultCompareBlockSchema,
  RoleCardBlockSchema, IntentBoxBlockSchema, EvaluationBoxBlockSchema, RebuttalBoxBlockSchema,
  FrameworkRefBlockSchema, ContextCardBlockSchema, FailureSectionBlockSchema, ChecklistBlockSchema,
]);

// 실전 케이스 4단
const CaseBodySchema = z.object({
  kind: z.literal('case'),
  essence: z.array(BlockSchema),        // 1. 본질
  framework: z.array(z.object({         // 2. Framework 단계 배열
    name: z.string(),
    description: z.string(),
    intent: z.string(),                 // step별 의도(intent) — 필수
    blocks: z.array(BlockSchema),       // human/ai/prompt/result 등
  })),
  failures: z.array(BlockSchema),       // 3. 별로였던 사례 (≥30% 분량 강제)
  review: z.array(BlockSchema),         // 4. 솔직한 후기
  customization: z.array(z.string()),   // "본인 것으로 만드는 4단계" (필수, 4개)
});

// AI 트렌드 3단
const TrendBodySchema = z.object({
  kind: z.literal('trend'),
  whats_new: z.array(BlockSchema),      // 1. 뭐가 나왔나
  experiment: z.array(BlockSchema),     // 2. 직접 실험
  verdict: z.object({                   // 3. 언제 쓸만/별로
    useful: z.array(BlockSchema),
    notUseful: z.array(BlockSchema),
  }),
});

const ContentBodySchema = z.discriminatedUnion('kind', [CaseBodySchema, TrendBodySchema]);
```

**렌더러**: `lib/content-render.tsx`에서 `block.type` 기반 컴포넌트 매핑. TypeScript 타입 안전성 + 발행 전 자동 게이트(7장)가 이 스키마를 검증.

---

## 5. Supabase 스키마 (확정안)

기존 `docs/design_mockup/supabase-schema.sql`을 확장. `likes`는 `reactions`로 흡수, 외래키와 `is_admin()` 함수 추가.

### 테이블

| 테이블 | 핵심 컬럼 | 비고 |
|---|---|---|
| `profiles` | id(uuid PK→auth.users), name, email, job, role('user'\|'admin'), **onboarded(bool)**, newsletter, avatar_url | onboarded 플래그 추가 — 미들웨어에서 강제 |
| `contents` | id(uuid PK), slug(unique), track('case'\|'trend'), title, summary, **body(jsonb)**, job_tags(text[]), persona_coverage(text[]), read_min, apply_min, status('draft'\|'published'\|'archived'), curated(bool), thumbnail_url, published_at, **author_quote(text)** | author_quote = 헤더에 노출되는 1인칭 톤 인용 |
| `reactions` | id, user_id(uuid FK), content_id(uuid FK→contents), type('like'\|'up'\|'down'), unique(user_id, content_id, type) | 기존 likes 흡수 |
| `saves` | id, user_id(uuid FK), content_id(uuid FK), unique(user_id, content_id) | 기존 유지, content_id 타입 정정 |
| `comments` | id, user_id(uuid FK), content_id(uuid FK), parent_id(uuid nullable), body, status('visible'\|'hidden'\|'reported'), created_at | **신규** — 1단 reply 허용 |
| `opinions` | id, user_id(uuid nullable), content_id(uuid nullable), body, status('new'\|'read'\|'replied'), reply_body, replied_at | **익명 허용** (user_id null) — 페르소나 C |
| `events` | id, user_id(uuid nullable), content_id(uuid nullable), event_type, metadata(jsonb), created_at | 월별 파티셔닝 |
| `products` | id, slug, title, type('ebook'), price(int=0 무료), pdf_path(Storage), thumbnail_url, status | price>0은 출시 후 결정 |
| `purchases` | id, user_id(uuid FK nullable), product_id(uuid FK), name, phone, email, status('pending'\|'sent'\|'failed'), sent_at | Edge Function이 sent 처리 |
| `tools` | id, slug, name, category('tool'\|'prompt'\|'guide'\|'context-card'), description, url, pricing_tier, status | 자료실 통합 — 페르소나 C의 "맥락 카드"는 'context-card' 카테고리로 |
| `topic_suggestions`, `topic_votes` | 기존 유지 | content_id 외래키 추가 |

### 함수 / 정책

```sql
-- admin 권한 캐싱
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN (SELECT role='admin' FROM profiles WHERE id=auth.uid()); END;
$$;

-- 익명 의견 허용
CREATE POLICY "anon opinions" ON opinions FOR INSERT WITH CHECK (true);

-- 발행된 콘텐츠만 익명 SELECT
CREATE POLICY "published content" ON contents FOR SELECT USING (status='published' OR is_admin());

-- 사용자는 본인 row만, admin은 전체
CREATE POLICY "own saves" ON saves USING (user_id = auth.uid() OR is_admin());
-- (reactions, opinions, purchases, topic_votes 동일 패턴)

-- 댓글 — 공개 SELECT, 작성자만 수정/삭제, admin은 모더레이션
CREATE POLICY "visible comments" ON comments FOR SELECT USING (status='visible' OR is_admin() OR user_id=auth.uid());
```

**핸들러**: 기존 `handle_new_user()` 트리거 유지 + `onboarded=false` 기본값.

**뷰**: 기존 `admin_stats`, `content_stats`를 `reactions` 기반으로 재작성.

**파일**: `supabase/migrations/0001_init.sql` (기존 SQL + 보강안 통합)

---

## 6. 페르소나 검증 컴포넌트 매핑

콘텐츠 상세 페이지에 강제로 들어가는 컴포넌트:

| Spec / 페르소나 | 컴포넌트 | 위치 |
|---|---|---|
| 시간 라벨 (A·D) | `<TimeBadge readMin applyMin />` | 헤더 고정 |
| 직무 태그 (D) | `<JobTags />` + 목록에 **5/10/30분 칩 필터** | 헤더 + 목록 |
| 페르소나 커버리지 (전원) | `<PersonaCoverageBadge />` (A·B·C 등) | 헤더 |
| 운영자 1인칭 인용 (A) | `<AuthorQuote />` (contents.author_quote) | 첫 문단 위 |
| step별 의도 (E) | `<IntentBox step text />` | 본문 step마다 |
| 평가 기준 잘됨/별로 (E) | `<EvaluationBox good bad />` | step 안 또는 결과 비교 옆 |
| 정당화 깨기 (B) | `<RebuttalBox hypothesis counter />` | 가설 검증 케이스에 |
| 별로였던 사례 (B·C) | `<FailureSection>` (배경 강조, ≥30% 분량) | 본문 별도 섹션 |
| 맥락 카드 (C) | `<ContextCard>` | 콘텐츠 본문 + 자료실(`/tools`에 'context-card' 카테고리로) |
| 본인 것으로 만드는 4단계 (D) | `<CustomizationChecklist items />` | 콘텐츠 말미 |
| 추천 콘텐츠 (B·E) | `<RelatedSidebar>` (직무 태그 매칭) + `<RelatedCarousel>` (하단 가로) | 상세 페이지 |
| 광고 0 (C) | 본문 외부 링크 화이트리스트 정규식 검사 (발행 게이트) | 7장 |
| 공유 (전원) | `<ShareButtons>` (카카오·X·링크 복사) | 헤더 우측 |
| 댓글 (전원) | `<CommentThread>` (1단 reply, 신고) | 상세 하단 |

---

## 7. 발행 전 자동 검증 게이트 (Linter)

Admin 발행 버튼이 다음 검사를 통과해야만 활성화. `lib/content-lint.ts` 신규.

**자동 (6개)** — 통과 안 되면 발행 불가
- [ ] 시간 라벨: `read_min ≥ 1 && apply_min ≥ 1`
- [ ] 직무 태그: `job_tags.length ≥ 1`
- [ ] 페르소나 커버리지: `persona_coverage.length ≥ 1`
- [ ] 의도 라벨: framework step 수 = `IntentBox` 블록 수
- [ ] 별로 사례: failures 블록의 문자 수 ≥ 전체의 30%
- [ ] 본인 것으로 만드는 4단계: `customization.length === 4`
- [ ] 광고 링크 0: body 내 외부 URL이 허용 도메인 화이트리스트 안에만 있음

**수동 (3개)** — 발행 버튼 옆 체크박스 강제
- [ ] 1인칭 톤 ("저도 어려웠어요" 류 인용)
- [ ] 추천 사이드바·하단 캐러셀 작동 시각 확인
- [ ] 모바일 1회 직접 확인

---

## 8. Phase 0 — 인프라 (1주)

**목표**: 로컬에서 페이지 뼈대가 뜨고, Supabase Auth로 로그인이 되는 상태.

1. **Next.js 프로젝트 셋업** (`/app`, `/components`, `/lib`, `/types`)
2. **Supabase 프로젝트 + `0001_init.sql` 마이그레이션** (5장 스키마)
3. **인증**
   - Google OAuth (Supabase 공식 Provider)
   - **Kakao OAuth**: Supabase Auth + Edge Function 프록시로 구현 (Phase 0 끝에 PoC 완료해야 스케줄 리스크 제거)
   - `handle_new_user()` 트리거 + `onboarded=false` 기본
4. **미들웨어**: `/admin/*` 403 검증, 로그인 유저의 `onboarded=false`면 `/onboarding` 강제 리다이렉트
5. **공통 컴포넌트 이식**: GNB(메가메뉴 포함), Footer, Subscribe Modal, Hero Carousel을 React로
6. **shadcn/ui 셋업** + 디자인 토큰 박기

**검증**
- `npm run dev` → 메인 빈 레이아웃 + GNB
- Google·Kakao 로그인 → `profiles` row 생성 → `/onboarding` 강제
- RLS: 익명/유저/admin SELECT 각 케이스 SQL Editor에서 확인

---

## 9. Phase 1 — 콘텐츠 시스템 + AI 초안 (3주)

**목표**: 운영자가 콘텐츠 1개를 admin 폼으로 작성·발행하면 유저가 메인 → 목록 → 상세 → 저장/반응/댓글까지 흘러갈 수 있는 상태.

### 작업
1. **`contents` jsonb 블록 스키마 Zod 정의** (4장)
2. **렌더러** `lib/content-render.tsx` — block.type → React 컴포넌트
3. **목록 페이지** (`/cases`, `/trends`) — 사이드바 필터 (직무·기간) + **5/10/30분 칩**
4. **상세 페이지** (`/cases/[slug]`, `/trends/[slug]`) — TOC, RelatedSidebar, RelatedCarousel, ShareButtons, CommentThread
5. **저장 / 반응 / 댓글** — DB 연동
6. **온보딩** (`/onboarding`) — 직무 선택 → `profiles.job + onboarded=true`
7. **마이페이지 6개 패널**
8. **검색 페이지** (`/search`) — title·summary·tags 전문 검색 (Postgres full-text)
9. **인스타 → 웹 랜딩** (`/links`) — UTM 파싱 + 콘텐츠 추천
10. **GNB 메가메뉴 + 모바일 햄버거**
11. **AI 초안 버튼 (Admin)** — Anthropic Claude API 호출, 트랙별 4단/3단 jsonb 초안 생성, 운영자 검수 후 저장
12. **On-Demand Revalidation**: 발행 시 `revalidateTag('content-${id}')`, `revalidateTag('list-${track}')`, `revalidateTag('home')`

### 검증
- Admin 폼 → AI 초안 → 검수 → 발행 → 메인·목록·상세 즉시 반영(60초 대기 X)
- **페르소나 검증 체크리스트 자동 6개 통과**
- 댓글 작성·신고 → admin moderation에서 보임

---

## 10. Phase 2 — 전자책 + 의견함 + 후보 투표 (1.5주)

**목표**: 리드 마그넷(무료 전자책)으로 이메일 수집, 운영자 ↔ 유저 양방향 흐름 가동.

1. **무료 전자책 흐름**: `/ebooks` → `/ebooks/[slug]` (3D 북 디스플레이) → `/ebooks/[slug]/order` → `purchases` insert → Edge Function → **Resend로 Signed URL 다운로드 링크 발송** (PDF 첨부 X)
2. **PDF 저장**: Supabase Storage `ebooks/` 버킷 + 7일 Signed URL
3. **의견함**: `opinions` 테이블 + 콘텐츠 상세에서도 모달 호출 + **익명 허용**
4. **후보 투표**: `topic_suggestions`·`topic_votes` + 메인 노출
5. **고객센터** (`/mypage/support`): FAQ + 1:1 문의 (의견함과 통합) + 이력
6. **이메일 템플릿** (Resend React Email): 운영자 1인칭 톤 — "저도 처음엔..." 인사말 통일
7. **DKIM/SPF 도메인 설정** (caselab 도메인)

**검증**: 본인 이메일로 주문 → 30초 내 Signed URL 도착 → 다운로드 성공

---

## 11. Phase 2.5 — 콘텐츠 작성 dry-run 스프린트 (1주, 신설)

**목표**: 출시 콘텐츠 10개를 Admin 폼으로 실제로 작성하면서 폼 UX·자동 게이트·렌더링을 검증.

### 첫 콘텐츠 후보 3개 (작업 시점에 운영자 최종 결정)
1. **"빈 입력칸 앞에서 머리가 하얘질 때 — 같이 첫 한 줄 쓰는 5단계"** (페르소나 1순위 ⭐, A·B·C·D·E 5명 전원 커버)
2. **"AI가 정당화만 한다? 반박시키는 4가지 지시법"** (페르소나 2순위, B·D 커버)
3. **"클라이언트 제안서 — 매번 새로 쓰지 말고 '맥락 카드' 만들기"** (페르소나 3순위, C·D 커버)

→ 운영자가 가장 자신 있는 케이스로 최종 결정.

### 작업
- 콘텐츠 10개 작성 (운영자 직접, AI 초안 활용)
- 작성 중 발견되는 폼 UX 이슈 → 즉시 fix (자동저장, 임시저장 복구, 키보드 단축키)
- 발행 전 자동 게이트 통과 확인
- 각 콘텐츠마다 페르소나 검증 체크리스트 수동 3개 통과

**검증**: 10개 모두 `status='published'` 상태로 메인 노출, 페르소나 5명 각각 "내 페인 풀어주나?" 더블체크

---

## 12. Phase 3 — Admin + 분석 + 자료실 (2주)

**목표**: 운영자가 GUI로만 콘텐츠·자료실·전자책·의견·댓글·분석 모두 운영.

1. **2-Track 콘텐츠 입력 폼** (admin/new.html UX 재현)
   - 자동: slug, 읽기시간 계산, 본문 키워드 기반 태그 제안
   - Preview 모달 (데스크톱/모바일)
   - 자동저장 (localStorage + DB draft) + 임시저장 복구
   - **Draft Preview** (JWT 일회용 토큰 URL)
   - **글 톤 가이드 사이드바** (페르소나별 인용 예시)
2. **자료실 CRUD** — tools/prompts/guides + 'context-card' 카테고리 통합 관리
3. **사용자 상세 슬라이드 패널** (저장·열람·구매 이력)
4. **의견·댓글 모더레이션**
5. **분석 대시보드** — Funnel (PV → deep_read → copy → save → react)
   - `deep_read` 정의: Intersection Observer 본문 70% 이상 + 10초 체류
6. **이메일 답장** (Resend Reply To)
7. **자동 검증 게이트(linter)** (7장)

**검증**: 신규 콘텐츠 작성 → 자동 게이트 통과 → 발행 → ISR 재검증 → 유저 페이지 노출

---

## 13. 폴더 구조

```
caselab/
├── app/
│   ├── (public)/             메인·cases·trends·tools·prompts·guides·ebooks·topics·opinions·search·links·login·onboarding·mypage
│   ├── admin/                contents·users·opinions·comments·analytics·ebooks·topics·tools
│   ├── api/                  revalidate·ai-draft·resend-webhook
│   └── auth/callback/
├── components/
│   ├── content/              TimeBadge, JobTags, PersonaCoverageBadge, AuthorQuote,
│   │                         IntentBox, EvaluationBox, RebuttalBox, FailureSection,
│   │                         ContextCard, CustomizationChecklist, PromptBlock, ResultCompare,
│   │                         RoleCard, FrameworkRef, RelatedSidebar, RelatedCarousel,
│   │                         ShareButtons, CommentThread
│   ├── layout/               GNB, MegaMenu, MobileNav, Footer, SubscribeModal, HeroCarousel
│   ├── admin/                TrackForm, FrameworkStepEditor, AIDraftButton,
│   │                         PreviewModal, LinterGate, ToneGuideSidebar
│   └── ui/                   shadcn/ui 베이스
├── lib/
│   ├── supabase/             server.ts, client.ts, admin.ts
│   ├── content-render.tsx    jsonb body → React 트리
│   ├── content-lint.ts       발행 전 자동 검증 (6개)
│   ├── ai-draft.ts           Anthropic Claude API 호출 (트랙별 프롬프트)
│   ├── email/                Resend client + React Email 템플릿
│   └── analytics/            deep_read observer, GA4 wrapper
├── types/
│   └── content.ts            BlockSchema, ContentBodySchema (Zod)
└── supabase/
    ├── migrations/0001_init.sql
    └── functions/
        ├── kakao-oauth/      Custom OAuth proxy
        └── send-ebook/       PDF Signed URL 이메일
```

---

## 14. 페르소나 검증 체크리스트 (출시 전 필수)

자동 6개 + 수동 4개 + 운영 원칙 2개 = **12개**.

**자동 (linter)**:
1. [ ] 읽기/적용 시간 라벨 노출 (A·D)
2. [ ] 직무 태그 ≥1 + 5/10/30분 칩 필터 작동 (D)
3. [ ] step별 IntentBox 수 = step 수 (E)
4. [ ] FailureSection 분량 ≥ 30% (B·C)
5. [ ] CustomizationChecklist 4개 항목 (D)
6. [ ] 광고/유료 강의 외부 링크 0 (C)

**수동**:
7. [ ] 운영자 1인칭 톤 (AuthorQuote + 본문) (A)
8. [ ] RelatedSidebar/Carousel 작동 (B·E)
9. [ ] 모바일에서 본문/CommentThread/ShareButtons 정상 (전원)
10. [ ] PersonaCoverageBadge가 콘텐츠 실 효용과 일치 (전원)

**운영 원칙**:
11. [ ] 출시 시 콘텐츠 10개 발행 완료 (Phase 2.5)
12. [ ] 인스타 → `/links` → 콘텐츠 동선 1회 직접 테스트

---

## 15. 검증 방법 (End-to-End)

### Phase 0
- 메인 빈 레이아웃 + GNB · Google·Kakao 로그인 · `/onboarding` 강제 · RLS 401 확인

### Phase 1
- Admin 폼 → AI 초안 생성 → 검수 후 발행 → 메인·목록·상세 즉시 반영
- 자동 6개 게이트 통과 + 댓글·공유·반응 동작
- Lighthouse: 콘텐츠 상세 Performance ≥85, Accessibility ≥95

### Phase 2
- 본인 이메일로 무료 전자책 주문 → 30초 내 Signed URL 도착 → 다운로드
- 익명 의견 작성 → Supabase Studio row 확인 → admin 답장
- 후보 카드 투표 → vote_count 증가 + 재방문 시 토글 유지

### Phase 2.5
- 콘텐츠 10개 발행 + 각 콘텐츠 페르소나 검증 12개 통과
- 메인이 안 비어 보이는 시각 검수

### Phase 3
- 시크릿 창 일반 계정 `/admin` → 403
- Admin 신규 작성 → linter 게이트 통과 → 발행 → ISR 재검증 확인
- Funnel 차트가 실제 events와 일치 · 이메일 답장 동작

### 출시 전 최종
- 페르소나 검증 12개 모두 통과 (콘텐츠 10개 × 12개 = 120체크)
- 모바일 직접 확인 (iPhone Safari · Android Chrome)
- 인스타 프로필 → `/links` → 콘텐츠 동선 1회 직접 테스트

---

## 16. 향후 (출시 이후)

- **유료 전자책 PG 결제**: 토스페이먼츠 또는 포트원, 같은 order 흐름에 결제 단계 추가 (운영 데이터 보고 시점 결정)
- **뉴스레터 발송**: 페르소나 B·D 인스타 밖 채널 대응
- **언어 토글 (EN/KR)**: 글로벌 검토 시
- **콘텐츠 추천 알고리즘 고도화**: 직무·상황·시간 매칭
- **다크 모드**: 사용자 요청 시
- **댓글 1단 → 멀티 스레드 확장**: 활성도 보고

---

## 17. 첫 한 주 우선순위

1. Supabase 프로젝트 + `0001_init.sql` (5장 스키마 그대로)
2. Next.js + shadcn/ui + 디자인 토큰
3. GNB + 메인 + 로그인 3개 페이지 동작
4. **Google + Kakao OAuth PoC 완료** (Kakao 스케줄 리스크 제거)
5. `onboarded` 미들웨어
→ Phase 1 진입

---

## 18. Decisions Log — 출시 시점 결정 변경 (2026-06-02)

> 본 문서 §1~§17은 **원본 기획 의도**. 아래는 출시를 앞두고 “운영비 부담·우선순위·리스크”를 따져 변경한 **실제 출시 시점 결정**. 코드·런북은 이 결정을 반영함. 다른 세션에서 컨텍스트 파악할 때 **이 섹션 + `docs/05_launch_runbook.md`가 최신 정본**.

### 18.1 “돈 0원 출시” 모드 — 외부 SaaS 결정

| 항목 | §1~§17 기획 | **출시 결정 (정본)** | 이유 |
|---|---|---|---|
| 도메인 | `caselab.kr` 또는 `caselab.co` | **Vercel 무료 서브도메인** (`caselab.vercel.app`) | 운영자 1년 운영비 $0 달성. 사이트 자리잡으면 그때 도메인 검토 |
| Cloudflare | 사용 (Registrar+DNS) | **사용 안 함** | 도메인 없으니 불필요 |
| Resend (이메일 발송) | Phase 2 도입 | **사용 안 함** → **Gmail SMTP로 대체** (Day 9) | 자체 도메인 없이 Resend 사용 불가. Gmail SMTP가 무료로 외부 발송 가능한 유일한 옵션 |
| Anthropic Claude API (AI 초안) | Phase 1 포함 (§9 11번 항목) | **비활성** (`NEXT_PUBLIC_AI_DRAFT_ENABLED='true'` 시만 활성) | 운영자가 Claude Max 구독 보유. Max에서 직접 초안 작성 → admin 폼 복붙 워크플로우로 대체 |
| 발신 메일 | `official@<도메인>` | (없음) | Resend 미사용 |
| 답신·문의 메일 | `official@<도메인>` reply-to | **`caselab.kr@gmail.com`** (직접 표기) | 운영자 보유한 유일한 메일. Privacy/Footer에도 직접 노출 |
| Kakao OAuth | Day 2 필수 | Day 2 선택 (출시 직전 또는 출시 후) | Edge Function 배포 단계 줄여 출시까지 단축 |

### 18.2 그대로 유지되는 결정 (§1~§17 기획대로)

- Next.js 15 (App Router) + TypeScript + Tailwind 3
- Supabase (Postgres + Auth + Storage + Edge Functions) — 무료 플랜
- Vercel (Hobby 무료 플랜)
- Google OAuth
- GA4 (쿠키 동의 후 활성)
- 페르소나 검증 12개 체크리스트 (§14)
- 콘텐츠 jsonb 블록 스키마 (§4)
- Supabase 스키마 (§5) — `0001_init.sql` 그대로
- 발행 게이트 자동 6 + 수동 3 (§7)
- “1인칭 톤 × Framework × failures ≥ 30% × customization 4단계” 콘텐츠 구조

### 18.3 출시 후 도입 결정 트리거

| 항목 | 도입 시점 |
|---|---|
| 커스텀 도메인 (Cloudflare 또는 가비아) | 인스타 유입 안정화 + 브랜드 강화 필요 시 |
| Resend (이메일 발송 인프라 강화) | Gmail SMTP 한도 도달 또는 스팸 폴더 빈도 ↑ |
| Anthropic Claude API (AI 초안) | 콘텐츠 월 5건+ 안정화 + Max 복붙 피로 누적 |
| 카드뉴스·외부 채널 (Brunch·LinkedIn) | 출시 +1~6개월, 인스타 채널 안정화 후 |
| Lighthouse 90+ 폴리싱 | 출시 +1주, GA4·events 데이터 보고 |

### 18.4 핵심 추가 사항 (§1~§17 외)

- **인스타그램 핸들**: `@caselab_ai_` (URL: `https://instagram.com/caselab_ai_`)
- **사이트 → 인스타 동선**: GNB 우상단 아이콘 + Footer 2곳 노출 (`lib/constants.ts`에서 중앙 관리)
- **보강 SEO**: `app/icon.tsx`, `app/opengraph-image.tsx`, `app/robots.ts`, `app/sitemap.ts`
- **법무 페이지**: `/legal/privacy`, `/legal/terms` (코드 직접 수정 방식, admin GUI 편집기는 보류)
- **분석**: GA4 + `events.deep_read` (Intersection Observer 70% + 10s)
- **쿠키 동의 배너**: `components/analytics/CookieConsent.tsx` — 동의 후 GA4 활성

### 18.5 결정 변경 이력 (요약)

- 2026-05-28: 본 dev plan v2 작성
- 2026-05-30~31: Phase 0+1 코드 작성 완료, GitHub Issue #1~#10 등록, 런북 `docs/05_launch_runbook.md` 작성
- 2026-06-01: 도메인 caselab.kr → caselab.co → Vercel 무료 서브도메인. Cloudflare 사용 안 함. Anthropic 비활성. 운영비 $0 모드 확정
- 2026-06-02: Resend → Gmail SMTP로 교체 (전자책 1건이라도 발송되도록). 인스타 `@caselab_ai_` 핸들 확정 + 사이트 노출

### 18.6 다른 세션에서 컨텍스트 파악 시 우선순위

1. **`docs/04_dev_plan.md` §18** (본 섹션) — 출시 시점 결정 변경 요약
2. **`docs/05_launch_runbook.md`** — Day 0~12 단계별 작업 (정본)
3. **`docs/07_handoff_prompt.md`** — 다른 세션에 컨텍스트 한 번에 전달용 프롬프트
4. **GitHub Issue #1~#10** — 외부 콘솔 작업 체크리스트 + 변경 코멘트
5. `lib/constants.ts` — 인스타 핸들·문의 메일 등 외부 상수 중앙 관리
6. `.env.example` — 환경변수 템플릿 (출시 결정 반영)
