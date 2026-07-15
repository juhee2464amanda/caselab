'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Copy, ArrowUpRight } from 'lucide-react';
import { track } from '@/lib/analytics/track';
import { TrackedCtaLink } from '@/components/analytics/TrackedCtaLink';
import { renderInline, stripInlineMd } from '@/lib/inline-md';
import { RichSections } from '@/components/content/RichSections';
import { PROMPT_CATEGORY_LABELS, type PromptItem } from '@/types/prompt';

export function PromptDetail({
  prompt,
  related,
}: {
  prompt: PromptItem;
  related: PromptItem[];
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(prompt.prompt).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
        // 북극성(prompt_copy) 원천 — 상세 페이지 복사 계측.
        void track('prompt_copy', {
          prompt_id: prompt.id,
          label: prompt.title,
          category: prompt.category,
          source: 'detail',
        });
      },
      () => {},
    );
  }

  const catLabel = PROMPT_CATEGORY_LABELS[prompt.category];

  return (
    <div className="mx-auto max-w-[760px] px-6 pt-8 pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-ink/50 mb-6">
        <Link href="/prompts" className="hover:text-accent">
          바로 쓰는 프롬프트
        </Link>
        <span className="text-ink/25">›</span>
        <span className="text-ink/70">{catLabel}</span>
      </div>

      {/* Header */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        <span className="text-[12px] font-bold text-accent bg-accent-50 px-2 py-0.5 rounded">
          {catLabel}
        </span>
        {prompt.source &&
          (prompt.sourceUrl ? (
            <a
              href={prompt.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-ink/50 bg-muted px-2 py-0.5 rounded hover:bg-border hover:text-ink transition-colors"
            >
              {prompt.source}
              <ArrowUpRight className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-[12px] font-semibold text-ink/50 bg-muted px-2 py-0.5 rounded">
              {prompt.source}
            </span>
          ))}
      </div>
      <h1 className="text-[26px] md:text-[32px] font-extrabold leading-[1.25] tracking-[-0.03em] break-keep mb-3">
        {prompt.title}
      </h1>
      {prompt.description && (
        <p className="text-[15px] text-ink/60 leading-relaxed break-keep whitespace-pre-line mb-7">
          {renderInline(prompt.description)}
        </p>
      )}

      {/* Prompt body — 복사 대상 전문 */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold text-ink/30 uppercase tracking-[0.08em]">
            프롬프트
          </span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white bg-ink px-3.5 py-1.5 rounded-lg hover:bg-black transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" /> 복사됨
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> 복사하기
              </>
            )}
          </button>
        </div>
        <div className="text-[14px] text-ink/70 leading-relaxed font-mono bg-muted px-5 py-4 rounded-xl border border-border whitespace-pre-wrap break-keep">
          {prompt.prompt}
        </div>
      </section>

      {/* 참고 이미지 — 2장 이상이면 세로로 쌓아 보여준다 */}
      {prompt.images && prompt.images.length > 0 && (
        <section className="mb-8 space-y-3">
          {prompt.images.map((im, i) => (
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
      <RichSections sections={prompt.sections} keyPrefix="prompt-section" contentId={prompt.id} />

      {/* Related */}
      {related.length > 0 && (
        <section className="pt-8 border-t border-border">
          <div className="text-base font-extrabold tracking-[-0.02em] mb-3.5">
            같은 카테고리 프롬프트
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {related.map((r) => (
              <TrackedCtaLink
                key={r.id}
                href={`/prompts/${r.slug}`}
                label="prompt_card"
                meta={{ prompt_id: r.id, slug: r.slug, category: r.category, band: 'related' }}
                className="block p-4 border border-border rounded-xl hover:border-accent hover:shadow-[0_4px_14px_rgba(49,130,246,0.06)] transition-all"
              >
                <span className="inline-block text-[11px] font-bold text-accent bg-accent-50 px-2 py-0.5 rounded mb-1.5">
                  {PROMPT_CATEGORY_LABELS[r.category]}
                </span>
                <h3 className="text-[15px] font-bold tracking-[-0.02em] leading-snug break-keep">
                  {r.title}
                </h3>
                {r.description && (
                  <p className="text-[13px] text-ink/50 leading-relaxed mt-1 line-clamp-2 break-keep">
                    {stripInlineMd(r.description)}
                  </p>
                )}
              </TrackedCtaLink>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
