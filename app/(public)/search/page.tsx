import Link from 'next/link';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { Input } from '@/components/ui/input';
import { TimeBadge } from '@/components/content/TimeBadge';
import { JobTags } from '@/components/content/JobTags';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  let results: Awaited<ReturnType<typeof search>> = [];
  if (query) results = await search(query);

  return (
    <div className="container-wide py-10">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold">검색</h1>
        <form action="/search" method="get" className="mt-4 flex gap-2 max-w-xl">
          <Input name="q" defaultValue={query} placeholder="검색어를 입력하세요" />
          <button type="submit" className="px-4 rounded-md bg-accent text-white">검색</button>
        </form>
      </header>

      {query && (
        <p className="mb-4 text-sm text-ink/60">
          “{query}” 결과 {results.length}건
        </p>
      )}
      <ul className="space-y-3">
        {results.map((it) => (
          <li key={it.id} className="card p-5">
            <Link href={`/${it.track === 'case' ? 'cases' : 'trends'}/${it.slug}`} className="block">
              <span className="text-[10px] uppercase font-semibold text-accent">
                {it.track === 'case' ? '실전 케이스' : 'AI 트렌드'}
              </span>
              <h3 className="font-semibold mt-0.5">{it.title}</h3>
              {it.summary && <p className="text-sm text-ink/70 mt-1 line-clamp-2">{it.summary}</p>}
              <div className="mt-2 flex gap-3 items-center">
                <TimeBadge readMin={it.read_min} applyMin={it.apply_min} />
                <JobTags tags={it.job_tags} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function search(q: string) {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const escaped = q.replace(/%/g, '\\%').replace(/_/g, '\\_');
  const { data } = await supabase
    .from('contents')
    .select('id, slug, track, title, summary, read_min, apply_min, job_tags')
    .eq('status', 'published')
    .or(`title.ilike.%${escaped}%,summary.ilike.%${escaped}%`)
    .order('published_at', { ascending: false })
    .limit(40);
  return (data ?? []) as Array<{
    id: string;
    slug: string;
    track: 'case' | 'trend';
    title: string;
    summary: string | null;
    read_min: number;
    apply_min: number;
    job_tags: import('@/types/content').JobTag[];
  }>;
}
