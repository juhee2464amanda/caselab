'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { GA_ID } from '@/lib/analytics/ga4';
import { track } from '@/lib/analytics/track';

/**
 * GA4 Script + SPA page_view.
 *
 * 결정 출처: §18.20 (동의 UI 제거 — 고지 기반 수집. §18.9 "Consent Mode default denied → update granted" 방침 폐기)
 *
 * - 한국(PIPA)은 EU식 쿠키 동의 배너 강제 없음 → 개인정보처리방침 고지 +
 *   브라우저 쿠키 차단(opt-out)으로 갈음. 별도 동의/거부 UI 없음.
 * - Consent Mode v2는 유지하되 default `analytics_storage: 'granted'` →
 *   페이지 로드 즉시 쿠키 기반 정식 수집. 광고 관련은 계속 denied.
 * - env 키 없으면 아예 렌더 안 함.
 */
export function GA4Provider() {
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    const path = pathname + (params.toString() ? `?${params}` : '');
    // pv 단일 발화원 — track.ts가 events INSERT + GA4 event 'page_view'(gtag)를 함께 처리.
    // (send_page_view:false로 config돼 있으므로 event 방식이 정합. config 재호출 중복발화 제거)
    void track('pv', { path });
  }, [pathname, params]);

  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-consent-init" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'granted'
          });
        `}
      </Script>
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
