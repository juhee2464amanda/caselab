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
  /** 허용 최대 줄 수 (예: 배너 서브텍스트 2줄). 초과 줄바꿈/붙여넣기 차단. */
  maxLines?: number;
  /** 허용 최대 글자 수 (예: 배너 헤드라인). 초과해 '늘리는' 입력만 차단. */
  maxLength?: number;
}

// 유니코드 안전 길이 (이모지 등 서로게이트쌍 1글자 처리)
const len = (s: string) => Array.from(s).length;

function caretToEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/**
 * 인라인 편집 가능한 텍스트.
 * 비관리자/편집모드 OFF 이면 순수 텍스트와 동일하게 렌더(오버헤드 0).
 * 편집모드에서는 점선 아웃라인 + contentEditable, 포커스 아웃/Enter 시 저장.
 *
 * maxLines/maxLength 제약(예: 메인배너 2줄):
 *   - 한도를 '초과하면서 더 늘리는' 입력만 되돌린다. 줄이는 편집은 항상 허용하고
 *     이미 한도를 넘긴 기존 값(원본 콘텐츠 제목 등)도 임의로 잘라내지 않는다.
 *   - 한글 IME 조합 중에는 검사하지 않고 compositionend 에서만 확정 검사(조합 깨짐 방지).
 */
export function Editable({ k, value, as, className, multiline, maxLines, maxLength }: Props) {
  const { isAdmin, editMode } = useAdminEdit();
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const [saving, setSaving] = useState(false);
  // 한도 내 마지막 정상 값 — 초과 입력을 되돌릴 기준
  const lastGood = useRef(value);
  const composing = useRef(false);
  const Tag = (as ?? 'span') as ElementType;

  if (!isAdmin || !editMode) {
    return <Tag className={className}>{value}</Tag>;
  }

  // 현재 DOM 텍스트가 한도를 넘겼는지
  function overLimit(text: string): boolean {
    if (maxLines && text.split('\n').length > maxLines) return true;
    if (maxLength && len(text) > maxLength) return true;
    return false;
  }

  // 초과 상태에서 '늘리는' 변경이면 직전 정상 값으로 복원, 아니면 기준값 갱신
  function enforce() {
    const el = ref.current;
    if (!el) return;
    const text = el.innerText;
    if (overLimit(text) && len(text) >= len(lastGood.current)) {
      el.innerText = lastGood.current;
      caretToEnd(el);
    } else {
      lastGood.current = text;
    }
  }

  async function save() {
    const el = ref.current;
    if (!el) return;
    const next = (el.innerText ?? '').replace(/ /g, ' ').trim();
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
      onFocus={() => {
        // 포커스 시점의 DOM 값을 기준으로 (value prop 이 바뀌었을 수 있음)
        lastGood.current = ref.current?.innerText ?? value;
      }}
      onBlur={save}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={() => {
        composing.current = false;
        enforce();
      }}
      onInput={() => {
        if (composing.current) return; // 조합 중엔 검사 보류
        enforce();
      }}
      onPaste={(e: React.ClipboardEvent) => {
        // plain text 만, 캐리지리턴 제거 후 삽입 → enforce 로 한도 확정
        e.preventDefault();
        const t = (e.clipboardData.getData('text/plain') || '').replace(/\r/g, '');
        document.execCommand('insertText', false, t);
        enforce();
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          if (!multiline) {
            // 단일 줄: Enter = 저장 후 blur
            e.preventDefault();
            (e.target as HTMLElement).blur();
            return;
          }
          // 멀티라인: 최대 줄 수 도달 시 추가 줄바꿈 차단
          const lines = (ref.current?.innerText ?? '').split('\n').length;
          if (maxLines && lines >= maxLines) {
            e.preventDefault();
          }
        }
      }}
    >
      {value}
    </Tag>
  );
}
