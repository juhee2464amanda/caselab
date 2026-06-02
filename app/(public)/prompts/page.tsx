import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export const revalidate = 60;

export default async function PromptsPage() {
  let prompts: { id: string; slug: string; name: string; description: string | null; url: string | null }[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('tools')
      .select('id, slug, name, description, url')
      .eq('category', 'prompt')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    prompts = data ?? [];
  }
  return (
    <div className="container-wide py-10">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold">자료실 — 프롬프트</h1>
        <p className="mt-2 text-ink/60">복붙해서 바로 쓰는, 실제로 결과 나온 프롬프트.</p>
      </header>
      <ul className="space-y-4">
        {prompts.length === 0 ? (
          <li className="card p-10 text-center text-ink/40">곧 추가할게요.</li>
        ) : (
          prompts.map((p) => (
            <li key={p.id} className="card p-5">
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-sm text-ink/70 mt-1 whitespace-pre-wrap">{p.description}</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
