'use client';

import { useEffect, useRef, useState, type ReactNode, type TouchEvent as ReactTouchEvent } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HeroItem } from '@/types/content';
import { track } from '@/lib/analytics/track';
import { Editable } from '@/components/admin/Editable';
import { EditableImage } from '@/components/admin/EditableImage';
import { useAdminEdit } from '@/components/admin/AdminEditProvider';

/**
 * HeroCarousel — mockup index.html L318~381 정합 (2026-06-03 재작성)
 *
 * 구조: 좌측(eye-badge + 제목 + 설명 + 메타 + arrows) + 우측 큰 썸네일
 * 동작: translateX 슬라이드 + 좌우 화살표
 */

interface Props {
  items: HeroItem[];
}

const JOB_LABEL: Record<string, string> = {
  planning: '기획',
  marketing: '마케팅',
  sales: '영업',
  solo: '1인 사업',
  strategy: '전략',
  analysis: '데이터/분석',
};

// 트랙별 라벨/경로 — 케이스·트렌드 + 도구·프롬프트·가이드 (큐레이션 폴리모픽 대응)
const TRACK_LABEL: Record<HeroItem['track'], string> = {
  case: '실전 케이스',
  trend: 'AI 트렌드',
  tool: 'AI 도구',
  prompt: '바로 쓰는 프롬프트',
  guide: '공식 가이드',
};
const TRACK_PATH: Record<HeroItem['track'], string> = {
  case: 'cases',
  trend: 'trends',
  tool: 'tools',
  prompt: 'prompts',
  guide: 'guides',
};

// 썸네일 — 없거나 깨진 URL이면 브랜드 플레이스홀더로 폴백 (broken "?" 방지)
// EditableImage 가 broken/fallback 을 관리하며, 편집모드에선 더블클릭 이미지 교체.
function HeroThumb({
  src,
  imgKey,
  overlay,
}: {
  src: string | null;
  imgKey: string;
  overlay?: ReactNode;
}) {
  return (
    <div className="relative w-full md:w-[400px] aspect-[2/1] md:aspect-[5/3] rounded-2xl overflow-hidden bg-muted shrink-0">
      <EditableImage
        k={imgKey}
        src={src}
        imgClassName="w-full h-full object-cover"
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-muted">
            <span className="font-serif text-2xl font-bold text-ink/25 tracking-tight">Caselab</span>
          </div>
        }
      />
      {overlay}
    </div>
  );
}

// 좌우 화살표 — 데스크톱(좌측 컬럼)·모바일(썸네일 우하단 오버레이) 공용.
// go/total 은 HeroCarousel 스코프에 있으므로 렌더 헬퍼로 분리해 마크업 중복만 제거.
const HERO_ARROW_BTN =
  'w-11 h-11 rounded-full bg-white border border-border flex items-center justify-center text-ink/50 hover:border-ink/40 hover:text-ink transition-all';

export function HeroCarousel({ items }: Props) {
  const [idx, setIdx] = useState(0);
  const total = items.length;
  const { editMode } = useAdminEdit();

  // 모바일 스와이프 — 시작 좌표 + "스와이프였는지" 플래그(스와이프 후 링크 이동 방지).
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swipingRef = useRef(false);

  // 슬라이드 노출(impression) — 마운트(#1) + 슬라이드 전환마다. "어떤 배너를 더 보는지".
  useEffect(() => {
    const cur = items[idx];
    if (!cur) return;
    void track('banner_view', {
      label: 'main_banner',
      slot: idx + 1, // #1, #2 ... 순서
      slug: cur.slug,
      content_track: cur.track,
    });
  }, [idx, items]);

  if (total === 0) {
    return (
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-[1100px] px-6 py-14 text-center text-sm text-ink/40">
          곧 첫 콘텐츠를 발행할게요.
        </div>
      </section>
    );
  }

  function go(dir: number) {
    const to = (idx + dir + total) % total;
    void track('cta_click', {
      label: 'main_banner_nav', // 옆으로 넘기는 클릭
      direction: dir > 0 ? 'next' : 'prev',
      from: idx + 1,
      to: to + 1,
    });
    setIdx(to);
  }

  // 모바일 좌우 스와이프 — 버튼 대신 터치 제스처로 전환.
  // 세로 스크롤과 충돌하지 않도록 preventDefault 하지 않고, 가로 이동이 우세할 때만 처리.
  function onTouchStart(e: ReactTouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swipingRef.current = false;
  }
  function onTouchMove(e: ReactTouchEvent) {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) swipingRef.current = true;
  }
  function onTouchEnd(e: ReactTouchEvent) {
    if (total <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // 가로 45px 이상 + 세로보다 우세할 때만 슬라이드 전환
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  }

  // total>1 일 때만. className 으로 배치(데스크톱 좌측 / 모바일 오버레이)를 결정.
  function renderArrows(className: string) {
    if (total <= 1) return null;
    return (
      <div className={className}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            go(-1);
          }}
          className={HERO_ARROW_BTN}
          aria-label="이전"
        >
          <ChevronLeft className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            go(1);
          }}
          className={HERO_ARROW_BTN}
          aria-label="다음"
        >
          <ChevronRight className="h-[18px] w-[18px]" />
        </button>
      </div>
    );
  }

  return (
    // 모바일은 홈의 '인기 콘텐츠' 연회색 밴드 안에 놓이므로 배경을 래퍼에 위임
    <section className="bg-transparent md:bg-white border-b border-border">
      <div className="mx-auto max-w-[1100px] px-6 relative">
        <div
          className="overflow-hidden touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${idx * 100}%)` }}
          >
            {items.map((it, i) => {
              const trackLabel = TRACK_LABEL[it.track] ?? 'AI 트렌드';
              const job = it.job_tags?.[0] ? JOB_LABEL[it.job_tags[0]] : '';
              const eye = job ? `${trackLabel} · ${job}` : trackLabel;
              const href = `/${TRACK_PATH[it.track] ?? 'trends'}/${it.slug}`;

              return (
                <div key={it.slug} className="min-w-full">
                  <Link
                    href={href}
                    onClick={(e) => {
                      // 스와이프 제스처였다면 링크 이동 막기
                      if (swipingRef.current) {
                        e.preventDefault();
                        return;
                      }
                      if (editMode) {
                        // 편집모드에서는 이동 대신 인라인 편집만
                        e.preventDefault();
                        return;
                      }
                      void track('cta_click', {
                        label: 'main_banner',
                        slot: i + 1, // #1, #2 ... 클릭된 슬라이드 순서
                        slug: it.slug,
                        content_track: it.track,
                      });
                    }}
                    className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-12 py-7 md:pt-14 md:pb-7"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="inline-block text-[11px] font-bold text-accent bg-accent/10 px-2.5 py-[3px] rounded mb-3.5 tracking-tight">
                        {eye}
                      </span>
                      {/* 2줄 고정 높이 — 제목이 1줄이어도 아래 요소(요약·메타·화살표) 위치가 슬라이드마다 흔들리지 않도록 */}
                      {/* NOTE: `block` 금지 — line-clamp-2 의 display:-webkit-box 를 덮어써 줄자르기가 무효화됨(h2/p 는 기본 block) */}
                      <Editable
                        as="h2"
                        k={`home.hero.${it.slug}.title`}
                        value={it.title}
                        maxLength={40}
                        className="text-2xl md:text-[32px] font-extrabold leading-[1.3] tracking-tight mb-2.5 line-clamp-2 keepall md:min-h-[84px]"
                      />
                      {/* 요약 — 빈 값이어도 컨테이너를 항상 렌더해 2줄 높이를 예약 (시작 위치 정렬 유지) */}
                      <Editable
                        as="p"
                        k={`home.hero.${it.slug}.summary`}
                        value={it.summary ?? ''}
                        maxLines={2}
                        maxLength={90}
                        className="text-[15px] md:text-base text-ink/60 leading-[1.6] mb-3 max-w-md keepall line-clamp-2 whitespace-pre-line md:min-h-[51px]"
                      />
                      {/* 메타 — 값 유무와 무관하게 고정 높이 확보 */}
                      <div className="text-[13px] text-ink/50 flex items-center gap-1 h-5">
                        {typeof it.read_min === 'number' && <span>읽는데 {it.read_min}분</span>}
                      </div>
                      {/* 화살표 — 데스크톱 전용. 모바일은 스와이프 + 하단 dots */}
                      {renderArrows('hidden md:flex gap-2 mt-4')}
                    </div>
                    <HeroThumb
                      src={it.thumbnail_url}
                      imgKey={`home.hero.${it.slug}.thumb`}
                      overlay={
                        total > 1 ? (
                          <div className="md:hidden absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/25 px-2 py-1 backdrop-blur-sm">
                            {items.map((_, di) => (
                              <span
                                key={di}
                                className={`h-1.5 rounded-full transition-all ${
                                  di === idx ? 'w-3.5 bg-white' : 'w-1.5 bg-white/70'
                                }`}
                              />
                            ))}
                          </div>
                        ) : null
                      }
                    />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
