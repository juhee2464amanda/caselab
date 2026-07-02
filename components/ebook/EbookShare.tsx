'use client';

import { useEffect, useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics/track';

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

/**
 * ebook 공유 — 카카오톡 / X / 링크 복사 (mockup ebook-free.html .share-section 정합).
 *
 * 카카오: NEXT_PUBLIC_KAKAO_JS_KEY 가 있으면 Kakao SDK 정식 공유 팝업(데스크탑 포함).
 *   키가 없으면 — 모바일은 네이티브 공유시트(→ 카카오톡 선택), 데스크탑은 링크 복사로 폴백.
 *   (deprecated story.kakao 링크, 데스크탑 OS 공유시트 같은 혼란 요소 제거)
 */
export function EbookShare({
  title,
  imageUrl,
  productId,
}: {
  title?: string;
  imageUrl?: string;
  productId?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [kakaoCopied, setKakaoCopied] = useState(false);

  const href = () => (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = () => title || (typeof document !== 'undefined' ? document.title : 'Caselab');

  // Kakao JS SDK 로드/초기화 (키가 있을 때만)
  useEffect(() => {
    if (!KAKAO_JS_KEY || typeof window === 'undefined') return;
    const w = window as unknown as { Kakao?: { isInitialized: () => boolean; init: (k: string) => void } };
    const init = () => {
      if (w.Kakao && !w.Kakao.isInitialized()) w.Kakao.init(KAKAO_JS_KEY);
    };
    if (w.Kakao) {
      init();
      return;
    }
    const existing = document.getElementById('kakao-sdk') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', init);
      return;
    }
    const s = document.createElement('script');
    s.id = 'kakao-sdk';
    s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    s.crossOrigin = 'anonymous';
    s.onload = init;
    document.head.appendChild(s);
  }, []);

  function copyToClipboard(onDone?: () => void) {
    navigator.clipboard?.writeText(href()).then(() => onDone?.());
  }

  function shareKakao() {
    const w = window as unknown as {
      Kakao?: { Share?: { sendDefault: (o: unknown) => void } };
    };
    // 1) Kakao SDK 정식 공유 (키 있을 때 — 데스크탑/모바일 모두)
    if (w.Kakao?.Share?.sendDefault) {
      w.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: shareTitle(),
          description: 'Caselab ebook',
          imageUrl: imageUrl || '',
          link: { mobileWebUrl: href(), webUrl: href() },
        },
        buttons: [{ title: '보러가기', link: { mobileWebUrl: href(), webUrl: href() } }],
      });
      void track('share', { product_id: productId, channel: 'kakao' });
      return;
    }
    // 2) 모바일: 네이티브 공유시트(카카오톡 포함)
    const isMobile =
      typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      navigator.share({ title: shareTitle(), url: href() }).catch(() => {});
      void track('share', { product_id: productId, channel: 'kakao' });
      return;
    }
    // 3) 데스크탑: 링크 복사 폴백
    copyToClipboard(() => {
      setKakaoCopied(true);
      setTimeout(() => setKakaoCopied(false), 2200);
    });
    void track('share', { product_id: productId, channel: 'kakao' });
  }

  function shareX() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle())}&url=${encodeURIComponent(href())}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=420');
    void track('share', { product_id: productId, channel: 'x' });
  }
  function copyLink() {
    copyToClipboard(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
    void track('share', { product_id: productId, channel: 'copy' });
  }

  const base =
    'flex items-center gap-1.5 rounded-[10px] border px-[18px] py-2.5 text-[13px] font-semibold transition-colors';

  return (
    <div className="mt-2 border-t border-border pt-8 text-center">
      <div className="mb-4 text-[15px] font-semibold text-ink/80 break-keep">
        이 책이 도움이 됐다면 공유해주세요
      </div>
      <div className="flex flex-wrap justify-center gap-2.5">
        <button
          type="button"
          onClick={shareKakao}
          className={cn(base, 'border-[#FEE500] bg-[#FEE500] text-[#191919] hover:bg-[#fdd835]')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.726 1.8 5.117 4.51 6.473-.145.522-.935 3.367-.968 3.578 0 0-.02.166.088.229.108.063.235.03.235.03.31-.044 3.588-2.342 4.157-2.741.64.09 1.3.14 1.978.14 5.523 0 10-3.463 10-7.709C22 6.463 17.523 3 12 3" />
          </svg>
          {kakaoCopied ? '링크 복사됨' : '카카오톡'}
        </button>
        <button
          type="button"
          onClick={shareX}
          className={cn(base, 'border-border bg-white text-ink/60 hover:border-ink/30 hover:text-ink')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          X
        </button>
        <button
          type="button"
          onClick={copyLink}
          className={cn(
            base,
            copied
              ? 'border-ink bg-ink text-white'
              : 'border-border bg-white text-ink/60 hover:border-ink/30 hover:text-ink'
          )}
        >
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          {copied ? '복사됨' : '링크 복사'}
        </button>
      </div>
    </div>
  );
}
