import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

type Row = {
  content_id: string | null;
  tool_id: string | null;
  contents: { slug: string; track: 'case' | 'trend'; title: string; summary: string | null } | null;
  tools: { slug: string; name: string; description: string | null } | null;
};

export default async function SavedPage() {
  if (!isSupabaseConfigured()) return <p className="text-sm text-ink/60">Supabase 연결 후 사용 가능</p>;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/mypage/saved');
  const { data } = await supabase
    .from('saves')
    .select('content_id, tool_id, created_at, contents(slug, track, title, summary), tools(slug, name, description)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  const items = (data ?? []) as unknown as Row[];

  return (
    <div>
      <h2 className="font-semibold mb-4">저장한 콘텐츠</h2>
      {items.length === 0 ? (
        <p className="card p-10 text-center text-ink/40 text-sm">저장한 콘텐츠가 없어요.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((s, i) => {
            const c = s.contents;
            const t = s.tools;
            if (!c && !t) return null;
            const href = c ? `/${c.track === 'case' ? 'cases' : 'trends'}/${c.slug}` : `/tools/${t!.slug}`;
            const title = c ? c.title : t!.name;
            const desc = c ? c.summary : t!.description;
            const badge = c ? (c.track === 'case' ? '케이스' : '트렌드') : '도구';
            return (
              <li key={s.content_id ?? s.tool_id ?? i} className="card p-4">
                <Link href={href}>
                  <span className="badge mb-1.5">{badge}</span>
                  <h3 className="font-medium">{title}</h3>
                  {desc && <p className="text-sm text-ink/60 mt-1 line-clamp-2">{desc}</p>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
