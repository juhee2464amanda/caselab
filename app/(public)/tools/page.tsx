import Link from 'next/link';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export const revalidate = 60;

async function listTools(category: string) {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('tools')
    .select('id, slug, name, description, category, url, thumbnail_url, pricing_tier')
    .eq('category', category)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export default async function ToolsPage() {
  const items = await listTools('tool');
  return (
    <div className="container-wide py-10">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold">자료실 — 도구</h1>
        <p className="mt-2 text-ink/60">직접 써본 도구만 모아둬요. 별로면 별로라고 적습니다.</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && (
          <li className="card p-10 text-center text-ink/40 col-span-full">
            곧 추가할게요.
          </li>
        )}
        {items.map((t) => (
          <li key={t.id}>
            <Link href={`/tools/${t.slug}`} className="card p-5 block hover:shadow-elevated">
              <div className="flex items-center gap-3 mb-3">
                {t.thumbnail_url ? (
                  <img src={t.thumbnail_url} alt="" className="h-10 w-10 rounded" />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted" />
                )}
                <div>
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-xs text-ink/50">{t.pricing_tier}</p>
                </div>
              </div>
              <p className="text-sm text-ink/70 line-clamp-3">{t.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
