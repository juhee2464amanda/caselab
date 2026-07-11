import type { ReactNode } from 'react';

// 미니 인라인 마크업 렌더 — **굵게**, ==형광펜== 마커를 강조 요소로.
// admin(caselab_admin lib/inline-md.ts + Editable rich 모드)이 같은 규칙으로 저장한다.
// 규칙을 바꾸면 양쪽을 같이 갱신할 것. 중첩(굵게 안 형광펜)은 1단계만 지원.
export function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*\n][^*]*?\*\*|==[^=\n][^=]*?==)/g);
  if (parts.length === 1) return text;
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('==') && p.endsWith('=='))
      return (
        <mark key={i} className="rounded-sm bg-amber-200/80 px-0.5">
          {p.slice(2, -2)}
        </mark>
      );
    return p;
  });
}
