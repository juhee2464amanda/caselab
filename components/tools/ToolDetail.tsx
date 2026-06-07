import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { ActionsBar } from '@/components/content/ActionsBar';
import { TOOL_CATEGORY_LABELS, type Tool } from '@/types/tool';

export function ToolDetail({ tool, related }: { tool: Tool; related: Tool[] }) {
  const body = tool.body ?? {};
  const catLabel = TOOL_CATEGORY_LABELS[tool.category];

  return (
    <div className="mx-auto max-w-[860px] px-6 pt-8 pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-ink/50 mb-5">
        <Link href="/tools" className="hover:text-accent">도구 모음</Link>
        <span className="text-ink/25">›</span>
        <Link href={`/tools?category=${tool.category}`} className="hover:text-accent">{catLabel}</Link>
        <span className="text-ink/25">›</span>
        <span className="text-ink/70">{tool.name}</span>
      </div>

      {/* Hero */}
      <section className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-6 md:gap-9 md:items-center mb-10">
        <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-border bg-muted">
          {tool.thumbnail_url ? (
            <img src={tool.thumbnail_url} alt={tool.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-border">
              <span className="text-[56px] opacity-50">{tool.thumbnail_emoji ?? '🛠️'}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3.5">
          <span className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-accent bg-accent-50 px-2.5 py-1 rounded">
            {catLabel}
            {body.audience && <span className="text-accent/70">· {body.audience}</span>}
          </span>
          <h1 className="text-[30px] md:text-[38px] font-extrabold leading-[1.2] tracking-[-0.03em] break-keep">
            {tool.name}
          </h1>
          <p className="text-base text-ink/60 leading-relaxed max-w-[520px] break-keep">
            {tool.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            {tool.pricing_label && (
              <span
                className={
                  tool.is_paid
                    ? 'text-xs font-semibold text-ink/50 bg-muted px-2.5 py-1 rounded'
                    : 'text-xs font-semibold text-[#03b26c] bg-[#e8f8f0] px-2.5 py-1 rounded'
                }
              >
                {tool.pricing_label}
              </span>
            )}
            {tool.pro_pricing && (
              <span className="text-xs font-semibold text-ink/50 bg-muted px-2.5 py-1 rounded">
                {tool.pro_pricing}
              </span>
            )}
            {body.tags?.map((t) => (
              <span key={t} className="text-xs font-semibold text-ink/50 bg-muted px-2.5 py-1 rounded">
                {t}
              </span>
            ))}
          </div>
          {tool.url && (
            <div className="flex flex-wrap gap-2.5 mt-2">
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-ink rounded-[10px] hover:bg-black transition-colors"
              >
                공식 사이트 방문
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* About */}
      {body.about && (
        <Section label="어떤 서비스인가요" title={body.about.heading}>
          <div className="space-y-3.5">
            {body.about.paragraphs.map((p, i) => (
              <p key={i} className="text-[15.5px] leading-[1.75] text-ink/80 max-w-[680px] break-keep">
                {p}
              </p>
            ))}
          </div>
        </Section>
      )}

      {/* When to use */}
      {body.whenToUse && body.whenToUse.length > 0 && (
        <Section label="언제 쓰면 좋은가요" title="이런 일을 할 때 가장 빛납니다">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {body.whenToUse.map((w, i) => (
              <div key={i} className="p-4 border border-border rounded-[10px] bg-white">
                {w.icon && <span className="text-lg block mb-1.5">{w.icon}</span>}
                <div className="text-sm font-bold tracking-[-0.02em] mb-1 break-keep">{w.title}</div>
                <div className="text-[13px] text-ink/60 leading-relaxed break-keep">{w.desc}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Features */}
      {body.features && body.features.length > 0 && (
        <Section label="주요 기능" title="이 도구가 잘하는 것">
          <div className="border-t border-border">
            {body.features.map((f, i) => (
              <div key={i} className="flex gap-4 py-4 border-b border-border items-start">
                <div className="text-[13px] font-extrabold text-ink/30 min-w-6 tracking-[0.04em]">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold tracking-[-0.02em] mb-1 break-keep">{f.title}</div>
                  <div className="text-[13.5px] text-ink/60 leading-relaxed break-keep">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Pricing */}
      {body.pricing && body.pricing.length > 0 && (
        <Section label="가격" title="요금 정보">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {body.pricing.map((p, i) => (
              <div key={i} className="p-5 border border-border rounded-xl bg-white">
                <div className="text-[13px] font-bold text-ink/50 uppercase tracking-[0.04em] mb-1.5">
                  {p.name}
                </div>
                <div className="text-lg font-extrabold tracking-[-0.02em] mb-2 break-keep">{p.amount}</div>
                <div className="text-[13px] text-ink/60 leading-relaxed break-keep">{p.includes}</div>
              </div>
            ))}
          </div>
          {body.pricingNote && (
            <p className="mt-3.5 text-[13px] text-ink/40">{body.pricingNote}</p>
          )}
        </Section>
      )}

      <ActionsBar />

      {/* Other tools */}
      {related.length > 0 && (
        <section className="mt-8">
          <div className="text-base font-extrabold tracking-[-0.02em] mb-3.5">같은 카테고리 도구</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/tools/${r.slug}`}
                className="flex items-center gap-3.5 p-3.5 border border-border rounded-[10px] hover:border-accent hover:bg-muted transition-colors"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                  {r.thumbnail_url ? (
                    <img src={r.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl opacity-50">{r.thumbnail_emoji ?? '🛠️'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold tracking-[-0.02em]">{r.name}</div>
                  <div className="text-xs text-ink/50 mt-0.5 line-clamp-1">{r.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="text-[11px] font-bold text-ink/30 uppercase tracking-[0.08em] mb-2.5">
        {label}
      </div>
      {title && (
        <h2 className="text-[22px] font-extrabold tracking-[-0.025em] mb-4 break-keep">{title}</h2>
      )}
      {children}
    </section>
  );
}
