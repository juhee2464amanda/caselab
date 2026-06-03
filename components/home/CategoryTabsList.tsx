'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * 카테고리 탭 + 콘텐츠 리스트 — mockup index L405~445 정합
 *
 * 탭: 전체 / 기획 / 마케팅 / 영업 / 1인사업
 * 항목: 썸네일 80px + 카테고리 배지 + 제목 + 설명 한 줄
 */

export interface ArticleItem {
  id: string;
  href: string;
  title: string;
  summary: string | null;
  thumbnail_url: string | null;
  category: string; // 한글 라벨 (기획/마케팅/...)
}

const TABS: { key: string; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'planning', label: '기획' },
  { key: 'marketing', label: '마케팅' },
  { key: 'sales', label: '영업' },
  { key: 'solo', label: '1인사업' },
];

const JOB_LABEL: Record<string, string> = {
  planning: '기획',
  marketing: '마케팅',
  sales: '영업',
  solo: '1인사업',
  strategy: '전략',
  analysis: '데이터/분석',
};

export function CategoryTabsList({ items }: { items: ArticleItem[] }) {
  const [tab, setTab] = useState('all');

  const filtered = tab === 'all'
    ? items
    : items.filter((it) => it.category === JOB_LABEL[tab]);

  return (
    <>
      <div className="flex gap-1.5 py-3.5 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-[7px] text-sm font-medium rounded-full border whitespace-nowrap transition-all tracking-tight ${
              t.key === tab
                ? 'text-white bg-ink border-ink'
                : 'text-ink/50 border-border hover:text-ink hover:border-ink/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-ink/40">
            아직 콘텐츠가 없어요.
          </div>
        ) : (
          filtered.map((it) => (
            <Link
              key={it.id}
              href={it.href}
              className="group flex gap-4 py-4.5 border-b border-border items-start"
            >
              <div className="w-20 h-20 sm:w-20 sm:h-20 max-sm:w-[60px] max-sm:h-[60px] rounded-[10px] max-sm:rounded-lg overflow-hidden shrink-0 bg-muted">
                {it.thumbnail_url && (
                  <img
                    src={it.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover transition-transform group-hover:scale-[1.04]"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                    {it.category}
                  </span>
                </div>
                <h3 className="text-base sm:text-[17px] font-bold leading-snug tracking-tight mb-1 truncate group-hover:text-accent transition-colors keepall">
                  {it.title}
                </h3>
                {it.summary && (
                  <p className="text-sm text-ink/60 leading-snug line-clamp-1 keepall">
                    {it.summary}
                  </p>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
