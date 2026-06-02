import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export default async function SavedPage() {
  if (!isSupabaseConfigured()) return <p className="text-sm text-ink/60">Supabase 연결 후 사용 가능</p>;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/mypage/saved');
  const { data: saves } = await supabase
    .from('saves')
    .select('content_id, created_at, contents(slug, track, title, summary, thumbnail_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  const items = (saves ?? []) as unknown as Array<{
    content_id: string;
    contents: { slug: string; track: 'case' | 'trend'; title: string; summary: string | null; thumbnail_url: string | null };
  }>;

  return (
    <div>
      <h2 className="font-semibold mb-4">저장한 콘텐츠</h2>
      {items.length === 0 ? (
        <p className="card p-10 text-center text-ink/40 text-sm">저장한 콘텐츠가 없어요.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.content_id} className="card p-4">
              <Link href={`/${s.contents.track === 'case' ? 'cases' : 'trends'}/${s.contents.slug}`}>
                <h3 className="font-medium">{s.contents.title}</h3>
                {s.contents.summary && (
                  <p className="text-sm text-ink/60 mt-1 line-clamp-2">{s.contents.summary}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
