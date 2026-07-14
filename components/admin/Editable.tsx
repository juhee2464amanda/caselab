'use client';

import { useRef, useState, type ElementType } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminEdit } from './AdminEditProvider';

interface Props {
  /** site_content key — 예: home.section.cases.title */
  k: string;
  /** 현재 표시값(오버라이드 병합 후). 편집 취소 시 복원 기준값. */
  value: string;
  /** 렌더 태그 — 원본과 동일한 태그를 넘겨 레이아웃 유지 (기본 span) */
  as?: ElementType;
  className?: string;
  /** Enter 로 저장하지 않고 줄바꿈 허용 */
  multiline?: boolean;
}

/**
 * 인라인 편집 가능한 텍스트.
 * 비관리자/편집모드 OFF 이면 순수 텍스트와 동일하게 렌더(오버헤드 0).
 * 편집모드에서는 점선 아웃라인 + contentEditable, 포커스 아웃/Enter 시 저장.
 */
export function Editable({ k, value, as, className, multiline }: Props) {
  const { isAdmin, editMode } = useAdminEdit();
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const [saving, setSaving] = useState(false);
  const Tag = (as ?? 'span') as ElementType;

  if (!isAdmin || !editMode) {
    return <Tag className={className}>{value}</Tag>;
  }

  async function save() {
    const el = ref.current;
    if (!el) return;
    const next = (el.innerText ?? '').replace(/ /g, ' ').trim();
    if (next === value) return;
    if (!next) {
      el.innerText = value;
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/site-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ key: k, value_type: 'text', value: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      el.innerText = value;
      alert('저장에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Tag
      ref={ref}
      className={`${className ?? ''} rounded-sm outline-dashed outline-1 outline-accent/70 outline-offset-2 cursor-text ${
        saving ? 'opacity-50' : ''
      }`}
      contentEditable={!saving}
      suppressContentEditableWarning
      spellCheck={false}
      title="클릭해 편집 · 벗어나면 저장"
      onClick={(e: React.MouseEvent) => {
        // 부모가 <Link> 인 경우 편집 클릭이 페이지 이동으로 이어지지 않도록 차단
        e.preventDefault();
        e.stopPropagation();
      }}
      onBlur={save}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      }}
    >
      {value}
    </Tag>
  );
}
