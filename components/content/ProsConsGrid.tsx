import { renderInline } from '@/lib/inline-md';

export function ProsConsGrid({
  pros,
  cons,
}: {
  pros: string[];
  cons: string[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
      <div className="p-6 rounded-xl border border-border bg-white">
        <div className="text-xs font-bold text-ink/50 uppercase tracking-[0.06em] mb-3.5">
          ↑ 좋았던 점
        </div>
        <ul className="flex flex-col gap-2.5 list-none">
          {pros.map((p, i) => (
            <li
              key={i}
              className="text-[14.5px] leading-[1.65] text-ink/80 flex gap-2.5 items-start break-keep"
            >
              <span className="w-1 h-1 rounded-full bg-ink/40 flex-shrink-0 mt-2.5" />
              <span>{renderInline(p)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-6 rounded-xl border border-border bg-white">
        <div className="text-xs font-bold text-ink/50 uppercase tracking-[0.06em] mb-3.5">
          ↓ 아쉬웠던 점
        </div>
        <ul className="flex flex-col gap-2.5 list-none">
          {cons.map((c, i) => (
            <li
              key={i}
              className="text-[14.5px] leading-[1.65] text-ink/80 flex gap-2.5 items-start break-keep"
            >
              <span className="w-1 h-1 rounded-full bg-ink/40 flex-shrink-0 mt-2.5" />
              <span>{renderInline(c)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
