import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

type Row = {
  content_id: string | null;
  tool_id: string | null;
  product_id: string | null;
  contents: { slug: string; track: 'case' | 'trend'; title: string } | null;
  tools: { slug: string; name: string } | null;
  products: { slug: string; title: string } | null;
};

export default async function LikedPage() {
  if (!isSupabaseConfigured()) return <p className="text-sm text-ink/60">Supabase 연결 후 사용 가능</p>;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/mypage/liked');
  const { data } = await supabase
    .from('reactions')
    .select('content_id, tool_id, product_id, contents(slug, track, title), tools(slug, name), products(slug, title)')
    .eq('user_id', user.id)
    .eq('type', 'like')
    .order('created_at', { ascending: false });
  const items = (data ?? []) as unknown as Row[];

  return (
    <div>
      <h2 className="font-semibold mb-4">좋아요한 콘텐츠</h2>
      {items.length === 0 ? (
        <p className="card p-10 text-center text-ink/40 text-sm">아직 없어요.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => {
            const c = it.contents;
            const t = it.tools;
            const p = it.products;
            if (!c && !t && !p) return null;
            const href = c
              ? `/${c.track === 'case' ? 'cases' : 'trends'}/${c.slug}`
              : t
                ? `/tools/${t.slug}`
                : `/ebooks/${p!.slug}`;
            const title = c ? c.title : t ? t.name : p!.title;
            const badge = c ? (c.track === 'case' ? '케이스' : '트렌드') : t ? '도구' : '전자책';
            return (
              <li key={it.content_id ?? it.tool_id ?? it.product_id ?? i} className="card p-4 flex items-center gap-2">
                <span className="badge shrink-0">{badge}</span>
                <Link href={href} className="font-medium">
                  {title}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
