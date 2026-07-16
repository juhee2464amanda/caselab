# 08. Ebook 웹뷰어 기획서 (구매자용 마이페이지 뷰어)

> 작성일: 2026-07-15 · 상태: **확정(align 완료)** · 브랜치: `worktree-feat-ebook-viewer`
>
> **Align 결정사항 (2026-07-15)**: ① 뷰어는 `/read/[purchaseId]` 전체화면 ② 다운로드는 이메일 링크 유지(사이트는 뷰어만) ③ **워터마크 미표시** (유출 억제는 스트리밍+복사방지로) ④ 바로 구현 진행

---

## 1. 배경 & 목표

- 현재 ebook 구매자는 **이메일의 다운로드 링크(7일 만료)** 로만 PDF를 받을 수 있음.
- `/mypage/ebooks`는 구매 내역 리스트만 보여주고, **사이트 안에서 읽을 방법이 없음**.
- 목표: 구매자가 마이페이지에서 바로 열어 읽는 **웹 뷰어** 제공 + 실제 ebook 서비스 수준의 독서 편의 기능(이어읽기, 목차, 북마크 등) 제공.

**성공 기준**
- 구매자가 이메일 없이도 `/mypage/ebooks → 읽기` 로 3클릭 내 독서 시작.
- 마지막 읽던 위치가 기기 간 자동 동기화.
- `ebook_read_page` / `ebook_finish` 이벤트로 완독 퍼널 측정 가능.

---

## 2. 경쟁 서비스 리서치 요약

국내(리디, 밀리, 예스24 크레마, 교보, 알라딘) + 글로벌(Kindle Web, Google Play Books, Kobo Web, Apple Books)을 조사한 결과:

### 전 서비스 공통 "기본기" (업계 기준선)
| 기능 | 비고 |
|---|---|
| 이어읽기 (위치 자동저장 + 계정 동기화) | 전 서비스 1순위 기능 |
| 목차 바로가기 | 기본 제공 |
| 진행률 표시 (% / 페이지) | 슬라이더 겸용이 일반적 |
| 북마크 | 하이라이트보다 구현 저렴, 기대치 높음 |
| 표시 설정 (글자크기/테마/줄간격) | EPUB 기준. PDF는 줌/다크모드로 대체 |
| 하이라이트(색상) + 메모 | 전 서비스 제공하나 구현비 높음 (예스24는 페이지 경계 버그로 악평) |
| 책 내 검색 | 기본 제공 |

### 주요 시사점
1. **순수 웹뷰어를 제대로 하는 곳은 교보(바로보기)뿐.** 리디조차 일반 ebook은 웹 미지원 → "설치 없이 브라우저에서 바로 읽기" 자체가 차별점이 됨.
2. **TTS·오프라인은 대형 사업자도 웹에서 뺐음** (교보 웹뷰어 TTS 미지원, Kindle 웹 오프라인 축소) → 우리도 스킵이 정답.
3. DRM은 소규모 서비스엔 과잉. 업계 대안은 **소셜 DRM(구매자 정보 워터마크) + 스트리밍 렌더(파일 미전달) + 복사 제한** 조합.
4. 교보 UX 교훈: 하이라이트 저장 시 메모 강제 입력 → 마찰. **하이라이트와 메모는 분리 설계.**
5. 인용 이미지 공유(리디/교보)는 커머스에 바이럴 효과 → 가성비 좋은 v2 후보.

*(상세 리서치·출처는 부록 A)*

---

## 3. 현재 시스템 분석 (코드 기준)

| 항목 | 현황 |
|---|---|
| 콘텐츠 포맷 | **PDF** — private `ebooks` 버킷, `products.pdf_path` |
| 접근 방식 | 이메일 링크 → `/api/ebook/download?p=<purchaseId>&t=<hmac>` → signed URL(7일) redirect |
| 소유권 | `purchases(user_id, product_id, status)` + RLS "Users view own purchases" |
| 마이페이지 | `app/(public)/mypage/ebooks/page.tsx` — 구매목록만, 읽기/다운로드 버튼 없음 |
| 목차 데이터 | `products.body.toc[]` (jsonb, 페이지 매핑 없음) + PDF 내장 outline 활용 가능 |
| 분석 이벤트 | `ebook_read_page`, `ebook_finish` 타입이 `lib/analytics/track.ts`에 **이미 정의됨** (미사용) |
| PDF 렌더 라이브러리 | 없음 (신규 도입 필요) |

**포맷이 PDF라는 것이 설계의 핵심 제약**: 글자크기/폰트/줄간격 조정(리플로우)은 EPUB 전용이라 불가. 대신 줌, 페이지/스크롤 모드, 다크모드(필터)로 대응.

---

## 4. 기능 스코프

### MVP (이번 구현)
| # | 기능 | 구현 방식 |
|---|---|---|
| 1 | **웹 뷰어** (PDF 렌더) | `react-pdf` (PDF.js 래퍼, MIT, 활발히 유지보수 — 2026-02 최신 배포) |
| 2 | **이어읽기** | 페이지 번호를 `ebook_reading_state` 테이블에 debounce 저장(5초), 재진입 시 복원. 비로그인 fallback 없음(뷰어 자체가 로그인 필수) |
| 3 | **목차 바로가기** | PDF 내장 outline(`getOutline()`) 우선, 없으면 `body.toc` 텍스트만 표시 |
| 4 | **진행률** | 상단 진행바 + `현재p/전체p (n%)` + 슬라이더로 페이지 점프 |
| 5 | **북마크** | 페이지 단위 토글, `ebook_bookmarks` 테이블, 사이드패널에서 목록/이동 |
| 6 | **보기 모드** | 스크롤 모드(기본, 모바일 친화) ↔ 페이지 모드 토글, 줌 ±, 모바일 반응형 |
| 7 | **다크모드** | CSS `filter: invert()` 기반 (이미지 재반전 처리) — 저비용 |
| 8 | **접근 제어** | 로그인 + 구매 소유권 검증 → 짧은 만료(10분) signed URL로 스트리밍. 다운로드/인쇄 버튼 미제공, 텍스트 복사 비활성. ~~워터마크~~ (align에서 제외 결정) |
| 9 | **분석 연동** | `ebook_read_page`(페이지 이동 시 sampled), `ebook_finish`(마지막 페이지 도달) |
| 10 | **진입점** | `/mypage/ebooks` 각 항목에 "읽기" 버튼 (status='sent'만) + 다운로드 버튼(기존 API 재사용) |

### V2 (다음 스프린트, 이번엔 테이블 설계만 고려)
- **하이라이트(3색) + 메모** — PDF 텍스트 레이어 selection → `{page, 텍스트, offset}` 저장. 하이라이트와 메모 분리(교보 교훈).

#### V2 하이라이트/메모 구현 방안 상세 (2026-07-16 피드백 반영 → **당일 선행 구현 완료**, 마이그레이션 0027)
- **전제 — 텍스트 레이어 활성화**: 현재 뷰어는 PDF.js 텍스트 레이어를 꺼둠(복사 방지 + 렌더 비용). 하이라이트는 이 레이어(캔버스 위 투명 텍스트 오버레이)를 켜야 드래그 선택이 가능해짐. `renderTextLayer={true}` 한 줄이면 켜지며, **텍스트 기반 PDF는 별도 처리 없이 즉시 선택 가능** — 현재 판매 PDF(ai-1week-notes)는 텍스트 기반이라 OK.
- **스캔 이미지형 PDF는 불가**: 텍스트 정보가 없어 OCR 없이는 선택 자체가 안 됨. → admin 메모의 "텍스트 기반 PDF로 제작" 원칙이 하이라이트의 전제조건이기도 함. (OCR 파이프라인은 비용 대비 비권장 — 제작 단계에서 텍스트 PDF로 해결)
- **복사 방지와의 트레이드오프**: 레이어를 켜면 드래그 복사가 가능해짐 → 선택은 허용하되 `copy` 이벤트 차단 또는 글자수 제한(국내 서비스 관행)으로 절충.
- **저장 모델**: `ebook_annotations(id, user_id, product_id, page, kind 'highlight'|'memo', color, selected_text, anchor jsonb, note, created_at)` + 본인 행 RLS(0026 패턴 동일).
- **앵커 방식**: 페이지 번호 + 텍스트 아이템 인덱스/문자 오프셋(PDF.js `getTextContent()` 기준)을 저장하고 렌더 시 rect로 복원. 페이지 경계에 걸치는 선택은 페이지 단위로 분할 저장(예스24가 악평받은 지점).
- **UI 흐름**: 드래그 → 플로팅 툴바(형광펜 3색 + 메모) → 저장. 메모는 하이라이트에 선택적으로 붙임(교보처럼 강제 입력 금지). 독서노트(모아보기)는 패널 3번째 탭으로.
- **독서노트** — 하이라이트/메모/북마크 모아보기.
- **책 내 검색** — PDF.js findController.
- **인용 이미지 공유** — 선택 텍스트 → 브랜드 카드 이미지.

### 만들지 않음 (근거 있는 제외)
- **TTS** — 대형 사업자도 웹에서 제외, Web Speech API 한국어 품질 낮음.
- **오프라인(PWA)** — 공수 대비 사용 빈도 낮음, Kindle도 축소.
- **진짜 DRM(Adobe/LCP)** — 비용·복잡도 과잉. 스트리밍+워터마크로 충분.
- **독서 통계/스트릭** — 구독 서비스용 리텐션 장치, 단권 커머스에 부적합.
- **글자크기/폰트 조정** — PDF 포맷 제약(리플로우 불가). 추후 EPUB 도입 시 재검토.

---

## 5. 기술 설계

### 5.1 라우트 & 컴포넌트
```
app/(public)/mypage/ebooks/page.tsx          # 기존 — "읽기" 버튼 추가
app/(public)/read/[purchaseId]/page.tsx      # 뷰어 (서버: 소유권 검증 → 클라이언트 셸)
  └ components/ebook/viewer/
      EbookViewer.tsx        # 셸: 툴바/사이드패널/상태 관리
      PdfCanvas.tsx          # react-pdf 렌더 (스크롤/페이지 모드)
      ViewerToc.tsx          # 목차 패널
      ViewerBookmarks.tsx    # 북마크 패널
      ViewerProgress.tsx     # 진행바 + 슬라이더
app/api/ebook/stream/route.ts  # 세션 기반 소유권 검증 → 10분 signed URL 발급
```
- 뷰어는 몰입형 전체화면 레이아웃(마이페이지 사이드바 없이) → `/read/` 별도 세그먼트. mypage 레이아웃 하위가 낫다고 판단되면 align 시 결정.

### 5.2 DB 마이그레이션 (`0026_ebook_viewer.sql`)
```sql
create table public.ebook_reading_state (
  user_id uuid references auth.users on delete cascade,
  product_id uuid references public.products on delete cascade,
  page int not null default 1,
  total_pages int,
  updated_at timestamptz default now(),
  primary key (user_id, product_id)
);
create table public.ebook_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  product_id uuid references public.products on delete cascade,
  page int not null,
  label text,
  created_at timestamptz default now(),
  unique (user_id, product_id, page)
);
-- RLS: 본인 행만 select/insert/update/delete (기존 패턴 동일)
-- v2 대비: annotations 테이블은 이번에 만들지 않고 설계만 문서화
```

### 5.3 보안 흐름
1. `/read/[purchaseId]` 서버 컴포넌트: `auth.getUser()` → `purchases`에서 `user_id = auth.uid() and status='sent'` 확인(RLS로 자동 강제) → 불일치 시 redirect.
2. 클라이언트는 `/api/ebook/stream?p=<purchaseId>` 호출 → 세션 쿠키로 재검증 → **10분 만료 signed URL** 반환 → react-pdf가 스트리밍 렌더.
3. 기존 이메일용 `/api/ebook/download`(HMAC, 7일)는 그대로 유지 — 별개 경로.
4. 워터마크: 뷰어 위 고정 오버레이로 `구매자 이메일 · 주문번호 앞 8자` 반투명 표시.

### 5.4 신규 의존성
- `react-pdf` (+ `pdfjs-dist` peer) — 번들 영향: PDF.js worker는 dynamic import + `/read` 라우트에서만 로드.

### 5.5 구현 중 확인된 사항 (2026-07-15)
- **PDF.js 워커**: `new URL('pdfjs-dist/...', import.meta.url)` 패턴 대신 `public/pdf.worker.min.mjs` 정적 서빙. `postinstall` 스크립트가 pdfjs-dist 버전과 자동 동기화(파일은 .gitignore).
- **dev는 Turbopack 필수**: webpack dev 모드에서 pdfjs-dist 5.x ESM 로드가 `Object.defineProperty called on non-object`로 크래시(Next 15.5 dev 전용 버그). 프로덕션 빌드(webpack)는 정상. → `dev` 스크립트를 `next dev --turbopack`으로 변경.
- **목차 fallback**: 현재 업로드된 PDF(ai-1week-notes)는 내장 outline이 없어 `body.toc` 제목만 표시(이동 불가). 이후 ebook 제작 시 **PDF에 북마크(outline)를 포함해 내보내면** 목차 이동이 자동 활성화됨.
- E2E 검증 완료: 로그인→서재→뷰어 진입→렌더→목차/북마크 패널→슬라이더 점프→다크모드→페이지 모드/키보드→이어읽기 서버 저장·복원.

---

## 6. 구현 단계

| 단계 | 내용 | 산출물 |
|---|---|---|
| 1 | 마이그레이션 + stream API + 소유권 검증 라우트 | `0026_ebook_viewer.sql`, `/api/ebook/stream` |
| 2 | 뷰어 코어: react-pdf 렌더, 스크롤/페이지 모드, 줌, 진행바 | `/read/[purchaseId]` 동작 |
| 3 | 이어읽기 + 북마크 + 목차 패널 | DB 연동 완료 |
| 4 | 다크모드, 워터마크, 복사 방지, 모바일 반응형 | UX 마감 |
| 5 | mypage 진입점 + 분석 이벤트 + 수동 검증(/verify) | PR |

---

## 7. Align 필요 사항 (결정해 주세요)

1. **뷰어 위치**: `/read/[purchaseId]` 몰입형 전체화면(제안) vs `/mypage/ebooks/[id]/read` 마이페이지 내부.
2. **다운로드 허용 여부**: 뷰어 도입 후에도 mypage에서 PDF 다운로드 버튼을 줄지(현재는 이메일로만 제공). 주면 편의↑ / 유출 위험↑. → 제안: **뷰어만 제공, 다운로드는 이메일 유지**.
3. **워터마크 표시 강도**: 항상 표시(제안) vs 미표시.
4. **비로그인 구매자**: `purchases.user_id`가 null인 구매(비회원 주문)는 뷰어 접근 불가 — 이메일 링크로만 안내. 괜찮은지?

---

## 부록 A. 리서치 상세

### 서비스별 기능 매트릭스
| 기능 | RIDI | Millie | Yes24 | 교보 | 알라딘 | Kindle Web | Play Books | Kobo Web |
|---|---|---|---|---|---|---|---|---|
| 이어읽기 동기화 | O | O | O | O | O | O | O | O |
| 목차 이동 | O | O | O | O | O | O | O | O |
| 하이라이트(색상) | O | O | O | O | O | O | O | O(4색) |
| 메모 | O | O | O | O | O | O | O | △ |
| 북마크 | O | O | O | O | O | O | O | O |
| 책 내 검색 | O | O | O | O | O | O | O | O |
| 표시 설정 | 상세 | O | O | O | O | 기본 | O | 고급 타이포 |
| 진행률 | O | O | O | O | O | O | O | O |
| TTS | 앱만 | 오디오북 | O(버그 평판) | 앱만 | O | X | X(웹) | X |
| 오프라인 | 앱 | 앱 | 앱 | 앱 | 앱 | △ | 앱 | X |
| 웹뷰어 | 웹툰/웹소설만 | X | X | **O(바로보기)** | X | O | O | O |

### 라이브러리 검토 (2026-07 npm 기준)
| 라이브러리 | 대상 | 상태 | 판단 |
|---|---|---|---|
| **react-pdf** 10.4.1 | PDF | MIT, 2026-02 배포, 활발 | ✅ **채택** — 현 포맷이 PDF |
| pdfjs-dist 6.1.200 | PDF | Mozilla 유지, 2026-06 | react-pdf의 기반 |
| react-reader 2.0.15 | EPUB | 2025-09, 활발 | EPUB 도입 시 후보 |
| epub.js 0.3.93 | EPUB | 2022 이후 사실상 중단 | 직접 사용 비권장 |
| foliate-js 1.0.1 | EPUB | API 불안정 명시 | 보류 |

### 주요 출처
- 리디: [웹뷰어 활용](https://ridihelp.ridibooks.com/support/solutions/articles/154000207690) · [형광펜 개선 후기](https://ridicorp.com/story/highlight/)
- 교보: [웹뷰어 매뉴얼](https://ebook.library.kr/file/kyobo_WEBManual.pdf) · [eBook 가이드](https://ebook.kyobobook.co.kr/dig/etc/ebookgdnc)
- 밀리: [PC뷰어 가이드](https://install.millie.co.kr/guide/viewer-guide_210111.pdf)
- 글로벌: [Kindle for Web](https://www.amazon.com/gp/help/customer/display.html?nodeId=GCQEMKHLBENNKWU2) · [Play Books 주석](https://support.google.com/googleplay/answer/3165868) · [Kobo Web Reader](https://www.ereadersforum.com/threads/rakuten-kobo-web-reader-new-features-and-updates-to-elevate-your-reading-experience.3717/)
- UX 비교: [e-Book 4사 비교 (브런치)](https://brunch.co.kr/@wepostit/1)
- 소셜 DRM: [Locklizard](https://www.locklizard.com/document-security-blog/ebook-social-watermarking/) · [Good e-Reader](https://goodereader.com/blog/electronic-readers/everything-you-need-to-know-about-social-drm-for-ebooks)
- 라이브러리: [react-pdf](https://github.com/wojtekmaj/react-pdf) · [epub.js maintenance 이슈](https://github.com/futurepress/epub.js/issues/1268) · [JS PDF viewers 2026 (Nutrient)](https://www.nutrient.io/blog/top-5-javascript-pdf-viewers/)
