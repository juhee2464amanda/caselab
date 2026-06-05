export function CategoryHero({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-muted border-b border-border">
      <div className="mx-auto max-w-[1100px] px-6 py-12 md:py-16">
        <h1 className="text-[32px] md:text-[40px] font-extrabold tracking-[-0.03em] text-ink mb-2.5">
          {title}
        </h1>
        <p className="text-base text-ink/60 max-w-[520px] break-keep tracking-[-0.01em]">
          {description}
        </p>
      </div>
    </div>
  );
}
