import { renderInline } from '@/lib/inline-md';
import type { PainPoint } from '@/types/content';

export function PainPointsGrid({ items }: { items: PainPoint[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
      {items.map((p, i) => (
        <div key={i} className="p-5 border border-border rounded-xl bg-white">
          <div className="text-xs font-bold text-ink/40 tracking-[0.06em] mb-2.5">
            {p.num}
          </div>
          <div className="text-[15px] font-bold tracking-[-0.02em] mb-2 text-ink leading-[1.4]">
            {p.title}
          </div>
          <div className="text-[13.5px] text-ink/60 leading-[1.65] break-keep">
            {renderInline(p.symptom)} <strong className="text-ink font-semibold">원인</strong>:{' '}
            {renderInline(p.rootCause)}
          </div>
        </div>
      ))}
    </div>
  );
}
