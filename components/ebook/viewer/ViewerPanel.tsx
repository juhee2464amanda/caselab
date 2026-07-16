'use client';

import { Bookmark, ListTree, Trash2, X } from 'lucide-react';
import type { OutlineItem } from './PdfReader';

export interface BookmarkRow {
  id: string;
  page: number;
  label: string | null;
}

interface ViewerPanelProps {
  tab: 'toc' | 'bookmarks';
  /** PDF 내장 outline (페이지 링크 포함) */
  outline: OutlineItem[];
  /** outline 없는 PDF용 — products.body.toc 제목만 (이동 불가) */
  fallbackToc: string[];
  bookmarks: BookmarkRow[];
  currentPage: number;
  dark: boolean;
  onTabChange: (tab: 'toc' | 'bookmarks') => void;
  onJump: (page: number) => void;
  onRemoveBookmark: (id: string) => void;
  onClose: () => void;
}

export function ViewerPanel({
  tab,
  outline,
  fallbackToc,
  bookmarks,
  currentPage,
  dark,
  onTabChange,
  onJump,
  onRemoveBookmark,
  onClose,
}: ViewerPanelProps) {
  const surface = dark
    ? 'bg-neutral-800 text-neutral-100 border-neutral-700'
    : 'bg-white text-ink border-black/10';
  const mutedText = dark ? 'text-neutral-400' : 'text-ink/50';
  const hoverBg = dark ? 'hover:bg-neutral-700' : 'hover:bg-muted';

  return (
    <aside
      className={`absolute inset-y-0 right-0 z-20 flex w-72 max-w-[85vw] flex-col border-l shadow-lg ${surface}`}
    >
      <div className="flex items-center justify-between border-b border-inherit px-3 py-2">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onTabChange('toc')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm ${tab === 'toc' ? 'font-semibold' : mutedText} ${hoverBg}`}
          >
            <ListTree className="h-4 w-4" /> 목차
          </button>
          <button
            type="button"
            onClick={() => onTabChange('bookmarks')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm ${tab === 'bookmarks' ? 'font-semibold' : mutedText} ${hoverBg}`}
          >
            <Bookmark className="h-4 w-4" /> 북마크
          </button>
        </div>
        <button
          type="button"
          aria-label="패널 닫기"
          onClick={onClose}
          className={`rounded-md p-1.5 ${hoverBg}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {tab === 'toc' &&
          (outline.length > 0 ? (
            <ul>
              {outline.map((item, i) => {
                const next = outline[i + 1];
                const active =
                  currentPage >= item.page && (!next || currentPage < next.page);
                return (
                  <li key={`${item.page}-${i}`}>
                    <button
                      type="button"
                      onClick={() => onJump(item.page)}
                      className={`flex w-full items-baseline justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm ${hoverBg} ${active ? 'font-semibold' : ''}`}
                      style={{ paddingLeft: `${10 + item.depth * 14}px` }}
                    >
                      <span className="line-clamp-2">{item.title}</span>
                      <span className={`shrink-0 text-xs ${mutedText}`}>{item.page}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : fallbackToc.length > 0 ? (
            <>
              <p className={`px-2.5 py-2 text-xs ${mutedText}`}>
                이 전자책은 페이지 링크 정보가 없어 목차 이동을 지원하지 않아요.
              </p>
              <ul>
                {fallbackToc.map((title, i) => (
                  <li key={i} className="px-2.5 py-2 text-sm">
                    {title}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={`px-2.5 py-6 text-center text-sm ${mutedText}`}>
              목차 정보가 없어요.
            </p>
          ))}

        {tab === 'bookmarks' &&
          (bookmarks.length > 0 ? (
            <ul>
              {bookmarks.map((b) => (
                <li key={b.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onJump(b.page)}
                    className={`flex-1 rounded-md px-2.5 py-2 text-left text-sm ${hoverBg}`}
                  >
                    {b.label || `${b.page}페이지`}
                  </button>
                  <button
                    type="button"
                    aria-label="북마크 삭제"
                    onClick={() => onRemoveBookmark(b.id)}
                    className={`rounded-md p-1.5 ${hoverBg} ${mutedText}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`px-2.5 py-6 text-center text-sm ${mutedText}`}>
              읽던 페이지에서 북마크 버튼을 눌러 저장해 보세요.
            </p>
          ))}
      </div>
    </aside>
  );
}
