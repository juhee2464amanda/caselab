'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { GA_ID, pageview } from '@/lib/analytics/ga4';

const CONSENT_KEY = 'caselab.consent.analytics';

export function getAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(CONSENT_KEY) === 'granted';
}

export function setAnalyticsConsent(granted: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
  window.dispatchEvent(new Event('caselab:consent-change'));
}

/**
 * GA4 Script — 동의(localStorage)가 있을 때만 활성화.
 * env 키가 없으면 아예 렌더 안 함.
 */
export function GA4Provider() {
  const [consented, setConsented] = useState(false);
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    setConsented(getAnalyticsConsent());
    function onChange() { setConsented(getAnalyticsConsent()); }
    window.addEventListener('caselab:consent-change', onChange);
    return () => window.removeEventListener('caselab:consent-change', onChange);
  }, []);

  useEffect(() => {
    if (!consented || !GA_ID) return;
    pageview(pathname + (params.toString() ? `?${params}` : ''));
  }, [pathname, params, consented]);

  if (!GA_ID || !consented) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
