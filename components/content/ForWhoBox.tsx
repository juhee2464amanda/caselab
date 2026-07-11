import { renderInline } from '@/lib/inline-md';

export function ForWhoBox({ items }: { items: string[] }) {
  return (
    <div className="bg-muted rounded-xl p-6">
      <div className="flex flex-col gap-2">
        {items.map((t, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-[14.5px] text-ink/80 leading-[1.55]"
          >
            <span className="text-ink/50 font-bold flex-shrink-0 mt-0.5">✓</span>
            <span className="break-keep">{renderInline(t)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
