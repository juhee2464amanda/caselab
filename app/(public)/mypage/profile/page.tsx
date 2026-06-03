import { redirect } from 'next/navigation';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { ProfileForm } from './ProfileForm';

export default async function MypageProfile() {
  if (!isSupabaseConfigured()) {
    return <p className="text-sm text-ink/60">Supabase 연결 후 사용할 수 있어요.</p>;
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/mypage/profile');
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, job, job_title, interests, ai_tools, newsletter, analytics_consent')
    .eq('id', user.id)
    .single();

  return <ProfileForm initial={profile} />;
}
