import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export default async function LikedPage() {
  if (!isSupabaseConfigured()) return <p className="text-sm text-ink/60">Supabase 연결 후 사용 가능</p>;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/mypage/liked');
  const { data } = await supabase
    .from('reactions')
    .select('content_id, contents(slug, track, title)')
    .eq('user_id', user.id)
    .eq('type', 'like')
    .order('created_at', { ascending: false });
  const items = (data ?? []) as unknown as Array<{ content_id: string; contents: { slug: string; track: 'case' | 'trend'; title: string } }>;

  return (
    <div>
      <h2 className="font-semibold mb-4">좋아요한 콘텐츠</h2>
      {items.length === 0 ? (
        <p className="card p-10 text-center text-ink/40 text-sm">아직 없어요.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.content_id} className="card p-4">
              <Link href={`/${it.contents.track === 'case' ? 'cases' : 'trends'}/${it.contents.slug}`} className="font-medium">
                {it.contents.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
