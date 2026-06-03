import { HeroCarousel } from '@/components/layout/HeroCarousel';
import { FreeBookBanner } from '@/components/home/FreeBookBanner';
import { CategoryTabsList } from '@/components/home/CategoryTabsList';
import { PopularSidebar } from '@/components/home/PopularSidebar';
import { SeriesGrid } from '@/components/home/SeriesGrid';
import { VoteCompact } from '@/components/home/VoteCompact';
import { SuggestInline } from '@/components/home/SuggestInline';
import { listPublishedContents } from '@/lib/data/contents';
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
  const [curated, cases, trends, topics, popular, toolStats, trendCount] = await Promise.all([
    listPublishedContents({ curated: true, limit: 3 }),
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
  ]);

  // 시리즈 카드 4개 데이터
  const series = [
    {
      href: '/tools',
      name: '쓸만한 AI 도구',
      desc: '실무자가 검증한 도구만 골라 정리',
      thumb: '',
      count: toolStats.tool,
      recentTitle: null,
      freshText: `${toolStats.tool}개 · 오늘 업데이트`,
    },
    {
      href: '/prompts',
      name: '바로 쓰는 프롬프트',
      desc: '출처가 명시된 복사용 템플릿',
      thumb: '',
      count: toolStats.prompt,
      recentTitle: null,
      freshText: `${toolStats.prompt}개 · 오늘 업데이트`,
    },
    {
      href: '/guides',
      name: '공식 가이드',
      desc: 'OpenAI·Anthropic 공식 문서 핵심',
      thumb: '',
      count: toolStats.guide,
      recentTitle: null,
      freshText: `${toolStats.guide}개 · 오늘 업데이트`,
    },
    {
      href: '/trends',
      name: 'AI 트렌드',
      desc: '요즘 떠오르는 AI 트렌드 정리',
      thumb: '',
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

      {/* ② 무료 전자책 배너 */}
      <FreeBookBanner />

      {/* ③ 실전케이스 + Popular 사이드바 (연회색) */}
      <section className="py-10 md:py-14 bg-user-subtle">
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="flex flex-col lg:flex-row gap-0 lg:gap-12">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="text-[22px] md:text-[26px] font-extrabold tracking-tight">
                  AI 실전케이스
                </h2>
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
              일잘러의 AI 자료실
              <span className="ml-2 text-[13px] font-medium text-ink/50 tracking-tight">
                출처 검증된 큐레이션
              </span>
            </h2>
          </div>
          <SeriesGrid series={series} />
        </div>
      </section>

      {/* ⑤ 이런 거 다뤄주세요 (연회색) */}
      <section className="py-10 md:py-14 bg-user-subtle">
        <div className="mx-auto max-w-[1100px] px-6">
          <h2 className="text-[22px] md:text-[26px] font-extrabold tracking-tight">
            이런 거 다뤄주세요
          </h2>
          <VoteCompact items={topics} />
          <SuggestInline />
        </div>
      </section>
    </>
  );
}
