'use client';

import { useSearchParams } from 'next/navigation';
import { CaseArticle } from '@/components/cases/CaseArticle';
import { CaseCategoryTabs } from '@/components/cases/CaseCategoryTabs';
import { JobFilterSidebar } from '@/components/cases/JobFilterSidebar';
import { FeedCardList, feedDateLabel, type FeedItem } from '@/components/content/FeedCard';
import {
  CASE_CATEGORIES,
  JOB_TAGS,
  JOB_LABELS,
  type CaseCategory,
  type ContentRow,
  type JobTag,
} from '@/types/content';

/**
 * /cases 목록 — 필터를 클라이언트에서 적용한다.
 *
 * 이전엔 page.tsx가 searchParams를 서버에서 읽어 매 요청 동적 렌더링됐다.
 * 전체 목록을 정적(ISR) HTML에 실어 보내고 ?job=·?cat= 필터는 여기서 거르므로
 * 페이지는 캐시에서 즉시 열리고 필터 전환도 서버 왕복이 없다.
 *
 * body 필드는 목록에 불필요하므로 서버에서 제거하고 넘긴다 → CaseListItem.
 */
export type CaseListItem = Omit<ContentRow, 'body'>;

export type JobCounts = { all: number } & Record<JobTag, number>;

function CasesListView({
  items,
  counts,
  activeJob,
  activeCat,
}: {
  items: CaseListItem[];
  counts: JobCounts;
  activeJob?: JobTag;
  activeCat?: CaseCategory;
}) {
  const filtered = items.filter(
    (it) =>
      (!activeCat || it.category?.slug === activeCat) &&
      (!activeJob || (it.job_tags as string[]).includes(activeJob)),
  );

  // 모바일 피드 카드 — 홈 '최신 콘텐츠'와 동일 포맷 (데스크톱은 아래 가로 행 목록 유지)
  const feedItems: FeedItem[] = filtered.map((it) => ({
    id: it.id,
    href: `/cases/${it.slug}`,
    title: it.title,
    summary: it.summary,
    thumbnail_url: it.thumbnail_url,
    // 배지 = 성격 분류 우선 (모바일은 사이드바가 없어 카드가 유일한 분류 노출면) — 미분류는 직무 폴백
    badge:
      it.category?.label ??
      (it.job_tags[0] ? JOB_LABELS[it.job_tags[0]] ?? '실전 케이스' : '실전 케이스'),
    dateLabel: feedDateLabel(it.published_at ?? it.created_at),
    readMin: it.read_min,
  }));

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10 pb-20 flex gap-12">
      <main className="flex-1 min-w-0">
        <CaseCategoryTabs activeCat={activeCat} activeJob={activeJob} />
        {filtered.length === 0 ? (
          <div className="card p-10 text-center text-ink/40">
            조건에 맞는 콘텐츠가 아직 없어요.
          </div>
        ) : (
          <>
            <FeedCardList items={feedItems} className="md:hidden" />
            <div className="hidden md:block">
              {filtered.map((it) => (
                <CaseArticle key={it.id} item={it as ContentRow} />
              ))}
            </div>
          </>
        )}
      </main>
      <JobFilterSidebar activeJob={activeJob} activeCat={activeCat} counts={counts} />
    </div>
  );
}

export function CasesList({ items, counts }: { items: CaseListItem[]; counts: JobCounts }) {
  const sp = useSearchParams();
  const rawJob = sp.get('job') ?? '';
  const rawCat = sp.get('cat') ?? '';
  const activeJob = (JOB_TAGS as readonly string[]).includes(rawJob)
    ? (rawJob as JobTag)
    : undefined;
  const activeCat = (CASE_CATEGORIES as readonly string[]).includes(rawCat)
    ? (rawCat as CaseCategory)
    : undefined;

  return <CasesListView items={items} counts={counts} activeJob={activeJob} activeCat={activeCat} />;
}

/** Suspense fallback 용 — 정적 HTML에는 무필터 전체 목록이 실린다 (SEO·첫 페인트). */
export function CasesListFallback({
  items,
  counts,
}: {
  items: CaseListItem[];
  counts: JobCounts;
}) {
  return <CasesListView items={items} counts={counts} />;
}
