import { redirect } from 'next/navigation';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

export default async function MypageEbooks() {
  if (!isSupabaseConfigured()) return <p className="text-sm text-ink/60">Supabase 연결 후 사용 가능</p>;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/mypage/ebooks');
  const { data } = await supabase
    .from('purchases')
    .select('id, status, sent_at, created_at, products(title, slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  const items = (data ?? []) as unknown as Array<{
    id: string;
    status: string;
    sent_at: string | null;
    created_at: string;
    products: { title: string; slug: string };
  }>;

  return (
    <div>
      <h2 className="font-semibold mb-4">구매(신청)한 전자책</h2>
      {items.length === 0 ? (
        <p className="card p-10 text-center text-ink/40 text-sm">아직 신청한 전자책이 없어요.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <li key={p.id} className="card p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium">{p.products.title}</h3>
                <p className="text-xs text-ink/50 mt-0.5">신청일 {formatDate(p.created_at)}</p>
              </div>
              <span className="badge">
                {p.status === 'sent' ? '발송완료' : p.status === 'pending' ? '발송대기' : p.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
