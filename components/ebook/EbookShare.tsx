'use client';

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ebook 공유 — 카카오톡 / X / 링크 복사 (mockup ebook-free.html .share-section 정합).
 */
export function EbookShare() {
  const [copied, setCopied] = useState(false);
  const href = () => (typeof window !== 'undefined' ? window.location.href : '');

  function shareKakao() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ url: href() }).catch(() => {});
    } else {
      window.open(
        `https://story.kakao.com/share?url=${encodeURIComponent(href())}`,
        '_blank',
        'width=600,height=400'
      );
    }
  }
  function shareX() {
    const text = document.title;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(href())}`,
      '_blank',
      'width=600,height=400'
    );
  }
  function copyLink() {
    navigator.clipboard?.writeText(href()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
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
          카카오톡
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
