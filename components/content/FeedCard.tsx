import Link from 'next/link';
import { TrackedCtaLink } from '@/components/analytics/TrackedCtaLink';
import { cn } from '@/lib/utils';

/**
 * 모바일 피드 카드 — 홈 '최신 콘텐츠'와 목록 페이지(트렌드·도구·프롬프트·케이스)가 공유하는 단일 포맷.
 *
 * 구조: ① 라벨 → ② 제목 → ③ 요약 → ④ 이미지(20:11) → ⑤ 메타(날짜 · 읽기 N분)
 * 홈 히어로와 같은 순서라 히어로에서 피드로 스크롤이 이어져도 리듬이 끊기지 않는다.
 * 데스크톱은 각 페이지의 기존 레이아웃을 유지하고, 이 카드는 모바일(md 미만)에서만 쓴다.
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
  /** 있으면 cta_click 이벤트를 발화하는 링크로 렌더 (기존 목록 카드의 트래킹 유지용) */
  track?: { label: string; meta?: Record<string, unknown> };
}

/**
 * 피드 카드 날짜 라벨 — ISO 앞 10자(YYYY-MM-DD)를 점 구분으로.
 * Date 파싱을 안 하므로 서버·클라이언트가 항상 같은 문자열을 만든다(하이드레이션 불일치 방지).
 */
export function feedDateLabel(iso: string | null | undefined): string {
  return (iso ?? '').slice(0, 10).replace(/-/g, '.');
}

export function FeedCard({ item: it }: { item: FeedItem }) {
  const inner = (
    <>
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
      {(it.dateLabel || it.readMin) && (
        <div className="mt-3 text-[13px] text-ink/40">
          {it.dateLabel}
          {it.readMin ? `${it.dateLabel ? ' · ' : ''}읽기 ${it.readMin}분` : ''}
        </div>
      )}
    </>
  );

  return it.track ? (
    <TrackedCtaLink
      href={it.href}
      label={it.track.label}
      meta={it.track.meta}
      className="group block"
    >
      {inner}
    </TrackedCtaLink>
  ) : (
    <Link href={it.href} className="group block">
      {inner}
    </Link>
  );
}

/** 카드 세로 피드 — 단일 컬럼, 카드 간격 40px (홈 피드와 동일) */
export function FeedCardList({
  items,
  className,
}: {
  items: FeedItem[];
  className?: string;
}) {
  return (
    <ul className={cn('space-y-10', className)}>
      {items.map((it) => (
        <li key={it.id}>
          <FeedCard item={it} />
        </li>
      ))}
    </ul>
  );
}
