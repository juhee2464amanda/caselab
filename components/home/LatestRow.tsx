'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LatestItem } from '@/lib/home/latest-items';

/**
 * 최신 콘텐츠 가로 행 — 데스크톱 (기존 'AI 실전케이스' 스와이프 자리)
 *
 * 케이스·트렌드·도구·프롬프트를 타입 구분 없이 최신순으로 한 줄에 세운다.
 * 재방문자의 첫 질문("새로 뭐 올라왔지?")에 스크롤 없이 답하는 게 목적.
 *
 * 스크롤은 CSS scroll-snap(터치) + 화살표 버튼(마우스) 양쪽 지원 —
 * 데스크톱은 가로 스크롤 제스처가 없어서 화살표가 없으면 숨은 카드가 발견되지 않는다.
 */

type Media = 'text-top' | 'image-top';

export interface LatestRowProps {
  items: LatestItem[];
  /** 카드 미디어 배치 — text-top은 히어로·모바일 피드와 같은 리듬, image-top은 가로 스캔에 유리 */
  media?: Media;
  /** 카드 폭(px) — 노출 개수는 컨테이너 폭에 따라 결정된다 */
  cardWidth?: number;
  /** 풀블리드 여백 처리 (좌우 패딩 밖으로 흘려보내기) */
  bleed?: boolean;
}

export function LatestRow({
  items,
  media = 'text-top',
  cardWidth = 240,
  bleed = false,
}: LatestRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    sync();
    const el = scrollerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sync, items.length]);

  const nudge = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    // 한 번에 보이는 만큼(살짝 덜) 이동 — 카드가 반쯤 잘려 "더 있다"는 신호를 남긴다
    el.scrollBy({ left: dir * Math.max(el.clientWidth - cardWidth * 0.4, cardWidth), behavior: 'smooth' });
  };

  if (items.length === 0) {
    return <div className="py-8 text-center text-sm text-ink/40">아직 콘텐츠가 없어요.</div>;
  }

  const showArrows = !atStart || !atEnd;

  return (
    <div className="relative group/row">
      <div
        ref={scrollerRef}
        onScroll={sync}
        className={cn(
          'flex gap-4 mt-4 pb-1 overflow-x-auto scrollbar-none snap-x snap-mandatory',
          bleed ? '-mx-6 px-6 xl:-mx-10 xl:px-10' : '',
        )}
      >
        {items.map((it) => (
          <LatestCard key={it.id} item={it} media={media} width={cardWidth} />
        ))}
      </div>

      {showArrows && (
        <>
          <ArrowButton side="left" disabled={atStart} onClick={() => nudge(-1)} />
          <ArrowButton side="right" disabled={atEnd} onClick={() => nudge(1)} />
        </>
      )}
    </div>
  );
}

function ArrowButton({
  side,
  disabled,
  onClick,
}: {
  side: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={side === 'left' ? '이전 콘텐츠' : '다음 콘텐츠'}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // 상시 노출 — 데스크톱엔 가로 스와이프 제스처가 없어서, hover로만 뜨는 화살표는
        // "더 있다"는 사실 자체를 숨긴다. 평소엔 옅게, 행에 올리면 진해진다.
        'absolute top-[38%] z-10 hidden md:flex h-9 w-9 items-center justify-center rounded-full',
        'border border-border bg-white shadow-card transition',
        'opacity-70 group-hover/row:opacity-100 focus-visible:opacity-100',
        'hover:border-ink/20 disabled:pointer-events-none disabled:opacity-0',
        side === 'left' ? '-left-4' : '-right-4',
      )}
    >
      <Icon className="h-4 w-4 text-ink/60" />
    </button>
  );
}

/** 타입별 뱃지 색 — 한 줄에 여러 타입이 섞이므로 색으로 즉시 구분되게 한다 */
const KIND_CHIP: Record<LatestItem['kind'], string> = {
  case: 'text-accent bg-accent/10',
  trend: 'text-[#7C3AED] bg-[#7C3AED]/10',
  tool: 'text-[#0F9D58] bg-[#0F9D58]/10',
  prompt: 'text-[#D97706] bg-[#D97706]/10',
};

export function LatestCard({
  item: it,
  media = 'text-top',
  width,
}: {
  item: LatestItem;
  media?: Media;
  /** px 고정폭(가로 행). 생략하면 부모 폭에 꽉 차는 그리드용 카드가 된다 */
  width?: number;
}) {
  const thumb = (
    <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
      {it.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={it.thumbnail_url}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[34px]">
          {it.thumbEmoji ?? '📄'}
        </div>
      )}
    </div>
  );

  const meta = (
    <div className="mt-2 text-[12px] text-ink/40">
      {it.dateLabel}
      {it.readMin ? ` · 읽기 ${it.readMin}분` : ''}
    </div>
  );

  const head = (
    <div className="flex items-center gap-1.5">
      <span className={cn('text-[11px] font-bold px-1.5 py-0.5 rounded', KIND_CHIP[it.kind])}>
        {it.badge}
      </span>
      {it.isNew && (
        <span className="text-[10px] font-extrabold tracking-wide text-white bg-ink px-1.5 py-0.5 rounded">
          NEW
        </span>
      )}
    </div>
  );

  const text = (
    <>
      <h3 className="mt-1.5 text-[15px] font-bold leading-snug tracking-tight line-clamp-2 keepall group-hover:text-accent transition-colors">
        {it.title}
      </h3>
      {it.summary && (
        <p className="mt-1 text-[13px] text-ink/60 leading-snug line-clamp-2 keepall">
          {it.summary}
        </p>
      )}
    </>
  );

  return (
    <Link
      href={it.href}
      className={cn('group flex flex-col', width ? 'snap-start shrink-0' : 'w-full')}
      style={width ? { width } : undefined}
    >
      {media === 'text-top' ? (
        <>
          {/* 제목 길이가 제각각이어도 썸네일 윗선이 한 줄로 맞도록:
              행이 items-stretch라 카드 높이가 같고, 텍스트 블록이 flex-1로 늘어나
              이미지·메타가 카드 아래쪽에 붙는다 → 이미지 상·하단이 자동 정렬 */}
          <div className="pb-2.5 flex-1">
            {head}
            {text}
          </div>
          {thumb}
          {meta}
        </>
      ) : (
        <>
          {thumb}
          <div className="pt-2.5 flex-1">
            {head}
            {text}
          </div>
          {meta}
        </>
      )}
    </Link>
  );
}
