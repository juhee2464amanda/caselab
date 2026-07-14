'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminEdit } from './AdminEditProvider';

interface Props {
  /** site_content key — 예: home.series.tools.thumb */
  k: string;
  src: string | null;
  alt?: string;
  imgClassName?: string;
  /** src 가 없거나 로드 실패 시 표시할 폴백 노드 */
  fallback?: ReactNode;
}

/**
 * 인라인 교체 가능한 이미지.
 * 비관리자/편집모드 OFF 이면 순수 <img>(또는 fallback)와 동일.
 * 편집모드에서는 hover 오버레이 + 더블클릭 시 파일 업로드 → URL 저장.
 *
 * ⚠ 편집모드 오버레이는 position 이 지정된 부모(상대/절대) 안에 놓여야 한다.
 */
export function EditableImage({ k, src, alt = '', imgClassName, fallback }: Props) {
  const { isAdmin, editMode } = useAdminEdit();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [broken, setBroken] = useState(false);

  const visual =
    src && !broken ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} onError={() => setBroken(true)} className={imgClassName} />
    ) : (
      fallback ?? null
    );

  if (!isAdmin || !editMode) return <>{visual}</>;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'same-origin',
        body: fd,
      });
      if (!up.ok) throw new Error();
      const { url } = (await up.json()) as { url: string };
      const saved = await fetch('/api/admin/site-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ key: k, value_type: 'image', value: url }),
      });
      if (!saved.ok) throw new Error();
      setBroken(false);
      router.refresh();
    } catch {
      alert('이미지 업로드에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      {visual}
      <button
        type="button"
        onDoubleClick={() => inputRef.current?.click()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="group absolute inset-0 z-10 flex items-center justify-center bg-black/45 text-white text-[12px] font-bold opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
        title="더블클릭해 이미지 교체"
      >
        {busy ? '업로드 중…' : '더블클릭해 교체'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onPick} />
    </>
  );
}
