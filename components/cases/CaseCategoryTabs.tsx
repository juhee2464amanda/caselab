import Link from 'next/link';
import {
  CASE_CATEGORIES,
  CASE_CATEGORY_LABELS,
  type CaseCategory,
  type JobTag,
} from '@/types/content';
import { cn } from '@/lib/utils';

// 케이스 성격 분류 탭 — ToolCategoryTabs와 동일 룩. 직무 필터(사이드바)와
// 직교 축이라 탭 이동 시 job 파라미터를 보존한다.
export function CaseCategoryTabs({
  activeCat,
  activeJob,
}: {
  activeCat?: CaseCategory;
  activeJob?: JobTag;
}) {
  const href = (cat?: CaseCategory) => {
    const qs = new URLSearchParams();
    if (cat) qs.set('cat', cat);
    if (activeJob) qs.set('job', activeJob);
    const s = qs.toString();
    return s ? `/cases?${s}` : '/cases';
  };
  return (
    <div className="flex gap-1.5 mb-6 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <TabLink href={href()} active={!activeCat}>
        전체
      </TabLink>
      {CASE_CATEGORIES.map((cat) => (
        <TabLink key={cat} href={href(cat)} active={activeCat === cat}>
          {CASE_CATEGORY_LABELS[cat]}
        </TabLink>
      ))}
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'px-4 py-1.5 text-sm font-medium rounded-full border whitespace-nowrap transition-colors',
        active
          ? 'text-white bg-ink border-ink'
          : 'text-ink/50 border-border hover:text-ink hover:border-ink/40'
      )}
    >
      {children}
    </Link>
  );
}
