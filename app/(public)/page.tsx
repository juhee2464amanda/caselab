import { HeroCarousel } from '@/components/layout/HeroCarousel';
import { FreeBookBanner } from '@/components/home/FreeBookBanner';
import { CasesSwipe } from '@/components/home/CasesSwipe';
import { LatestFeed } from '@/components/home/LatestFeed';
import { PopularSidebar } from '@/components/home/PopularSidebar';
import { SeriesGrid } from '@/components/home/SeriesGrid';
import { VoteCompact } from '@/components/home/VoteCompact';
import { SuggestInline } from '@/components/home/SuggestInline';
import { Editable } from '@/components/admin/Editable';
import { listPublishedContents, listFeaturedContents } from '@/lib/data/contents';
import { listProducts } from '@/lib/data/products';
import { getSiteOverrides, pick } from '@/lib/data/site-content';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

/**
 * 메인 — user mockup index.html 풀 정합 (2026-06-03)
 *
 * 섹션 구성 (mockup 정합):
 *   1. HeroCarousel (수동 슬라이드 + 좌우 arrow)
 *   2. FreeBookBanner (무료 전자책 그라데이션)
 *   3. AI 실전케이스 + Popular 사이드바 (band-alt 연회색)
 *   4. 일잘러의 AI 자료실 (4 series cards)
 *   5. 이런 거 다뤄주세요 (vote compact + suggest)
 *   (Footer는 layout.tsx)
 */

export const revalidate = 60;

const JOB_LABEL: Record<string, string> = {
  planning: '기획',
  marketing: '마케팅',
  sales: '영업',
  solo: '1인사업',
  strategy: '전략',
  analysis: '데이터/분석',
};

async function listTopics() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('topic_suggestions')
    .select('id, title, vote_count')
    .eq('status', 'open')
    .order('vote_count', { ascending: false })
    .limit(3);
  return data ?? [];
}

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

// 모바일 통합 피드용 tools 콘텐츠 — 자료 타입(tool/prompt) 최신순.
// listTools/listPrompts는 각 목록 페이지용 매핑이라, 피드에 필요한 필드만 직접 조회한다.
type FeedToolRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  thumbnail_emoji: string | null;
  category: 'tool' | 'prompt';
  created_at: string;
};

async function listFeedTools(): Promise<FeedToolRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('tools')
    .select('id, slug, name, description, thumbnail_url, thumbnail_emoji, category, created_at')
    .eq('status', 'published')
    .in('category', ['tool', 'prompt'])
    .order('created_at', { ascending: false })
    .limit(24);
  return (data ?? []) as FeedToolRow[];
}

async function listToolStats() {
  if (!isSupabaseConfigured()) {
    return { tool: 0, prompt: 0, guide: 0 };
  }
  const supabase = await createSupabaseServerClient();
  const [tool, prompt, guide] = await Promise.all([
    supabase.from('tools').select('id', { count: 'exact', head: true }).eq('category', 'tool'),
    supabase.from('tools').select('id', { count: 'exact', head: true }).eq('category', 'prompt'),
    supabase.from('tools').select('id', { count: 'exact', head: true }).eq('category', 'guide'),
  ]);
  return {
    tool: tool.count ?? 0,
    prompt: prompt.count ?? 0,
    guide: guide.count ?? 0,
  };
}

export default async function HomePage() {
  const [curatedRaw, cases, trends, latest, feedTools, topics, popular, toolStats, trendCount, overrides, products] =
    await Promise.all([
      listFeaturedContents(5),
      listPublishedContents({ track: 'case', limit: 4 }),
      listPublishedContents({ track: 'trend', limit: 4 }),
      // 모바일 통합 피드 — 케이스·트렌드 혼합 최신순, 더보기 노출분까지 한 번에
      listPublishedContents({ limit: 24 }),
      listFeedTools(),
      listTopics(),
      listPopular(),
      listToolStats(),
      isSupabaseConfigured()
        ? (async () => {
            const supabase = await createSupabaseServerClient();
            const { count } = await supabase
              .from('contents')
              .select('id', { count: 'exact', head: true })
              .eq('track', 'trend')
              .eq('status', 'published');
            return count ?? 0;
          })()
        : Promise.resolve(0),
      getSiteOverrides(),
      listProducts(),
    ]);

  // 홈 배너 — 대표 ebook(무료 우선)이 판매 준비중이면 '준비 중' 배너로 대체
  const featuredBook = products.find((b) => b.price === 0) ?? products[0];
  const bannerComingSoon = featuredBook?.body?.comingSoon === true;

  // 히어로 — 원본 contents 는 그대로 두고 홈 표시값만 오버라이드 (home.hero.<slug>.*)
  const curated = curatedRaw.map((it) => ({
    ...it,
    title: pick(overrides, `home.hero.${it.slug}.title`, it.title),
    summary: pick(overrides, `home.hero.${it.slug}.summary`, it.summary ?? ''),
    thumbnail_url: pick(overrides, `home.hero.${it.slug}.thumb`, it.thumbnail_url ?? '') || null,
  }));

  // 시리즈 카드 4개 데이터 — 하드코딩 기본값 위에 site_content 오버라이드 병합
  const series = [
    {
      k: 'home.series.tools',
      href: '/tools',
      name: pick(overrides, 'home.series.tools.name', '쓸만한 AI 도구'),
      desc: pick(overrides, 'home.series.tools.desc', '실무자가 검증한 도구만 골라 정리'),
      thumb: pick(
        overrides,
        'home.series.tools.thumb',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
      ),
      count: toolStats.tool,
      recentTitle: null,
      freshText: `${toolStats.tool}개 · 오늘 업데이트`,
    },
    {
      k: 'home.series.prompts',
      href: '/prompts',
      name: pick(overrides, 'home.series.prompts.name', '바로 쓰는 프롬프트'),
      desc: pick(overrides, 'home.series.prompts.desc', '출처가 명시된 복사용 템플릿'),
      thumb: pick(
        overrides,
        'home.series.prompts.thumb',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80',
      ),
      count: toolStats.prompt,
      recentTitle: null,
      freshText: `${toolStats.prompt}개 · 오늘 업데이트`,
    },
    {
      k: 'home.series.guides',
      href: '/guides',
      name: pick(overrides, 'home.series.guides.name', '공식 가이드'),
      desc: pick(overrides, 'home.series.guides.desc', 'OpenAI·Anthropic 공식 문서 핵심'),
      thumb: pick(overrides, 'home.series.guides.thumb', '/thumbs/official-guides.png'),
      count: toolStats.guide,
      recentTitle: null,
      freshText: `${toolStats.guide}개 · 오늘 업데이트`,
    },
    {
      k: 'home.series.trends',
      href: '/trends',
      name: pick(overrides, 'home.series.trends.name', 'AI 트렌드'),
      desc: pick(overrides, 'home.series.trends.desc', '요즘 떠오르는 AI 트렌드 한눈에 보기'),
      thumb: pick(
        overrides,
        'home.series.trends.thumb',
        'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&q=80',
      ),
      count: trendCount,
      recentTitle: trends[0]?.title ?? null,
      freshText: `${trendCount}개 · 오늘 업데이트`,
    },
  ];

  // 실전 케이스 리스트 → CategoryTabsList 항목
  const articleItems = cases.map((c) => ({
    id: c.id,
    href: `/cases/${c.slug}`,
    title: c.title,
    summary: c.summary,
    thumbnail_url: c.thumbnail_url,
    category: c.job_tags?.[0] ? JOB_LABEL[c.job_tags[0]] ?? '기획' : '기획',
  }));

  // Popular Top 5 → PopularSidebar 항목
  const popularItems = popular.map((p, i) => ({
    rank: i + 1,
    href: `/${p.track === 'case' ? 'cases' : 'trends'}/${p.slug}`,
    title: p.title,
    category: p.job_tags?.[0]
      ? JOB_LABEL[p.job_tags[0]] ?? (p.track === 'case' ? '실전 케이스' : 'AI 트렌드')
      : p.track === 'case'
      ? '실전 케이스'
      : 'AI 트렌드',
  }));

  // 룰: 메인배너 1번(히어로 첫 슬라이드) 콘텐츠는 최신 피드에서 제외 → 피드 1번과 겹치지 않게
  const heroTopSlug = curatedRaw[0]?.slug;

  // 모바일 통합 피드 — 케이스·트렌드(contents) + 도구·프롬프트(tools) 병합 최신순 카드
  const feedItems = [
    ...latest
      .filter((c) => c.slug !== heroTopSlug)
      .map((c) => ({
      id: c.id,
      href: `/${c.track === 'case' ? 'cases' : 'trends'}/${c.slug}`,
      title: c.title,
      summary: c.summary,
      thumbnail_url: c.thumbnail_url,
      badge:
        c.track === 'trend'
          ? 'AI 트렌드'
          : c.job_tags?.[0]
          ? JOB_LABEL[c.job_tags[0]] ?? '실전 케이스'
          : '실전 케이스',
      readMin: c.read_min,
      date: c.published_at ?? c.created_at,
    })),
    ...feedTools
      .filter((t) => t.slug !== heroTopSlug)
      .map((t) => ({
      id: t.id,
      href: `/${t.category === 'prompt' ? 'prompts' : 'tools'}/${t.slug}`,
      title: t.name,
      summary: t.description,
      thumbnail_url: t.thumbnail_url,
      thumbEmoji: t.thumbnail_emoji,
      badge: t.category === 'prompt' ? '프롬프트' : 'AI 도구',
      readMin: null,
      date: t.created_at,
    })),
  ]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 24)
    // ISO 문자열 앞 10자(YYYY-MM-DD)를 점 구분으로 — 서버에서 확정해 하이드레이션 불일치 방지
    .map(({ date, ...item }) => ({
      ...item,
      dateLabel: (date ?? '').slice(0, 10).replace(/-/g, '.'),
    }));

  return (
    // flex-col + order — 모바일에선 무료 ebook 배너를 맨 아래로 내린다(데스크톱은 원래 2번째 유지).
    <div className="flex flex-col">
      {/* ⓪ 브랜드 띠배너 — 검은 얇은 띠 (2줄 채널 소개)
          모바일 전용: 데스크톱은 GNB 로고 옆 태그라인이 같은 역할을 하므로 숨긴다 */}
      <Editable
        as="div"
        k="home.strip.text"
        maxLines={2}
        value={pick(
          overrides,
          'home.strip.text',
          '매일 쏟아지는 AI, 뭐부터 봐야 할지 막막할 때\n검증된 케이스·도구·프롬프트만 골라 정리해요',
        )}
        className="md:hidden bg-ink text-center text-[14px] font-medium leading-[1.65] tracking-tight text-white/90 py-3 px-4"
      />

      {/* ① Hero Carousel — 모바일에선 연회색 밴드로 피드와 다른 영역임을 구분 (타이틀 없음) */}
      <div className="bg-user-subtle md:bg-transparent">
        <HeroCarousel items={curated} />
      </div>

      {/* ② 무료 전자책 배너 (준비중이면 '준비 중' 배너로 대체) — ebook 준비중이라 모바일 숨김, 데스크톱 원위치 */}
      <div className="hidden md:block order-4 md:order-none">
        <FreeBookBanner
          comingSoon={bannerComingSoon}
          tag={pick(overrides, 'home.banner.tag', '무료 배포 중')}
          title={pick(overrides, 'home.banner.title', 'AI, 누구나 쉽게 시작할 수 있도록')}
          desc={pick(
            overrides,
            'home.banner.desc',
            '첫 번째 ebook을 무료로 드립니다. 다운로드 후 바로 읽어보세요.',
          )}
          cta={pick(overrides, 'home.banner.cta', '무료로 받기 →')}
        />
      </div>

      {/* ③-m 최신 콘텐츠 통합 피드 — 모바일 전용 (데스크톱은 아래 ③ 실전케이스 섹션 유지)
          히어로에서 이어지는 대형 카드 피드가 쭉 내려간다 — 인기글·자료실 없이 콘텐츠만 */}
      <section className="md:hidden py-6 order-1">
        <div className="px-6">
          <Editable
            as="h2"
            k="home.section.feed.title"
            value={pick(overrides, 'home.section.feed.title', '최신 콘텐츠')}
            className="text-[22px] font-extrabold tracking-tight"
          />
          <LatestFeed items={feedItems} />
        </div>
      </section>

      {/* ③ 실전케이스 + Popular 사이드바 (연회색) — 모바일에선 ③-m 통합 피드로 대체 */}
      <section className="hidden md:block py-10 md:py-14 bg-user-subtle">
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="flex flex-col lg:flex-row gap-0 lg:gap-12">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <Editable
                  as="h2"
                  k="home.section.cases.title"
                  value={pick(overrides, 'home.section.cases.title', 'AI 실전케이스')}
                  className="text-[22px] md:text-[26px] font-extrabold tracking-tight"
                />
                <a
                  href="/cases"
                  className="text-[13px] font-medium text-accent hover:underline underline-offset-[3px]"
                >
                  전체 보기
                </a>
              </div>
              <CasesSwipe items={articleItems} />
            </div>

            <aside className="w-full lg:w-[280px] lg:pt-12 shrink-0">
              <PopularSidebar items={popularItems} />
            </aside>
          </div>
        </div>
      </section>

      {/* ④ 일잘러의 AI 자료실 (4 series) — 모바일 숨김(카테고리 칩으로 진입), 데스크톱 유지 */}
      <section className="hidden md:block py-10 md:py-14">
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] md:text-[26px] font-extrabold tracking-tight">
              <Editable
                k="home.section.vault.title"
                value={pick(overrides, 'home.section.vault.title', '일잘러의 AI 자료실')}
              />
              <Editable
                as="span"
                k="home.section.vault.badge"
                value={pick(overrides, 'home.section.vault.badge', '출처 검증된 큐레이션')}
                className="ml-2 text-[13px] font-medium text-ink/50 tracking-tight"
              />
            </h2>
          </div>
          <SeriesGrid series={series} />
        </div>
      </section>

      {/* ⑤ 이런 거 다뤄주세요 (연회색) — 모바일은 햄버거 드로어로 진입(숨김), 데스크톱은 유지 */}
      <section className="hidden md:block py-10 md:py-14 bg-user-subtle">
        <div className="mx-auto max-w-[1100px] px-6">
          <Editable
            as="h2"
            k="home.section.topics.title"
            value={pick(overrides, 'home.section.topics.title', '이런 거 다뤄주세요')}
            className="text-[22px] md:text-[26px] font-extrabold tracking-tight"
          />
          <VoteCompact items={topics} />
          <SuggestInline />
        </div>
      </section>
    </div>
  );
}
