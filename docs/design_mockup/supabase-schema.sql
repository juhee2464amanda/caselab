-- ============================================
-- CaseLab Supabase Schema
-- 실행: Supabase Dashboard > SQL Editor > New query
-- ============================================

-- 1. profiles (auth.users 확장)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  job_type text,                     -- 직장인 / 자영업자 / 프리랜서 / 학생
  job text,                          -- 기획/마케팅/영업/디자인/개발/기타
  avatar_url text,
  role text default 'user',          -- user | admin
  status text default 'active',      -- active | suspended
  newsletter boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 기존 테이블에서 job_type 컬럼 추가하려면:
-- alter table public.profiles add column if not exists job_type text;

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- 자동 profile 생성 (회원가입 시)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. likes (좋아요)
create table public.likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  content_id text not null,
  content_title text,
  created_at timestamptz default now(),
  unique(user_id, content_id)
);

alter table public.likes enable row level security;

create policy "Users can view own likes"
  on public.likes for select using (auth.uid() = user_id);

create policy "Users can insert own likes"
  on public.likes for insert with check (auth.uid() = user_id);

create policy "Users can delete own likes"
  on public.likes for delete using (auth.uid() = user_id);

-- admin can view all likes
create policy "Admins can view all likes"
  on public.likes for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- 3. saves (저장/북마크)
create table public.saves (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  content_id text not null,
  content_title text,
  created_at timestamptz default now(),
  unique(user_id, content_id)
);

alter table public.saves enable row level security;

create policy "Users can view own saves"
  on public.saves for select using (auth.uid() = user_id);

create policy "Users can insert own saves"
  on public.saves for insert with check (auth.uid() = user_id);

create policy "Users can delete own saves"
  on public.saves for delete using (auth.uid() = user_id);

create policy "Admins can view all saves"
  on public.saves for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- 4. topic_suggestions (주제 제안)
create table public.topic_suggestions (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  author_id uuid references auth.users on delete set null,
  vote_count int default 0,
  status text default 'open',        -- open | planned | published
  created_at timestamptz default now()
);

alter table public.topic_suggestions enable row level security;

create policy "Anyone can view suggestions"
  on public.topic_suggestions for select using (true);

create policy "Authenticated users can insert suggestions"
  on public.topic_suggestions for insert with check (auth.uid() is not null);

create policy "Admins can update suggestions"
  on public.topic_suggestions for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- 5. topic_votes (주제 투표)
create table public.topic_votes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  suggestion_id uuid references public.topic_suggestions on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, suggestion_id)
);

alter table public.topic_votes enable row level security;

create policy "Users can view own votes"
  on public.topic_votes for select using (auth.uid() = user_id);

create policy "Users can insert own votes"
  on public.topic_votes for insert with check (auth.uid() = user_id);

create policy "Users can delete own votes"
  on public.topic_votes for delete using (auth.uid() = user_id);


-- 6. admin용 집계 뷰
create or replace view public.admin_stats as
select
  (select count(*) from public.profiles) as total_users,
  (select count(*) from public.profiles where created_at > now() - interval '7 days') as new_users_7d,
  (select count(*) from public.profiles where created_at > now() - interval '30 days') as new_users_30d,
  (select count(*) from public.likes) as total_likes,
  (select count(*) from public.saves) as total_saves,
  (select count(*) from public.topic_suggestions) as total_suggestions;


-- 7. content_stats 뷰 (콘텐츠별 좋아요/저장 수)
create or replace view public.content_stats as
select
  coalesce(l.content_id, s.content_id) as content_id,
  coalesce(l.content_title, s.content_title) as content_title,
  coalesce(l.like_count, 0) as like_count,
  coalesce(s.save_count, 0) as save_count
from
  (select content_id, content_title, count(*) as like_count from public.likes group by content_id, content_title) l
full outer join
  (select content_id, content_title, count(*) as save_count from public.saves group by content_id, content_title) s
on l.content_id = s.content_id
order by like_count desc;