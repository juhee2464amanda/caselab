'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export function ContentShareSection({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }

  function shareKakao() {
    if (typeof window === 'undefined') return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      window.open(
        `https://story.kakao.com/share?url=${encodeURIComponent(url)}`,
        '_blank',
        'width=600,height=400'
      );
    }
  }

  function shareTwitter() {
    if (typeof window === 'undefined') return;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        title
      )}&url=${encodeURIComponent(url)}`,
      '_blank',
      'width=600,height=400'
    );
  }

  return (
    <div className="text-center py-8 my-10 border-y border-border">
      <div className="text-[15px] font-semibold text-ink/80 mb-4 break-keep">
        이 글이 도움이 됐다면 공유해주세요
      </div>
      <div className="flex gap-2.5 justify-center">
        <button
          type="button"
          onClick={shareKakao}
          className="px-[18px] py-2.5 text-[13px] font-semibold rounded-lg bg-[#FEE500] text-[#191919] hover:bg-[#FDD835] transition-colors"
        >
          카카오톡
        </button>
        <button
          type="button"
          onClick={shareTwitter}
          className="px-[18px] py-2.5 text-[13px] font-semibold rounded-lg border border-border text-ink/60 hover:border-ink/40 hover:text-ink hover:bg-muted transition-colors"
        >
          X
        </button>
        <button
          type="button"
          onClick={copyLink}
          className={cn(
            'px-[18px] py-2.5 text-[13px] font-semibold rounded-lg transition-colors',
            copied
              ? 'bg-accent text-white border border-accent'
              : 'border border-border text-ink/60 hover:border-ink/40 hover:text-ink hover:bg-muted'
          )}
        >
          {copied ? '복사됨' : '링크 복사'}
        </button>
      </div>
    </div>
  );
}
