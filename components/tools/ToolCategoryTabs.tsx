import Link from 'next/link';
import {
  TOOL_CATEGORIES,
  TOOL_CATEGORY_LABELS,
  type ToolCategory,
} from '@/types/tool';
import { cn } from '@/lib/utils';

export function ToolCategoryTabs({
  activeCategory,
}: {
  activeCategory?: ToolCategory;
}) {
  return (
    <div className="flex gap-1.5 mb-6 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <TabLink href="/tools" active={!activeCategory}>
        전체
      </TabLink>
      {TOOL_CATEGORIES.map((cat) => (
        <TabLink
          key={cat}
          href={`/tools?category=${cat}`}
          active={activeCategory === cat}
        >
          {TOOL_CATEGORY_LABELS[cat]}
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
