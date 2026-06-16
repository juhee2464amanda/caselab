'use client';

import { useState } from 'react';
import { SubscribeModal } from '@/components/layout/SubscribeModal';

/**
 * 하단 구독 CTA 버튼 — 클릭 시 SubscribeModal 오픈 (GNB와 동일 모달).
 */
export function EbookSubscribeButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-block rounded-[10px] bg-ink px-8 py-3 text-[15px] font-bold tracking-[-0.02em] text-white transition-colors hover:bg-black"
      >
        구독하기 →
      </button>
      <SubscribeModal open={open} onOpenChange={setOpen} />
    </>
  );
}
