import { notFound } from 'next/navigation';
import { LatestRow } from '@/components/home/LatestRow';
import { LatestGrid } from '@/components/home/LatestGrid';
import { PopularSidebar } from '@/components/home/PopularSidebar';
import { PopularBar } from '@/components/home/PopularBar';
import { CasesSwipe } from '@/components/home/CasesSwipe';
import { getLatestItems, withoutHeroTop } from '@/lib/home/latest-items';
import { listPublishedContents, listFeaturedContents } from '@/lib/data/contents';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

/**
 * 목업 비교용 개발 전용 라우트 — /dev/home-latest
 *
 * 홈 ③ 섹션('AI 실전케이스' 가로 스와이프)을 '최신 콘텐츠'로 바꾸는 안을
 * 실데이터로 A/B/C/D 나란히 비교한다. D안을 홈에 반영 완료 — 확정되면 이 라우트는 삭제한다.
 */

export const dynamic = 'force-dynamic';

const JOB_LABEL: Record<string, string> = {
  planning: '기획',
  marketing: '마케팅',
  sales: '영업',
  solo: '1인사업',
  strategy: '전략',
  analysis: '데이터/분석',
};

async function listPopular() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('contents')
    .select('id, slug, title, track, view_count, job_tags')
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(5);
  return data ?? [];
}

function SectionNote({
  tag,
  title,
  desc,
}: {
  tag: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="mx-auto max-w-[1100px] px-6 pt-12 pb-1">
      <div className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1 text-[12px] font-extrabold text-white">
        {tag}
      </div>
      <div className="mt-2 text-[15px] font-bold">{title}</div>
      <p className="mt-1 text-[13px] leading-relaxed text-ink/50 keepall">{desc}</p>
    </div>
  );
}

export default async function DevHomeLatestPage({
  searchParams,
}: {
  searchParams: Promise<{ only?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  // ?only=now|a|b|c|d — 한 안만 단독으로 보기(캡처·비교용)
  const only = (await searchParams).only;
  const show = (k: string) => !only || only === k;

  const [curated, cases, latestAll, popular] = await Promise.all([
    listFeaturedContents(5),
    listPublishedContents({ track: 'case', limit: 4 }),
    getLatestItems({ limit: 24 }),
    listPopular(),
  ]);

  // 히어로 1번 슬라이드만 제외 (홈과 동일 규칙)
  const latest = withoutHeroTop(latestAll, curated[0]?.slug);

  const articleItems = cases.map((c) => ({
    id: c.id,
    href: `/cases/${c.slug}`,
    title: c.title,
    summary: c.summary,
    thumbnail_url: c.thumbnail_url,
    category: c.job_tags?.[0] ? JOB_LABEL[c.job_tags[0]] ?? '기획' : '기획',
  }));

  // 현행은 케이스만 직무 라벨(1인사업 등)이 붙어 혼자 층위가 달랐다 — 비교용으로 그대로 둔다
  const popularItemsLegacy = popular.map((p, i) => ({
    rank: i + 1,
    href: `/${p.track === 'case' ? 'cases' : 'trends'}/${p.slug}`,
    title: p.title,
    category: p.job_tags?.[0]
      ? JOB_LABEL[p.job_tags[0]] ?? (p.track === 'case' ? '실전 케이스' : 'AI 트렌드')
      : p.track === 'case'
      ? '실전 케이스'
      : 'AI 트렌드',
  }));

  // 개편안 — 전부 대분류 라벨로 통일
  const popularItems = popularItemsLegacy.map((p, i) => ({
    ...p,
    category: popular[i].track === 'case' ? '실전 케이스' : 'AI 트렌드',
  }));

  return (
    <div className="pb-24">
      {!only && (
      <div className="mx-auto max-w-[1100px] px-6 pt-8">
        <h1 className="text-[26px] font-extrabold tracking-tight">홈 ③ 섹션 개편 목업</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink/60 keepall">
          메인 배너 아래 &apos;AI 실전케이스&apos; 자리를 &apos;최신 콘텐츠&apos;로 바꾸는 안.
          아래는 전부 <b>실데이터</b>로 렌더된 화면입니다. 총 {latestAll.length}건.
        </p>
      </div>
      )}

      {/* ───────── 현행 ───────── */}
      {show('now') && (<>
      <SectionNote
        tag="현행"
        title="AI 실전케이스 (가로 스와이프) + 인기 있는 글"
        desc="케이스 트랙만 4건. 화살표가 없어 데스크톱에선 뒤쪽 카드가 잘 발견되지 않고, 히어로에 이미 뜬 콘텐츠와 겹치기도 한다."
      />
      <section className="py-8 bg-user-subtle">
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="flex flex-col lg:flex-row gap-0 lg:gap-12">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="text-[26px] font-extrabold tracking-tight">AI 실전케이스</h2>
                <a href="/cases" className="text-[13px] font-medium text-accent">
                  전체 보기
                </a>
              </div>
              <CasesSwipe items={articleItems} />
            </div>
            <aside className="w-full lg:w-[280px] lg:pt-12 shrink-0">
              <PopularSidebar items={popularItemsLegacy} />
            </aside>
          </div>
        </div>
      </section>
      </>)}

      {/* ───────── A안 ───────── */}
      {show('a') && (<>
      <SectionNote
        tag="A안 · 요청안"
        title="최신 콘텐츠 가로 행 + 인기 사이드바 유지"
        desc="현행 레이아웃 골격은 그대로 두고 내용만 '전 타입 최신순'으로 교체. 타입별 색 뱃지 + 7일 이내 NEW. 마우스용 좌우 화살표 상시 노출 + 4번째 카드가 살짝 걸쳐 보이게. 변경 폭이 가장 작고 인기 글 동선도 지킨다."
      />
      <section className="py-8 bg-user-subtle">
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="flex flex-col lg:flex-row gap-0 lg:gap-12">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="text-[26px] font-extrabold tracking-tight">최신 콘텐츠</h2>
                <a href="/search" className="text-[13px] font-medium text-accent">
                  전체 보기
                </a>
              </div>
              {/* 216px → 3장 + 4번째가 살짝 걸쳐 보인다(더 있다는 신호) */}
              <LatestRow items={latest} media="text-top" cardWidth={216} />
            </div>
            <aside className="w-full lg:w-[280px] lg:pt-12 shrink-0">
              <PopularSidebar items={popularItems} />
            </aside>
          </div>
        </div>
      </section>
      </>)}

      {/* ───────── B안 ───────── */}
      {show('b') && (<>
      <SectionNote
        tag="B안"
        title="전폭 가로 행 (이미지 위) + 인기 글은 아래로"
        desc="사이드바를 빼고 1100px 전폭을 최신 콘텐츠에 준다. 카드가 4장 보이고 이미지가 위라 한 줄 스캔이 빠르다. 인기 글은 아래 가로 스트립으로 내려 '최신 → 인기' 순서가 된다."
      />
      <section className="py-8 bg-user-subtle">
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[26px] font-extrabold tracking-tight">최신 콘텐츠</h2>
            <a href="/search" className="text-[13px] font-medium text-accent">
              전체 보기
            </a>
          </div>
          {/* 244px → 4장 + 5번째가 살짝 걸쳐 보인다 */}
          <LatestRow items={latest} media="image-top" cardWidth={244} />

          <div className="mt-10 border-t border-border pt-6">
            <div className="text-[15px] font-extrabold tracking-tight">지금 많이 보는 글</div>
            <ol className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-x-5 gap-y-3">
              {popularItems.map((p) => (
                <li key={p.href} className="flex gap-2 items-start">
                  <span className="text-[16px] font-extrabold text-accent shrink-0 leading-tight">
                    {p.rank}
                  </span>
                  <a href={p.href} className="min-w-0">
                    <div className="text-[13px] font-semibold leading-snug tracking-tight line-clamp-2 keepall">
                      {p.title}
                    </div>
                    <div className="text-[11px] text-ink/50 mt-0.5">{p.category}</div>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
      </>)}

      {/* ───────── C안 ───────── */}
      {show('c') && (<>
      <SectionNote
        tag="C안"
        title="4열 그리드 + 타입 필터 칩 (가로 스크롤 없음)"
        desc="데스크톱엔 가로 스크롤 제스처가 없다는 점을 아예 인정하고, 8건을 한 번에 펼친다. 대신 칩으로 '도구만 / 케이스만' 좁혀보게 해서 목록 페이지로 안 가고도 탐색이 끝난다. 세로 길이는 가장 길다."
      />
      <section className="py-8 bg-user-subtle">
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[26px] font-extrabold tracking-tight">최신 콘텐츠</h2>
            <a href="/search" className="text-[13px] font-medium text-accent">
              전체 보기
            </a>
          </div>
          <LatestGrid items={latest} rows={2} />
        </div>
      </section>
      </>)}

      {/* ───────── D안 ───────── */}
      {show('d') && (<>
      <SectionNote
        tag="D안 · C + 인기 상단"
        title="지금 많이 보는 글(가로 바) → 최신 콘텐츠 4열 그리드"
        desc="C안 그리드를 본체로 두고, B안의 인기 스트립을 최신 콘텐츠 '위'로 올린 안. 히어로(큐레이션) → 인기(검증된 것) → 최신(새로 온 것) 순서라 처음 온 사람은 인기부터, 재방문자는 그리드부터 본다. 인기 바는 흰 카드 한 줄로 눌러 두어 최신 그리드가 주인공 자리를 지킨다."
      />
      <section className="py-8 bg-user-subtle">
        <div className="mx-auto max-w-[1100px] px-6">
          <PopularBar items={popularItems} note="최근 7일 조회수" />

          <div className="mt-9 flex items-center justify-between">
            <h2 className="text-[26px] font-extrabold tracking-tight">최신 콘텐츠</h2>
            <a href="/search" className="text-[13px] font-medium text-accent">
              전체 보기
            </a>
          </div>
          <LatestGrid items={latest} rows={2} />
        </div>
      </section>
      </>)}
    </div>
  );
}
