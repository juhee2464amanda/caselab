import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

export default async function AdminTools() {
  if (!isSupabaseConfigured()) return <div className="p-8 text-sm">Supabase 연결 필요</div>;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('tools')
    .select('id, slug, name, category, status, pricing_tier, updated_at')
    .order('updated_at', { ascending: false });

  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl font-semibold mb-6">자료실 (tools/prompts/guides/맥락 카드)</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3 w-32">카테고리</th>
              <th className="px-4 py-3 w-24">가격</th>
              <th className="px-4 py-3 w-24">상태</th>
              <th className="px-4 py-3 w-32">수정일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data ?? []).map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-medium">{t.name}<div className="text-xs text-ink/40">/{t.slug}</div></td>
                <td className="px-4 py-3"><span className="badge">{t.category}</span></td>
                <td className="px-4 py-3 text-xs">{t.pricing_tier}</td>
                <td className="px-4 py-3"><span className="badge">{t.status}</span></td>
                <td className="px-4 py-3 text-xs text-ink/50">{formatDate(t.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-ink/40">
        ※ CRUD 폼은 Phase 3에서 추가. 지금은 Supabase Studio에서 직접 편집.
      </p>
    </div>
  );
}
