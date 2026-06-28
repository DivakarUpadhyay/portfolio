-- ============================================================
-- LMS-INT Supabase Schema
-- Run this entire script in Supabase SQL Editor (once).
-- ============================================================

-- 1. PROFILES (extends auth.users)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  role        text not null default 'user' check (role in ('admin', 'user')),
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Security-definer helper: reads caller's role without triggering RLS on profiles
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- anyone can read their own profile; admin can read all
create policy "own_profile_read" on public.profiles
  for select using (auth.uid() = id);

-- Uses get_my_role() to avoid infinite recursion (policy querying same table)
create policy "admin_read_all_profiles" on public.profiles
  for select using (public.get_my_role() = 'admin');

create policy "own_profile_update" on public.profiles
  for update using (auth.uid() = id);

create policy "admin_update_all_profiles" on public.profiles
  for update using (public.get_my_role() = 'admin');

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. COURSES
create table public.courses (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text not null default '',
  is_published boolean not null default false,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.courses enable row level security;

create policy "users_read_published" on public.courses
  for select using (is_published = true);

create policy "admin_read_all_courses" on public.courses
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_insert_course" on public.courses
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_update_course" on public.courses
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_delete_course" on public.courses
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 3. TOPICS (self-referential for subtopics)
create table public.topics (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid not null references public.courses(id) on delete cascade,
  parent_topic_id uuid references public.topics(id) on delete cascade,
  title           text not null,
  order_index     integer not null default 0,
  created_at      timestamptz not null default now()
);
alter table public.topics enable row level security;

create policy "users_read_topics" on public.topics
  for select using (
    exists (select 1 from public.courses where id = course_id and is_published = true)
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_insert_topic" on public.topics
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_update_topic" on public.topics
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_delete_topic" on public.topics
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 4. TOPIC CONTENT
create table public.topic_content (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references public.topics(id) on delete cascade,
  type        text not null check (type in ('text', 'youtube', 'link', 'image')),
  body        text not null,
  order_index integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.topic_content enable row level security;

create policy "users_read_content" on public.topic_content
  for select using (
    exists (
      select 1 from public.topics t
      join public.courses c on c.id = t.course_id
      where t.id = topic_id and c.is_published = true
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_manage_content" on public.topic_content
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 5. USER PROGRESS
create table public.user_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  topic_id     uuid not null references public.topics(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique(user_id, topic_id)
);
alter table public.user_progress enable row level security;

create policy "own_progress" on public.user_progress
  for all using (auth.uid() = user_id);

create policy "admin_read_progress" on public.user_progress
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 6. RECORDINGS
create table public.recordings (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  file_path        text not null,
  duration_seconds integer not null default 0,
  created_at       timestamptz not null default now()
);
alter table public.recordings enable row level security;

-- recordings are strictly private — only the owner
create policy "own_recordings" on public.recordings
  for all using (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKET for recordings
-- ============================================================
insert into storage.buckets (id, name, public) values ('recordings', 'recordings', false);

create policy "upload_own_recording" on storage.objects
  for insert with check (
    bucket_id = 'recordings' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "read_own_recording" on storage.objects
  for select using (
    bucket_id = 'recordings' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "delete_own_recording" on storage.objects
  for delete using (
    bucket_id = 'recordings' and auth.uid()::text = (storage.foldername(name))[1]
  );
