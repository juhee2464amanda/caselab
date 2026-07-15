'use client';

import { Pencil, Check } from 'lucide-react';
import { useAdminEdit } from './AdminEditProvider';

/**
 * 관리자 플로팅 바 — 화면 우하단.
 * 관리자에게만 "관리자" 배지 + 편집모드 토글을 노출한다.
 * 편집모드 ON 이면 홈의 Editable/EditableImage 영역이 더블클릭 편집 가능해진다.
 */
export function AdminBar() {
  const { isAdmin, editMode, setEditMode } = useAdminEdit();
  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full bg-ink/90 text-white shadow-lg backdrop-blur px-2 py-1.5">
      <span className="pl-2 pr-1 text-[12px] font-bold tracking-tight">관리자</span>
      <button
        type="button"
        onClick={() => setEditMode(!editMode)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors ${
          editMode ? 'bg-accent text-white' : 'bg-white/15 hover:bg-white/25 text-white'
        }`}
        title="더블클릭으로 홈 텍스트·이미지 편집"
      >
        {editMode ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
        {editMode ? '편집 중' : '편집모드'}
      </button>
    </div>
  );
}
