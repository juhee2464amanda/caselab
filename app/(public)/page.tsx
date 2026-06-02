import Link from 'next/link';
import { HeroCarousel } from '@/components/layout/HeroCarousel';
import { JobTags } from '@/components/content/JobTags';
import { TimeBadge } from '@/components/content/TimeBadge';
import { listPublishedContents } from '@/lib/data/contents';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export const revalidate = 60;

async function listTopics() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('topic_suggestions')
    .select('id, title, description, vote_count, status')
    .eq('status', 'open')
    .order('vote_count', { ascending: false })
    .limit(4);
  return data ?? [];
}

export default async function HomePage() {
  const [curated, cases, trends, topics] = await Promise.all([
    listPublishedContents({ curated: true, limit: 3 }),
    listPublishedContents({ track: 'case', limit: 4 }),
    listPublishedContents({ track: 'trend', limit: 4 }),
    listTopics(),
  ]);

  return (
    <div className="container-wide py-8">
      <HeroCarousel items={curated} />

      <section className="my-12 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-12">
          <Section title="실전 케이스" href="/cases" items={cases} />
          <Section title="AI 트렌드" href="/trends" items={trends} />
        </div>

        <aside className="space-y-8">
          <TopicsBox topics={topics} />
          <EbookPromo />
        </aside>
      </section>
    </div>
  );
}

function Section({
  title,
  href,
  items,
}: {
  title: string;
  href: string;
  items: Awaited<ReturnType<typeof listPublishedContents>>;
}) {
  return (
    <section>
      <header className="flex items-baseline justify-between mb-4">
        <h2 className="font-serif text-2xl font-semibold">{title}</h2>
        <Link href={href} className="text-sm text-accent hover:underline">
          전체 보기 →
        </Link>
      </header>
      {items.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink/40">
          곧 첫 콘텐츠를 발행할게요.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((it) => (
            <li key={it.id}>
              <Link
                href={`/${it.track === 'case' ? 'cases' : 'trends'}/${it.slug}`}
                className="card p-5 flex gap-4 hover:shadow-elevated transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium leading-snug line-clamp-2">{it.title}</h3>
                  {it.summary && (
                    <p className="mt-1 text-sm text-ink/60 line-clamp-2">{it.summary}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <TimeBadge readMin={it.read_min} applyMin={it.apply_min} />
                  </div>
                  <JobTags tags={it.job_tags} className="mt-2" />
                </div>
                {it.thumbnail_url ? (
                  <img
                    src={it.thumbnail_url}
                    alt=""
                    className="h-24 w-24 rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-md bg-muted shrink-0" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TopicsBox({ topics }: { topics: Awaited<ReturnType<typeof listTopics>> }) {
  return (
    <div className="card p-5">
      <header className="flex items-baseline justify-between mb-3">
        <h3 className="font-serif text-lg font-semibold">이런 거 어때요</h3>
        <Link href="/topics" className="text-xs text-accent">더 보기</Link>
      </header>
      {topics.length === 0 ? (
        <p className="text-sm text-ink/40 text-center py-4">
          첫 후보를 곧 올릴게요.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {topics.map((t) => (
            <li key={t.id} className="flex items-start gap-2">
              <span className="badge shrink-0">{t.vote_count}</span>
              <span className="text-sm text-ink/85 leading-snug">{t.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EbookPromo() {
  return (
    <Link
      href="/ebooks"
      className="block rounded-lg bg-ink text-white p-5 hover:bg-ink/90 transition-colors"
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-accent-100 mb-1">
        무료 전자책
      </div>
      <h3 className="font-serif text-lg font-semibold leading-tight">
        AI로 일이 풀린 케이스 30개
      </h3>
      <p className="mt-1 text-sm text-white/70">이메일로 받아보세요.</p>
    </Link>
  );
}
