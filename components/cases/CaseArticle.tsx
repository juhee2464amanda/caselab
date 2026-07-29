import Link from 'next/link';
import type { ContentRow, JobTag } from '@/types/content';
import { JOB_LABELS } from '@/types/content';

export function CaseArticle({ item }: { item: ContentRow }) {
  return (
    <Link
      href={`/cases/${item.slug}`}
      className="group flex gap-5 py-6 border-b border-border items-start first:pt-0"
    >
      <div className="flex-1 min-w-0">
        {item.job_tags.length > 0 && (
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {item.job_tags.map((t) => (
              <span
                key={t}
                className="text-[11px] font-bold text-accent bg-accent-50 px-2 py-0.5 rounded-sm"
              >
                {JOB_LABELS[t as JobTag] ?? t}
              </span>
            ))}
          </div>
        )}
        <h2 className="text-lg md:text-xl font-bold leading-snug tracking-[-0.02em] mb-1.5 transition-colors group-hover:text-accent line-clamp-1 break-keep">
          {item.title}
        </h2>
        {item.summary && (
          <p className="text-sm text-ink/60 line-clamp-2 mb-2 leading-[1.55] break-keep">
            {item.summary}
          </p>
        )}
        <div className="text-[13px] text-ink/40">
          읽기 {item.read_min}분 · 적용 {item.apply_min}분
        </div>
      </div>
      <div className="w-[100px] h-[72px] sm:w-[160px] sm:h-[110px] rounded-md sm:rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        {item.thumbnail_url && (
          <img
            src={item.thumbnail_url}
            alt=""
            className="w-full h-full object-cover block"
          />
        )}
      </div>
    </Link>
  );
}
