import Link from 'next/link';

const CATEGORIES = [
  { href: '/cases', icon: '📝', name: 'AI 실전케이스', desc: '써봤더니 이랬습니다' },
  { href: '/trends', icon: '📈', name: 'AI 트렌드', desc: '요즘 떠오르는 AI 트렌드 한눈에 보기' },
  { href: '/tools', icon: '🔧', name: '쓸만한 AI 도구', desc: '이 일엔 이런 도구가 있더라' },
  { href: '/prompts', icon: '📋', name: '바로 쓰는 프롬프트', desc: '복사해서 바로 쓰세요' },
  { href: '/guides', icon: '📘', name: '공식 가이드', desc: '공식 문서 핵심 정리' },
];

export function ExploreOtherContent() {
  return (
    <div className="my-10 pt-8 border-t border-border">
      <div className="text-lg font-extrabold tracking-[-0.02em] mb-4">
        다른 콘텐츠 둘러보기
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex items-center gap-3 px-[18px] py-3.5 border border-border rounded-xl flex-shrink-0 min-w-[180px] hover:border-accent hover:bg-muted transition-colors"
          >
            <span className="text-[28px] flex-shrink-0 leading-none">
              {c.icon}
            </span>
            <div>
              <div className="text-sm font-bold tracking-[-0.02em]">{c.name}</div>
              <div className="text-[11px] text-ink/40">{c.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
