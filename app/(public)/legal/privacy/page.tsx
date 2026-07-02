import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  robots: { index: true, follow: false },
};

// 문의 메일은 운영자가 실제 답장하는 곳(Gmail). 발송 도메인(official@caselab.co)과 분리.
const CONTACT_EMAIL = 'caselab.kr@gmail.com';

export default function PrivacyPage() {
  return (
    <article className="prose-caselab">
      <header className="mb-8 not-prose">
        <h1 className="font-serif text-3xl font-semibold">개인정보처리방침</h1>
        <p className="mt-2 text-sm text-ink/50">
          최종 업데이트: 2026-05-30 · 시행일: 출시일
        </p>
      </header>

      <p>
        케이스랩(이하 “서비스”)은 이용자의 개인정보를 소중히 다루며,
        「개인정보 보호법」 등 관련 법령을 준수합니다. 본 방침은 서비스 운영에
        필요한 최소한의 정보만 수집·이용함을 원칙으로 합니다.
      </p>

      <h2>1. 수집하는 개인정보 항목</h2>
      <ul>
        <li><strong>회원가입(Google·Kakao 소셜 로그인)</strong>: 이름, 이메일, 프로필 사진 URL</li>
        <li><strong>온보딩</strong>: 직무 (예: 기획·마케팅·영업 등 자기 선택)</li>
        <li><strong>전자책 신청·구독</strong>: 이름, 이메일, (선택) 연락처</li>
        <li><strong>의견·문의</strong>: 본문, (선택) 이메일 — 익명 제출 허용</li>
        <li><strong>자동 수집</strong>: 접속 기록, 이용 패턴(deep_read, 복사, 저장 등 비식별 이벤트), 브라우저·기기 정보</li>
      </ul>

      <h2>2. 수집·이용 목적</h2>
      <ul>
        <li>회원 식별 및 본인 인증</li>
        <li>콘텐츠 추천 (직무·관심 기반)</li>
        <li>전자책·뉴스레터 발송</li>
        <li>문의 응대 및 서비스 개선</li>
        <li>이용 통계 및 부정 이용 방지</li>
      </ul>

      <h2>3. 보유·이용 기간</h2>
      <ul>
        <li>회원 정보: 회원 탈퇴 시까지</li>
        <li>전자책 신청 기록: 신청일로부터 3년 (전자상거래법)</li>
        <li>접속 기록: 3개월 (통신비밀보호법)</li>
        <li>의견·문의: 답변 완료 후 1년</li>
      </ul>

      <h2>4. 제3자 제공</h2>
      <p>서비스는 이용자의 개인정보를 외부에 판매·임대하지 않습니다. 다만 아래의 위탁 처리자에게만 운영을 위해 일부 정보를 위탁합니다.</p>
      <ul>
        <li><strong>Supabase (Supabase, Inc.)</strong> — 데이터베이스 호스팅 (위치: 서울)</li>
        <li><strong>Vercel (Vercel Inc.)</strong> — 웹 호스팅</li>
        <li><strong>Google LLC</strong> — Google OAuth, Google Analytics(익명 통계), Gmail SMTP를 통한 전자책 다운로드 링크 발송</li>
        <li><strong>Kakao Corp.</strong> — Kakao OAuth</li>
        <li><strong>Anthropic, PBC</strong> — AI 초안 생성 <em>(운영자 기능, 도입 시점에 활성화)</em></li>
      </ul>

      <h2>5. 쿠키·분석 도구</h2>
      <p>
        서비스는 Google Analytics 4(GA4)를 이용해 개인을 식별하지 않는 익명 통계
        (접속 기록·이용 패턴 등)를 수집합니다. 이 과정에서 분석용 쿠키가 사용됩니다.
        수집을 원하지 않으시면 브라우저 설정에서 쿠키를 차단하거나
        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics 차단(opt-out) 도구</a>를
        이용하실 수 있습니다.
      </p>

      <h2>6. 이용자 권리</h2>
      <p>
        이용자는 언제든 자신의 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다.
        마이페이지 &gt; 프로필에서 직접 수정하거나, 아래 연락처로 요청해 주세요.
      </p>

      <h2>7. 안전 조치</h2>
      <ul>
        <li>Supabase Row Level Security(RLS)로 본인 데이터에만 접근 가능</li>
        <li>모든 통신 HTTPS 암호화</li>
        <li>관리자 권한은 운영자 본인만 보유</li>
      </ul>

      <h2>8. 개인정보 보호 책임자 / 문의</h2>
      <p>
        운영자: <em>개인 운영자</em> (출시 시점에 실제 이름으로 교체 예정)<br />
        이메일: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <h2>9. 변경 고지</h2>
      <p>
        본 방침이 변경될 경우 시행 7일 전부터 본 페이지에 공지합니다.
        중대한 변경은 이메일로 별도 안내드립니다.
      </p>

      <p className="text-xs text-ink/50 mt-10 not-prose">
        ※ 이 페이지는 출시 전 운영자의 최종 검수·법무 확인이 필요합니다.
        결제 기능 도입 시점에 전자상거래법·소비자 보호 관련 항목이 추가됩니다.
      </p>
    </article>
  );
}
