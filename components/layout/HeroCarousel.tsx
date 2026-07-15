'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HeroItem } from '@/types/content';
import { track } from '@/lib/analytics/track';

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
function HeroThumb({ src }: { src: string | null }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="w-full md:w-[400px] aspect-[16/9] md:aspect-[5/3] rounded-2xl overflow-hidden bg-muted shrink-0">
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" onError={() => setBroken(true)} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-muted">
          <span className="font-serif text-2xl font-bold text-ink/25 tracking-tight">Caselab</span>
        </div>
      )}
    </div>
  );
}

export function HeroCarousel({ items }: Props) {
  const [idx, setIdx] = useState(0);
  const total = items.length;

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

  return (
    <section className="bg-white border-b border-border">
      <div className="mx-auto max-w-[1100px] px-6 relative">
        <div className="overflow-hidden">
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
                    onClick={() =>
                      void track('cta_click', {
                        label: 'main_banner',
                        slot: i + 1, // #1, #2 ... 클릭된 슬라이드 순서
                        slug: it.slug,
                        content_track: it.track,
                      })
                    }
                    className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12 py-10 md:py-14 md:pb-7"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="inline-block text-[11px] font-bold text-accent bg-accent/10 px-2.5 py-[3px] rounded mb-3.5 tracking-tight">
                        {eye}
                      </span>
                      {/* 2줄 고정 높이 — 제목이 1줄이어도 아래 요소(요약·메타·화살표) 위치가 슬라이드마다 흔들리지 않도록 */}
                      <h2 className="text-2xl md:text-[32px] font-extrabold leading-[1.3] tracking-tight mb-2.5 line-clamp-2 keepall min-h-[62px] md:min-h-[84px]">
                        {it.title}
                      </h2>
                      {/* 요약 — 빈 값이어도 컨테이너를 항상 렌더해 2줄 높이를 예약 (시작 위치 정렬 유지) */}
                      <p className="text-[15px] md:text-base text-ink/60 leading-[1.6] mb-3 max-w-md keepall line-clamp-2 whitespace-pre-line min-h-[48px] md:min-h-[51px]">
                        {it.summary}
                      </p>
                      {/* 메타 — 값 유무와 무관하게 고정 높이 확보 */}
                      <div className="text-[13px] text-ink/50 flex items-center gap-1 h-5">
                        {typeof it.read_min === 'number' && <span>읽는데 {it.read_min}분</span>}
                      </div>
                      {/* arrows */}
                      {total > 1 && (
                        <div className="flex gap-2 mt-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              go(-1);
                            }}
                            className="w-11 h-11 rounded-full bg-white border border-border flex items-center justify-center text-ink/50 hover:border-ink/40 hover:text-ink transition-all"
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
                            className="w-11 h-11 rounded-full bg-white border border-border flex items-center justify-center text-ink/50 hover:border-ink/40 hover:text-ink transition-all"
                            aria-label="다음"
                          >
                            <ChevronRight className="h-[18px] w-[18px]" />
                          </button>
                        </div>
                      )}
                    </div>
                    <HeroThumb src={it.thumbnail_url} />
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
