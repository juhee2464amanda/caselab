import type { ReactNode } from 'react';

/** 마커 제거 — 카드·요약·OG처럼 서식을 살릴 수 없는 자리에서 순수 텍스트만 남긴다. */
export function stripInlineMd(text: string): string {
  return text
    .replace(/\*\*([^*\n][^*]*?)\*\*/g, '$1')
    .replace(/__([^_\n][^_]*?)__/g, '$1')
    .replace(/==([^=\n][^=]*?)==/g, '$1')
    .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, '$1');
}

// 미니 인라인 마크업 렌더 — **굵게**, __밑줄__, ==형광펜==, [텍스트](url) 링크.
// admin(caselab_admin lib/inline-md.ts + Editable rich 모드)이 같은 규칙으로 저장한다.
// 규칙을 바꾸면 양쪽을 같이 갱신할 것. 중첩(굵게 안 형광펜)은 1단계만 지원.
// 링크 패턴은 내부 캡처그룹 없이(문자클래스만) 두어 split 결과 오염을 막는다.
export function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*\n][^*]*?\*\*|__[^_\n][^_]*?__|==[^=\n][^=]*?==|\[[^\]\n]+\]\([^)\s]+\))/g);
  if (parts.length === 1) return text;
  return parts.map((p, i) => {
    if (!p) return null;
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('__') && p.endsWith('__')) return <u key={i}>{p.slice(2, -2)}</u>;
    if (p.startsWith('==') && p.endsWith('=='))
      return (
        <mark key={i} className="rounded-sm bg-amber-200/80 px-0.5">
          {p.slice(2, -2)}
        </mark>
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
          {link[1]}
        </a>
      );
    return p;
  });
}
