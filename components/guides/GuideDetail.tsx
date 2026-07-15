import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { renderInline } from '@/lib/inline-md';
import { RichSections } from '@/components/content/RichSections';
import { GUIDE_TAB_LABELS, type GuideItem, type GuideSourceType } from '@/types/guide';

function sourceBadgeClass(type: GuideSourceType): string {
  if (type === 'github') return 'text-white bg-[#24292e]';
  if (type === 'course') return 'text-[#047857] bg-[#d1fae5]';
  return 'text-accent bg-accent-50';
}

export function GuideDetail({ guide }: { guide: GuideItem }) {
  const hasExternal = guide.url && guide.url !== '#';
  return (
    <div className="mx-auto max-w-[760px] px-6 pt-8 pb-20">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-1.5 text-[13px] text-ink/50">
        <Link href="/guides" className="inline-flex items-center gap-1 hover:text-accent">
          <ArrowLeft className="h-3.5 w-3.5" /> 공식 가이드
        </Link>
        <span className="text-ink/25">›</span>
        <span className="text-ink/70">{GUIDE_TAB_LABELS[guide.category]}</span>
      </div>

      {/* Header */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <span className={`rounded px-2 py-0.5 text-[12px] font-bold ${sourceBadgeClass(guide.sourceType)}`}>
          {guide.source}
        </span>
      </div>
      <h1 className="mb-3 text-[26px] font-extrabold leading-[1.25] tracking-[-0.03em] break-keep md:text-[32px]">
        {guide.title}
      </h1>
      {guide.description && (
        <p className="mb-7 whitespace-pre-line break-keep text-[15px] leading-relaxed text-ink/60">
          {renderInline(guide.description)}
        </p>
      )}

      {/* 본문 — 마커 리치 텍스트 */}
      {guide.bodyRich && (
        <div className="mb-8 whitespace-pre-line break-keep text-[15.5px] leading-[1.8] text-ink/80">
          {renderInline(guide.bodyRich)}
        </div>
      )}

      {/* 참고 이미지 */}
      {guide.images && guide.images.length > 0 && (
        <section className="mb-8 space-y-3">
          {guide.images.map((im, i) => (
            <figure key={i} className="overflow-hidden rounded-xl border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.url} alt={im.caption ?? ''} loading="lazy" className="block w-full" />
              {im.caption && (
                <figcaption className="border-t border-border bg-white px-3.5 py-2 text-[12px] text-ink/50 break-keep">
                  {im.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </section>
      )}

      {/* 추가 리치 섹션 — 운영자가 넣은 이미지·링크·갤러리 등 */}
      <RichSections sections={guide.sections} keyPrefix="guide-section" contentId={guide.id} />

      {/* 원문 보기 */}
      {hasExternal && (
        <a
          href={guide.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-ink px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black"
        >
          {guide.linkLabel || '원문 보기'}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
