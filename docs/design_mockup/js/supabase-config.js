// ============================================
// CaseLab — Supabase 공통 설정
// ============================================
// 사용법:
// 1. https://supabase.com 에서 프로젝트 생성
// 2. 아래 SUPABASE_URL, SUPABASE_ANON_KEY를 본인 프로젝트 값으로 교체
// 3. Authentication > Providers에서 Google, Kakao 활성화
// ============================================

const SUPABASE_URL = 'https://iejulonzmpjduzjdmxng.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllanVsb256bXBqZHV6amRteG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNzk2MDgsImV4cCI6MjA5NTk1NTYwOH0.OiAoAXCBmQ7olG_N0KHEjQ0mB1Re8CSqPWEiC5tcVB4';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth helpers ──

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

async function isAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;
  const profile = await getProfile(user.id);
  return profile?.role === 'admin';
}

async function signOut() {
  await supabase.auth.signOut();
  // user/ 또는 admin/ 어디서든 홈으로
  const isAdmin = window.location.pathname.includes('/admin/');
  window.location.href = isAdmin ? '../user/index.html' : 'index.html';
}

// ── Like / Save helpers ──

async function toggleLike(contentId, contentTitle) {
  const user = await getCurrentUser();
  if (!user) { window.location.href = '05_login.html'; return; }

  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('content_id', contentId)
    .single();

  if (existing) {
    await supabase.from('likes').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('likes').insert({ user_id: user.id, content_id: contentId, content_title: contentTitle });
    return true;
  }
}

async function toggleSave(contentId, contentTitle) {
  const user = await getCurrentUser();
  if (!user) { window.location.href = '05_login.html'; return; }

  const { data: existing } = await supabase
    .from('saves')
    .select('id')
    .eq('user_id', user.id)
    .eq('content_id', contentId)
    .single();

  if (existing) {
    await supabase.from('saves').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('saves').insert({ user_id: user.id, content_id: contentId, content_title: contentTitle });
    return true;
  }
}

async function isLiked(contentId) {
  const user = await getCurrentUser();
  if (!user) return false;
  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('content_id', contentId)
    .single();
  return !!data;
}

async function isSaved(contentId) {
  const user = await getCurrentUser();
  if (!user) return false;
  const { data } = await supabase
    .from('saves')
    .select('id')
    .eq('user_id', user.id)
    .eq('content_id', contentId)
    .single();
  return !!data;
}

async function getLikeCount(contentId) {
  const { count } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('content_id', contentId);
  return count || 0;
}

// ── GNB auth state ──

async function updateGnbAuth() {
  const user = await getCurrentUser();
  const loginEl = document.getElementById('gnbLoginIcon');
  const userEl = document.getElementById('gnbUserMenu');
  if (!loginEl || !userEl) return;

  if (user) {
    const profile = await getProfile(user.id);
    loginEl.style.display = 'none';
    userEl.style.display = 'flex';
    const nameEl = userEl.querySelector('.gnb-user-name');
    if (nameEl) nameEl.textContent = profile?.name || user.email?.split('@')[0] || '사용자';
  } else {
    loginEl.style.display = 'flex';
    userEl.style.display = 'none';
  }
}