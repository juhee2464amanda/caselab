'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * 최신 콘텐츠 세로 피드 — 모바일 전용 (케이스·트렌드 혼합, 최신순)
 *
 * 텍스트 좌 + 썸네일 우 가로형 카드, 초기 N개 + '더보기' 버튼 점진 노출.
 * 전체 목록은 서버에서 한 번에 내려받고 클라이언트에서 개수만 늘린다(추가 fetch 없음).
 */

export interface FeedItem {
  id: string;
  href: string;
  title: string;
  summary: string | null;
  thumbnail_url: string | null;
  badge: string; // 한글 라벨 (기획/마케팅/AI 트렌드/...)
  readMin: number;
}

const STEP = 6;

export function LatestFeed({
  items,
  initialCount = 6,
}: {
  items: FeedItem[];
  initialCount?: number;
}) {
  const [count, setCount] = useState(initialCount);

  if (items.length === 0) {
    return <div className="py-8 text-center text-sm text-ink/40">아직 콘텐츠가 없어요.</div>;
  }

  const visible = items.slice(0, count);

  return (
    <>
      <ul className="mt-2 divide-y divide-muted">
        {visible.map((it) => (
          <li key={it.id}>
            <Link href={it.href} className="group flex items-start gap-4 py-4">
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                  {it.badge}
                </span>
                <h3 className="mt-1.5 text-[15px] font-bold leading-snug tracking-tight line-clamp-2 keepall group-hover:text-accent transition-colors">
                  {it.title}
                </h3>
                {it.summary && (
                  <p className="mt-1 text-[13px] text-ink/60 leading-snug line-clamp-2 keepall">
                    {it.summary}
                  </p>
                )}
                <div className="mt-1.5 text-[11px] text-ink/40">{it.readMin}분 읽기</div>
              </div>
              {it.thumbnail_url && (
                <div className="relative w-[104px] aspect-[4/3] shrink-0 overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.thumbnail_url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
      {count < items.length && (
        <button
          type="button"
          onClick={() => setCount((c) => c + STEP)}
          className="mt-2 w-full rounded-lg border border-border bg-white py-2.5 text-sm font-semibold text-ink/70 active:bg-muted"
        >
          더보기 +
        </button>
      )}
    </>
  );
}
