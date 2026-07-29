import Link from 'next/link';

/**
 * AI 실전케이스 — 가로 스와이프 카드 (카테고리 탭 없이 전체 노출)
 *
 * CSS scroll-snap 으로 네이티브 터치 스와이프 구현(JS 불필요).
 * 모바일: -mx-6 로 화면 끝까지 풀블리드 스와이프 / 데스크톱: 컬럼 내 스크롤.
 */

export interface CaseCardItem {
  id: string;
  href: string;
  title: string;
  summary: string | null;
  thumbnail_url: string | null;
  category: string; // 한글 라벨 (기획/마케팅/...)
}

export function CasesSwipe({ items }: { items: CaseCardItem[] }) {
  if (items.length === 0) {
    return <div className="py-8 text-center text-sm text-ink/40">아직 콘텐츠가 없어요.</div>;
  }

  return (
    <div className="flex gap-3 mt-4 pb-1 overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-6 px-6 lg:mx-0 lg:px-0">
      {items.map((it) => (
        <Link
          key={it.id}
          href={it.href}
          className="group snap-start shrink-0 w-64"
        >
          {/* 메인배너처럼 텍스트 위 · 썸네일 아래 */}
          <div className="pb-2.5">
            <span className="text-[11px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
              {it.category}
            </span>
            <h3 className="mt-1.5 text-[15px] font-bold leading-snug tracking-tight line-clamp-2 keepall group-hover:text-accent transition-colors">
              {it.title}
            </h3>
            {it.summary && (
              <p className="mt-1 text-[13px] text-ink/60 leading-snug line-clamp-2 keepall">
                {it.summary}
              </p>
            )}
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
            {it.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={it.thumbnail_url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
              />
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
