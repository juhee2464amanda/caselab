import Link from 'next/link';

/**
 * 인기 있는 글 Top 5 — 사이드바 (mockup index L450~457)
 *
 * 파란 큰 숫자 + 제목 + 카테고리 메타
 */

export interface PopularItem {
  rank: number;
  href: string;
  title: string;
  category: string;
}

export function PopularSidebar({ items }: { items: PopularItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="bg-white border border-border rounded-[14px] p-5">
      <div className="text-base font-extrabold tracking-tight mb-4">
        인기 있는 글
      </div>
      <ul>
        {items.map((it) => (
          <li
            key={it.href}
            className="flex gap-3 py-2.5 border-b border-muted last:border-b-0 items-start group"
          >
            <span className="text-[18px] font-extrabold text-accent min-w-[24px] shrink-0 leading-tight">
              {it.rank}
            </span>
            <Link href={it.href} className="min-w-0">
              <div className="text-sm font-semibold leading-snug tracking-tight truncate group-hover:text-accent transition-colors">
                {it.title}
              </div>
              <div className="text-[11px] text-ink/50 mt-0.5">{it.category}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
