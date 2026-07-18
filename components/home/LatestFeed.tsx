'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * 최신 콘텐츠 세로 피드 — 모바일 전용 (케이스·트렌드·도구·프롬프트 혼합, 최신순)
 *
 * 히어로와 같은 카드 문법(텍스트 위 · 풀폭 썸네일 아래)의 대형 카드가 쭉 내려가는 구조.
 * 초기 N개 + '더보기' 버튼 점진 노출 — 전체 목록은 서버에서 한 번에 내려받고
 * 클라이언트에서 개수만 늘린다(추가 fetch 없음).
 */

export interface FeedItem {
  id: string;
  href: string;
  title: string;
  summary: string | null;
  thumbnail_url: string | null;
  /** 썸네일 없을 때 placeholder emoji (tools 콘텐츠) */
  thumbEmoji?: string | null;
  badge: string; // 한글 라벨 (기획/마케팅/AI 트렌드/AI 도구/프롬프트/...)
  /** contents만 읽기시간 보유 — tools 콘텐츠는 없음 */
  readMin?: number | null;
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
      <ul className="mt-1">
        {visible.map((it) => (
          <li key={it.id}>
            <Link href={it.href} className="group block py-5">
              <span className="text-[11px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                {it.badge}
              </span>
              <h3 className="mt-2 text-[18px] font-bold leading-snug tracking-tight line-clamp-2 keepall group-hover:text-accent transition-colors">
                {it.title}
              </h3>
              {it.summary && (
                <p className="mt-1 text-[14px] text-ink/60 leading-snug line-clamp-2 keepall">
                  {it.summary}
                </p>
              )}
              {it.readMin != null && (
                <div className="mt-1.5 text-[11px] text-ink/40">{it.readMin}분 읽기</div>
              )}
              {it.thumbnail_url ? (
                // 히어로 모바일 썸네일과 같은 2:1 비율 — 더 낮고 가볍게, 카드 문법 통일
                <div className="relative mt-3 aspect-[2/1] w-full overflow-hidden rounded-xl bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.thumbnail_url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : it.thumbEmoji ? (
                <div className="mt-3 flex aspect-[2/1] w-full items-center justify-center rounded-xl bg-muted text-[44px]">
                  {it.thumbEmoji}
                </div>
              ) : null}
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
