import Link from 'next/link';
import { listPublishedContents } from '@/lib/data/contents';
import { TimeBadge } from '@/components/content/TimeBadge';

export const revalidate = 60;

export default async function TrendsPage() {
  const items = await listPublishedContents({ track: 'trend' });
  return (
    <div className="container-wide py-10">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold">AI 트렌드</h1>
        <p className="mt-2 text-ink/60">새 도구가 나오면 직접 써보고 솔직히 알려드려요.</p>
      </header>

      {items.length === 0 ? (
        <div className="card p-10 text-center text-ink/40">
          첫 트렌드 글을 곧 발행할게요.
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((it, i) => (
            <li key={it.id}>
              <Link
                href={`/trends/${it.slug}`}
                className="card p-5 flex gap-5 hover:shadow-elevated transition-shadow"
              >
                <span className="text-xl font-serif text-ink/30 w-12 shrink-0">
                  #{items.length - i}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-lg font-semibold leading-snug">{it.title}</h3>
                  {it.summary && (
                    <p className="mt-1.5 text-sm text-ink/70 line-clamp-2">{it.summary}</p>
                  )}
                  <div className="mt-3">
                    <TimeBadge readMin={it.read_min} applyMin={it.apply_min} />
                  </div>
                </div>
                {it.thumbnail_url ? (
                  <img src={it.thumbnail_url} alt="" className="h-24 w-24 rounded-md object-cover" />
                ) : (
                  <div className="h-24 w-24 rounded-md bg-muted" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
