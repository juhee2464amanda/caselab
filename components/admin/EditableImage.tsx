'use client';

import { useState, type ReactNode } from 'react';
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

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * 인라인 교체 가능한 이미지.
 * 비관리자/편집모드 OFF 이면 순수 <img>(또는 fallback)와 동일.
 * 편집모드에서는 오버레이가 뜨고 → 이미지 파일을 드래그&드롭하면 교체된다.
 * (Safari 가 프로그램적 파일창을 안 열어줘서 클릭-업로드는 제외, 드롭 전용)
 *
 * ⚠ 편집모드 오버레이는 position 이 지정된 부모(상대/절대) 안에 놓여야 한다.
 */
export function EditableImage({ k, src, alt = '', imgClassName, fallback }: Props) {
  const { isAdmin, editMode } = useAdminEdit();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [broken, setBroken] = useState(false);
  const [drag, setDrag] = useState(false);

  const visual =
    src && !broken ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} onError={() => setBroken(true)} className={imgClassName} />
    ) : (
      fallback ?? null
    );

  if (!isAdmin || !editMode) return <>{visual}</>;

  async function uploadFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 올릴 수 있어요.');
      return;
    }
    if (file.size > MAX_BYTES) {
      alert('이미지는 5MB 이하만 가능해요.');
      return;
    }
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
    }
  }

  return (
    <>
      {visual}
      <div
        // 편집모드에서 클릭해도 부모 <Link> 로 이동하지 않도록 차단(교체는 드롭으로만)
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDrag(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDrag(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDrag(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDrag(false);
          void uploadFile(e.dataTransfer.files?.[0]);
        }}
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 px-2 text-center text-white text-[12px] font-bold transition-all ${
          drag
            ? 'opacity-100 bg-accent/70 ring-2 ring-inset ring-white'
            : 'opacity-0 hover:opacity-100 bg-black/50'
        }`}
        title="이미지 파일을 여기로 끌어다 놓아 교체"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="M21 15l-3.6-3.6a2 2 0 0 0-2.8 0L4 22" />
        </svg>
        <span>{busy ? '업로드 중…' : drag ? '여기에 놓기' : '이미지를 끌어다 놓아 교체'}</span>
      </div>
    </>
  );
}
