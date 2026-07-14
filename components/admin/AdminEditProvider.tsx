'use client';

import { createContext, useContext, useEffect, useState } from 'react';

/**
 * 관리자 인라인 편집 컨텍스트.
 *   isAdmin  — /api/admin/session 로 확인한 관리자 여부(배지/편집모드 노출 신호)
 *   editMode — 편집모드 토글 상태. ON 일 때만 Editable/EditableImage 가 편집 UI 노출.
 * 일반 방문자에게는 isAdmin=false 라 아무 영향 없음.
 */
interface AdminEditCtx {
  isAdmin: boolean;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
}

const Ctx = createContext<AdminEditCtx>({
  isAdmin: false,
  editMode: false,
  setEditMode: () => {},
});

export const useAdminEdit = () => useContext(Ctx);

export function AdminEditProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/admin/session', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { admin: false }))
      .then((d: { admin?: boolean }) => {
        if (alive) setIsAdmin(Boolean(d?.admin));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return <Ctx.Provider value={{ isAdmin, editMode, setEditMode }}>{children}</Ctx.Provider>;
}
