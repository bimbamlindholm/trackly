-- Trackly company/admin setup
-- Run this in Supabase SQL Editor, then update one user to role = 'admin'.

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text default '',
  role text not null default 'worker' check (role in ('admin', 'manager', 'worker')),
  department text default 'Unassigned',
  position text default 'Worker',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_trackly_profile on auth.users;

create trigger on_auth_user_created_trackly_profile
after insert or update on auth.users
for each row execute function public.handle_new_user_profile();

insert into public.user_profiles (id, email, full_name)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', '')
from auth.users
on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
      updated_at = now();

create or replace function public.trackly_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

drop policy if exists "Users can read own profile" on public.user_profiles;
drop policy if exists "Admins can read all profiles" on public.user_profiles;
drop policy if exists "Users can update own profile basics" on public.user_profiles;
drop policy if exists "Admins can update all profiles" on public.user_profiles;

create policy "Users can read own profile"
on public.user_profiles
for select
to authenticated
using (id = auth.uid());

create policy "Admins can read all profiles"
on public.user_profiles
for select
to authenticated
using (public.trackly_is_admin());

create policy "Users can update own profile basics"
on public.user_profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = 'worker');

create policy "Admins can update all profiles"
on public.user_profiles
for update
to authenticated
using (public.trackly_is_admin())
with check (public.trackly_is_admin());

alter table public.attendance_records enable row level security;

drop policy if exists "Users can read own attendance" on public.attendance_records;
drop policy if exists "Users can insert own attendance" on public.attendance_records;
drop policy if exists "Users can update own attendance" on public.attendance_records;
drop policy if exists "Users can delete own attendance" on public.attendance_records;
drop policy if exists "Admins can read all attendance" on public.attendance_records;
drop policy if exists "Admins can update all attendance" on public.attendance_records;
drop policy if exists "Admins can delete all attendance" on public.attendance_records;

create policy "Users can read own attendance"
on public.attendance_records
for select
to authenticated
using (user_email = auth.jwt()->>'email');

create policy "Users can insert own attendance"
on public.attendance_records
for insert
to authenticated
with check (user_email = auth.jwt()->>'email');

create policy "Users can update own attendance"
on public.attendance_records
for update
to authenticated
using (user_email = auth.jwt()->>'email')
with check (user_email = auth.jwt()->>'email');

create policy "Users can delete own attendance"
on public.attendance_records
for delete
to authenticated
using (user_email = auth.jwt()->>'email');

create policy "Admins can read all attendance"
on public.attendance_records
for select
to authenticated
using (public.trackly_is_admin());

create policy "Admins can update all attendance"
on public.attendance_records
for update
to authenticated
using (public.trackly_is_admin())
with check (public.trackly_is_admin());

create policy "Admins can delete all attendance"
on public.attendance_records
for delete
to authenticated
using (public.trackly_is_admin());

alter table public.user_salary_settings enable row level security;

drop policy if exists "Users can read own salary settings" on public.user_salary_settings;
drop policy if exists "Users can insert own salary settings" on public.user_salary_settings;
drop policy if exists "Users can update own salary settings" on public.user_salary_settings;
drop policy if exists "Admins can read all salary settings" on public.user_salary_settings;
drop policy if exists "Admins can update all salary settings" on public.user_salary_settings;

create policy "Users can read own salary settings"
on public.user_salary_settings
for select
to authenticated
using (user_email = auth.jwt()->>'email');

create policy "Users can insert own salary settings"
on public.user_salary_settings
for insert
to authenticated
with check (user_email = auth.jwt()->>'email');

create policy "Users can update own salary settings"
on public.user_salary_settings
for update
to authenticated
using (user_email = auth.jwt()->>'email')
with check (user_email = auth.jwt()->>'email');

create policy "Admins can read all salary settings"
on public.user_salary_settings
for select
to authenticated
using (public.trackly_is_admin());

create policy "Admins can update all salary settings"
on public.user_salary_settings
for update
to authenticated
using (public.trackly_is_admin())
with check (public.trackly_is_admin());

-- Replace this email with your admin login email after running the setup.
-- update public.user_profiles
-- set role = 'admin', department = 'Management', position = 'Administrator'
-- where email = 'your-email@example.com';
