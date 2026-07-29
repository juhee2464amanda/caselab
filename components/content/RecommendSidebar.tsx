import type { ContentRow, JobTag } from '@/types/content';
import { JOB_LABELS } from '@/types/content';
import { TrackedCtaLink } from '@/components/analytics/TrackedCtaLink';

export function RecommendSidebar({ items }: { items: ContentRow[] }) {
  if (!items.length) return null;
  return (
    <aside className="hidden xl:block w-[240px] flex-shrink-0 py-10 pl-6 border-l border-border">
      <div className="sticky top-[72px]">
        <h3 className="text-[13px] font-extrabold tracking-[-0.02em] mb-3.5 pb-2.5 border-b-2 border-ink">
          이런 컨텐츠는 어때요?
        </h3>
        <div>
          {items.slice(0, 3).map((it, i) => (
            <TrackedCtaLink
              key={it.id}
              href={`/cases/${it.slug}`}
              label="recommend"
              meta={{ slug: it.slug, slot: i + 1 }}
              className="block py-3 border-b border-muted group"
            >
              {it.job_tags[0] && (
                <span className="text-[10px] font-bold text-accent bg-accent-50 px-1.5 py-0.5 rounded-sm inline-block mb-1">
                  {JOB_LABELS[it.job_tags[0] as JobTag] ?? it.job_tags[0]}
                </span>
              )}
              <h4 className="text-sm font-bold leading-snug tracking-[-0.02em] mb-1.5 break-keep group-hover:text-accent transition-colors">
                {it.title}
              </h4>
              {it.thumbnail_url && (
                <div className="aspect-[16/10] rounded-lg overflow-hidden mb-1.5 bg-muted">
                  <img
                    src={it.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              )}
              <div className="text-[11px] text-ink/40">읽기 {it.read_min}분</div>
            </TrackedCtaLink>
          ))}
        </div>
      </div>
    </aside>
  );
}
