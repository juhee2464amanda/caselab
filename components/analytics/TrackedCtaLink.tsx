'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { track } from '@/lib/analytics/track';

/**
 * cta_click 이벤트를 발화하는 next/link 래퍼.
 * 주요 전환 CTA(무료이북 배너, 이북 주문 버튼 등)에 사용.
 *
 * 사용: <TrackedCtaLink href="/ebooks" label="free_ebook_banner" className="...">무료로 받기</TrackedCtaLink>
 */
export function TrackedCtaLink({
  href,
  label,
  meta,
  className,
  children,
}: {
  href: string;
  label: string;
  meta?: Record<string, unknown>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => void track('cta_click', { label, href, ...meta })}
    >
      {children}
    </Link>
  );
}
