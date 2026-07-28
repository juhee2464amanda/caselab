import { JOB_LABELS, type JobTag } from '@/types/content';

export function ContentHeader({
  title,
  summary,
  jobTags,
  readMin,
  applyMin,
  publishedAt,
}: {
  title: string;
  summary: string | null;
  jobTags: JobTag[];
  readMin: number;
  /** 생략하면 적용 시간을 표시하지 않는다 (트렌드 상세). */
  applyMin?: number;
  publishedAt: string | null;
}) {
  const primaryJob = jobTags[0];
  const dateStr = publishedAt
    ? new Date(publishedAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <header className="py-10 md:py-14">
      {primaryJob && (
        <span className="inline-block text-xs font-bold text-accent bg-accent-50 px-2.5 py-1 rounded mb-4">
          실전 케이스 · {JOB_LABELS[primaryJob] ?? primaryJob}
        </span>
      )}
      <h1 className="text-[28px] md:text-[36px] font-extrabold leading-[1.3] tracking-[-0.03em] mb-3 break-keep">
        {title}
      </h1>
      {summary && (
        <p className="text-[17px] text-ink/60 leading-relaxed max-w-[600px] mb-5 break-keep">
          {summary}
        </p>
      )}
      <div className="flex flex-wrap gap-3 text-[13px] text-ink/40 pb-6 border-b border-border">
        {dateStr && <span>{dateStr}</span>}
        <span>읽는데 {readMin}분</span>
        {applyMin != null && applyMin > 0 && <span>적용 {applyMin}분</span>}
      </div>
    </header>
  );
}
