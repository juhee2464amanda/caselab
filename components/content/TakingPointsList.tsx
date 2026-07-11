import { renderInline } from '@/lib/inline-md';
import type { TakingPoint } from '@/types/content';

export function TakingPointsList({ items }: { items: TakingPoint[] }) {
  return (
    <div className="flex flex-col gap-2.5 mt-2">
      {items.map((tp, i) => (
        <div
          key={i}
          className="flex gap-5 p-6 border border-border rounded-xl bg-white items-start"
        >
          <span className="text-[13px] font-bold text-ink/40 tracking-[0.06em] leading-[1.5] min-w-[24px] mt-0.5 flex-shrink-0">
            {String(i + 1).padStart(2, '0')}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-base font-extrabold tracking-[-0.02em] mb-1.5 text-ink leading-[1.45]">
              {tp.title}
            </div>
            <div className="text-sm text-ink/60 leading-[1.65] mb-2.5 break-keep">
              {renderInline(tp.description)}
            </div>
            {tp.action && (
              <div className="inline-block text-[12.5px] font-semibold text-ink/60 bg-muted px-2.5 py-1 rounded-md">
                {tp.action}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
