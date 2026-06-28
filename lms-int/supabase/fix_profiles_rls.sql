-- Fix infinite recursion in profiles RLS policies.
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/rvyqwprkfzusjqblggvh/sql

-- Step 1: Create security-definer function that reads caller's role bypassing RLS
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Step 2: Drop the recursive policies
drop policy if exists "admin_read_all_profiles" on public.profiles;
drop policy if exists "admin_update_all_profiles" on public.profiles;

-- Step 3: Recreate without recursion
create policy "admin_read_all_profiles" on public.profiles
  for select using (public.get_my_role() = 'admin');

create policy "admin_update_all_profiles" on public.profiles
  for update using (public.get_my_role() = 'admin');
