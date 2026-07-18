import Link from 'next/link';

/**
 * 카테고리 칩 — 모바일 전용 sticky 가로 스크롤 내비 (요즘IT 패턴)
 *
 * GNB(sticky top-0, h-14) 바로 아래 top-14 로 고정. 데스크톱은 GNB 메뉴가 있으므로 숨김.
 */

const CHIPS = [
  { label: '실전케이스', href: '/cases' },
  { label: 'AI 트렌드', href: '/trends' },
  { label: 'AI 도구', href: '/tools' },
  { label: '프롬프트', href: '/prompts' },
  { label: '공식 가이드', href: '/guides' },
  { label: 'ebook', href: '/ebooks' },
];

export function CategoryChips() {
  return (
    <nav
      aria-label="카테고리 바로가기"
      className="md:hidden sticky top-14 z-30 bg-white/95 backdrop-blur border-b border-border"
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-none snap-x px-4 py-2.5">
        {CHIPS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="snap-start shrink-0 whitespace-nowrap rounded-full border border-border bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink/70 active:bg-muted"
          >
            {c.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
