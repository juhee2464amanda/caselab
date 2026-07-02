'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { shareToKakao } from '@/lib/kakao';
import { track } from '@/lib/analytics/track';

export function ContentShareSection({
  url,
  title,
  contentId,
}: {
  url: string;
  title: string;
  contentId?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      void track('share', { content_id: contentId, channel: 'copy' });
    } catch {
      /* noop */
    }
  }

  async function shareKakao() {
    if (typeof window === 'undefined') return;
    // Kakao JS SDK 공유 팝업. SDK 불가(키 없음/로드 실패) 시 링크 복사로 폴백.
    const ok = await shareToKakao({ url, title });
    if (ok) {
      void track('share', { content_id: contentId, channel: 'kakao' });
    } else {
      await copyLink();
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
    void track('share', { content_id: contentId, channel: 'x' });
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
