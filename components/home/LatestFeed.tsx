'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * 최신 콘텐츠 세로 피드 — 모바일 전용 (케이스·트렌드·도구·프롬프트 혼합, 최신순)
 *
 * 이미지 우선 카드(썸네일 위 → 라벨 → 제목 → 요약) — Tact 블로그 구조 차용.
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
  /** 발행/등록일 표시용 (YYYY.MM.DD) */
  dateLabel: string;
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
      {/* Tact 모바일 프레임 — 단일 컬럼, 카드 간격 40px */}
      <ul className="mt-4 space-y-10">
        {visible.map((it) => (
          <li key={it.id}>
            <Link href={it.href} className="group block">
              {/* 히어로와 동일 구조 — ① 라벨 → ② 제목 → ③ 요약 → ④ 이미지 → ⑤ 메타 */}
              <span className="inline-block text-[11px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                {it.badge}
              </span>
              <h3 className="mt-2.5 text-[24px] font-extrabold leading-[1.2] tracking-tight line-clamp-2 keepall group-hover:text-accent transition-colors">
                {it.title}
              </h3>
              {it.summary && (
                <p className="mt-2 text-[15px] text-ink/60 leading-normal line-clamp-2 keepall">
                  {it.summary}
                </p>
              )}
              {/* ④ 이미지 — 각진(정사각) 모서리, 20:11. 썸네일 없으면 이모지 타일 폴백 */}
              {it.thumbnail_url ? (
                <div className="relative mt-4 aspect-[20/11] w-full overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.thumbnail_url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : it.thumbEmoji ? (
                <div className="mt-4 flex aspect-[20/11] w-full items-center justify-center bg-muted text-[48px]">
                  {it.thumbEmoji}
                </div>
              ) : null}
              {/* ⑤ 메타 — 이미지 아래, 날짜 · 읽기시간(있고 1분 이상일 때만) */}
              <div className="mt-3 text-[13px] text-ink/40">
                {it.dateLabel}
                {it.readMin ? ` · 읽기 ${it.readMin}분` : ''}
              </div>
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
