import { renderInline } from '@/lib/inline-md';
import type { FrameworkReference, StepCard } from '@/types/content';

export function FrameworkRefSection({
  reference,
  steps,
}: {
  reference: FrameworkReference;
  steps?: StepCard[];
}) {
  return (
    <>
      <div className="border border-border rounded-xl p-6 bg-white">
        <div className="text-[11px] font-bold tracking-[0.06em] text-ink/40 uppercase mb-3">
          Framework
        </div>
        <div className="text-[17px] font-extrabold tracking-[-0.02em] mb-2 text-ink">
          {reference.name}
        </div>
        <p className="text-sm text-ink/60 leading-[1.65] mb-4 break-keep">
          {renderInline(reference.description)}
        </p>
        {reference.sourceUrl && (
          <div className="border-t border-border pt-3.5">
            <a
              href={reference.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3.5 p-3 bg-muted rounded-lg hover:bg-ink/5 transition-colors group"
            >
              <div className="w-11 h-11 rounded-lg bg-white border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                {reference.sourceThumbnail && (
                  <img
                    src={reference.sourceThumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                {reference.sourceLabel && (
                  <div className="text-[11px] font-semibold text-ink/40 mb-0.5">
                    {reference.sourceLabel}
                  </div>
                )}
                {reference.sourceTitle && (
                  <div className="text-sm font-bold tracking-[-0.02em] text-ink mb-0.5 break-keep">
                    {reference.sourceTitle}
                  </div>
                )}
                <div className="text-xs text-ink/40 font-medium group-hover:text-accent transition-colors">
                  YouTube에서 보기 ↗
                </div>
              </div>
            </a>
          </div>
        )}
      </div>
      {steps && steps.length > 0 && (
        <ol className="list-none mb-0 mt-5">
          {steps.map((s, i) => (
            <li
              key={i}
              className="flex gap-4 py-3.5 border-b border-border items-start last:border-b-0"
            >
              <span className="text-xs font-bold text-ink/40 min-w-[28px] tracking-[0.04em] pt-0.5">
                {String(s.num).padStart(2, '0')}
              </span>
              <div>
                <h4 className="text-[15px] font-bold tracking-[-0.02em] mb-1 text-ink">
                  {s.label}
                </h4>
                {s.description && (
                  <p className="text-[13.5px] text-ink/60 leading-[1.6]">
                    {s.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
