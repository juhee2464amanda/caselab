import type { ReactNode } from 'react';

// 글자 색상 마커 {red|텍스트}의 색 이름 → 클래스. admin(caselab_admin lib/inline-md.ts INLINE_COLORS)이 정본 — 같이 갱신.
const INLINE_COLOR_CLS: Record<string, string> = {
  red: 'text-red-600',
  orange: 'text-orange-500',
  green: 'text-green-600',
  blue: 'text-blue-600',
  violet: 'text-violet-600',
  gray: 'text-ink/45',
};

/** 마커 제거 — 카드·요약·OG처럼 서식을 살릴 수 없는 자리에서 순수 텍스트만 남긴다. 중첩 마커도 반복 적용으로 전부 벗긴다. */
export function stripInlineMd(text: string): string {
  let prev = text;
  for (let i = 0; i < 5; i++) {
    const next = prev
      .replace(/\*\*([^*\n][^*]*?)\*\*/g, '$1')
      .replace(/__([^_\n][^_]*?)__/g, '$1')
      .replace(/==([^=\n][^=]*?)==/g, '$1')
      .replace(/\{(?:red|orange|green|blue|violet|gray)\|([^}\n]+)\}/g, '$1')
      .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, '$1');
    if (next === prev) return next;
    prev = next;
  }
  return prev;
}

// 미니 인라인 마크업 렌더 — **굵게**, __밑줄__, ==형광펜==, {red|글자색}, [텍스트](url) 링크.
// admin(caselab_admin lib/inline-md.ts + Editable rich 모드)이 같은 규칙으로 저장한다.
// 규칙을 바꾸면 양쪽을 같이 갱신할 것. 마커 내부는 재귀 렌더 — 중첩(**{red|굵고 빨강}** 등) 지원.
// 링크·색상 패턴은 내부 캡처그룹 없이(문자클래스·비캡처만) 두어 split 결과 오염을 막는다.
export function renderInline(text: string): ReactNode {
  const parts = text.split(
    /(\*\*[^*\n][^*]*?\*\*|__[^_\n][^_]*?__|==[^=\n][^=]*?==|\{(?:red|orange|green|blue|violet|gray)\|[^}\n]+\}|\[[^\]\n]+\]\([^)\s]+\))/g,
  );
  if (parts.length === 1) return text;
  return parts.map((p, i) => {
    if (!p) return null;
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{renderInline(p.slice(2, -2))}</strong>;
    if (p.startsWith('__') && p.endsWith('__')) return <u key={i}>{renderInline(p.slice(2, -2))}</u>;
    if (p.startsWith('==') && p.endsWith('=='))
      return (
        <mark key={i} className="rounded-sm bg-amber-200/80 px-0.5">
          {renderInline(p.slice(2, -2))}
        </mark>
      );
    const color = p.match(/^\{(red|orange|green|blue|violet|gray)\|([^}\n]+)\}$/);
    if (color)
      return (
        <span key={i} className={INLINE_COLOR_CLS[color[1]]}>
          {renderInline(color[2])}
        </span>
      );
    const link = p.match(/^\[([^\]\n]+)\]\(([^)\s]+)\)$/);
    if (link)
      return (
        <a
          key={i}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-2 hover:opacity-80"
        >
          {renderInline(link[1])}
        </a>
      );
    return p;
  });
}
