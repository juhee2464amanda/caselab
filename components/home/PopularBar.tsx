import Link from 'next/link';
import type { PopularItem } from '@/components/home/PopularSidebar';

/**
 * 지금 많이 보는 글 — 가로 바 (홈 ③ 섹션 상단)
 *
 * 사이드바 카드(PopularSidebar)와 같은 흰 카드 언어를 쓰되, 한 줄 5열로 납작하게 눌렀다.
 * 바로 아래 오는 '최신 콘텐츠' 그리드가 주인공이라, 이건 훑고 지나가는 바 역할만 한다.
 */
export function PopularBar({ items, note }: { items: PopularItem[]; note?: string }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-[14px] border border-border bg-white px-5 py-4">
      <div className="flex items-baseline justify-between">
        <div className="text-[14px] font-extrabold tracking-tight">지금 많이 보는 글</div>
        {note && <span className="text-[11px] text-ink/40">{note}</span>}
      </div>
      <ol className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-x-5 gap-y-3">
        {items.map((it) => (
          <li key={it.href} className="flex gap-2 items-start group">
            <span className="text-[15px] font-extrabold text-accent shrink-0 leading-[1.35]">
              {it.rank}
            </span>
            <Link href={it.href} className="min-w-0">
              <div className="text-[12.5px] font-semibold leading-[1.35] tracking-tight line-clamp-2 keepall group-hover:text-accent transition-colors">
                {it.title}
              </div>
              <div className="text-[11px] text-ink/40 mt-0.5">{it.category}</div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
