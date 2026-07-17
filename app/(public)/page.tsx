import { HeroCarousel } from '@/components/layout/HeroCarousel';
import { FreeBookBanner } from '@/components/home/FreeBookBanner';
import { CategoryTabsList } from '@/components/home/CategoryTabsList';
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
  const [curatedRaw, cases, trends, topics, popular, toolStats, trendCount, overrides, products] =
    await Promise.all([
      listFeaturedContents(5),
      listPublishedContents({ track: 'case', limit: 4 }),
      listPublishedContents({ track: 'trend', limit: 4 }),
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
      desc: pick(overrides, 'home.series.trends.desc', '요즘 떠오르는 AI 트렌드 정리'),
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

  return (
    <>
      {/* ① Hero Carousel */}
      <HeroCarousel items={curated} />

      {/* ② 무료 전자책 배너 (준비중이면 '준비 중' 배너로 대체) */}
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

      {/* ③ 실전케이스 + Popular 사이드바 (연회색) */}
      <section className="py-10 md:py-14 bg-user-subtle">
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
              <CategoryTabsList items={articleItems} />
            </div>

            <aside className="w-full lg:w-[280px] lg:pt-12 shrink-0">
              <PopularSidebar items={popularItems} />
            </aside>
          </div>
        </div>
      </section>

      {/* ④ 일잘러의 AI 자료실 (4 series) */}
      <section className="py-10 md:py-14">
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

      {/* ⑤ 이런 거 다뤄주세요 (연회색) */}
      <section className="py-10 md:py-14 bg-user-subtle">
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
    </>
  );
}
