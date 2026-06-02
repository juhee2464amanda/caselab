import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export const revalidate = 60;

export default async function GuidesPage() {
  let items: { id: string; slug: string; name: string; description: string | null; category: string }[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('tools')
      .select('id, slug, name, description, category')
      .in('category', ['guide', 'context-card'])
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    items = data ?? [];
  }
  return (
    <div className="container-wide py-10">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold">자료실 — 가이드 & 맥락 카드</h1>
        <p className="mt-2 text-ink/60">일하기 위한 자료. 맥락 카드 템플릿도 여기에.</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.length === 0 ? (
          <li className="card p-10 text-center text-ink/40 col-span-full">곧 추가할게요.</li>
        ) : (
          items.map((g) => (
            <li key={g.id} className="card p-5">
              <span className="badge">{g.category === 'context-card' ? '맥락 카드' : '가이드'}</span>
              <h3 className="font-semibold mt-2">{g.name}</h3>
              <p className="text-sm text-ink/70 mt-1">{g.description}</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
