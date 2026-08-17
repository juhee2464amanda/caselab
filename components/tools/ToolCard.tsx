import Link from 'next/link';
import type { Tool } from '@/types/tool';
import { TOOL_CATEGORY_LABELS } from '@/types/tool';
import { stripInlineMd } from '@/lib/inline-md';

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group block border border-border rounded-2xl overflow-hidden bg-white transition-all hover:border-accent hover:shadow-[0_6px_20px_rgba(49,130,246,0.08)] hover:-translate-y-0.5"
    >
      <div className="aspect-[16/10] bg-muted overflow-hidden relative">
        {tool.thumbnail_url ? (
          <img
            src={tool.thumbnail_url}
            alt={tool.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-border relative">
            <span className="absolute top-2.5 left-2.5 text-[10px] font-bold text-ink/60 bg-white/90 px-2 py-0.5 rounded tracking-[0.02em]">
              이미지 준비 중
            </span>
            <span className="text-[48px] opacity-50 grayscale-[0.2] leading-none">
              {tool.thumbnail_emoji ?? '🛠️'}
            </span>
          </div>
        )}
      </div>
      <div className="px-5 pt-4 pb-5">
        <div className="flex items-baseline justify-between gap-2 mb-2.5">
          <div className="text-[17px] font-extrabold tracking-[-0.02em] text-ink">
            {tool.name}
          </div>
          <div className="text-[11px] font-semibold text-ink/50">
            {TOOL_CATEGORY_LABELS[tool.category]}
          </div>
        </div>
        <p className="text-[13.5px] text-ink/60 leading-[1.55] mb-3.5 line-clamp-3 break-keep">
          {stripInlineMd(tool.description ?? '')}
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {tool.pricing_label && (
            <span
              className={
                tool.is_paid
                  ? 'text-[11px] font-semibold text-ink/50 bg-muted px-2 py-0.5 rounded'
                  : 'text-[11px] font-semibold text-[#03b26c] bg-[#e8f8f0] px-2 py-0.5 rounded'
              }
            >
              {tool.pricing_label}
            </span>
          )}
          {tool.pro_pricing && (
            <span className="text-[11px] font-semibold text-ink/50 bg-muted px-2 py-0.5 rounded">
              {tool.pro_pricing}
            </span>
          )}
          {tool.has_review && (
            <span className="text-[11px] font-semibold text-accent bg-accent-50 px-2 py-0.5 rounded">
              사용기 1편
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
