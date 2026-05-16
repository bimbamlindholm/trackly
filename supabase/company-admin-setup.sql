-- Trackly company workspace setup
-- Run this once in Supabase SQL Editor.
-- Companies create their own workspace in the app; the creator becomes admin.

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

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  full_name text default '',
  role text not null default 'worker' check (role in ('admin', 'manager', 'worker')),
  membership_status text not null default 'active' check (membership_status in ('active', 'archived')),
  department text default 'Unassigned',
  position text default 'Worker',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  token text unique not null,
  department text not null default 'General Staff',
  position text default 'Staff',
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;
alter table public.attendance_records enable row level security;
alter table public.user_salary_settings enable row level security;

alter table public.organization_members
  add column if not exists membership_status text not null default 'active'
  check (membership_status in ('active', 'archived'));

alter table public.attendance_records
  add column if not exists photo_data_url text,
  add column if not exists photo_captured_at timestamptz;

alter table public.user_salary_settings
  add column if not exists paid_breaks boolean not null default false;

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
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update
    set email = lower(excluded.email),
        full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
        updated_at = now();

  update public.organization_members
  set user_id = new.id,
      full_name = coalesce(nullif(full_name, ''), new.raw_user_meta_data->>'full_name', full_name),
      membership_status = 'active',
      updated_at = now()
  where lower(email) = lower(new.email)
    and user_id is null;

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
  lower(email),
  coalesce(raw_user_meta_data->>'full_name', '')
from auth.users
on conflict (id) do update
  set email = lower(excluded.email),
      full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
      updated_at = now();

create or replace function public.trackly_is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_org
      and lower(email) = lower(auth.jwt()->>'email')
  );
$$;

create or replace function public.trackly_is_org_admin(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_org
      and lower(email) = lower(auth.jwt()->>'email')
      and role = 'admin'
  );
$$;

create or replace function public.trackly_can_admin_email(target_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members admin_member
    join public.organization_members target_member
      on target_member.organization_id = admin_member.organization_id
    where lower(admin_member.email) = lower(auth.jwt()->>'email')
      and admin_member.role = 'admin'
      and lower(target_member.email) = lower(target_email)
  );
$$;

drop policy if exists "Users can read own profile" on public.user_profiles;
drop policy if exists "Admins can read company profiles" on public.user_profiles;
drop policy if exists "Users can update own profile basics" on public.user_profiles;

create policy "Users can read own profile"
on public.user_profiles
for select
to authenticated
using (id = auth.uid());

create policy "Admins can read company profiles"
on public.user_profiles
for select
to authenticated
using (public.trackly_can_admin_email(email));

create policy "Users can update own profile basics"
on public.user_profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can create organizations" on public.organizations;
drop policy if exists "Members can read own organizations" on public.organizations;
drop policy if exists "Admins can update own organizations" on public.organizations;

create policy "Users can create organizations"
on public.organizations
for insert
to authenticated
with check (created_by = auth.uid());

create policy "Members can read own organizations"
on public.organizations
for select
to authenticated
using (
  created_by = auth.uid()
  or public.trackly_is_org_member(id)
);

create policy "Admins can update own organizations"
on public.organizations
for update
to authenticated
using (public.trackly_is_org_admin(id))
with check (public.trackly_is_org_admin(id));

drop policy if exists "Members can read company members" on public.organization_members;
drop policy if exists "Admins and creators can add company members" on public.organization_members;
drop policy if exists "Workers can join with active invite" on public.organization_members;
drop policy if exists "Admins can update company members" on public.organization_members;
drop policy if exists "Admins can delete company members" on public.organization_members;

create policy "Members can read company members"
on public.organization_members
for select
to authenticated
using (public.trackly_is_org_member(organization_id));

create policy "Admins and creators can add company members"
on public.organization_members
for insert
to authenticated
with check (
  public.trackly_is_org_admin(organization_id)
  or exists (
    select 1
    from public.organizations
    where organizations.id = organization_id
      and organizations.created_by = auth.uid()
  )
);

create policy "Workers can join with active invite"
on public.organization_members
for insert
to authenticated
with check (
  lower(email) = lower(auth.jwt()->>'email')
  and role = 'worker'
  and membership_status = 'active'
  and exists (
    select 1
    from public.organization_invites
    where organization_invites.organization_id = organization_members.organization_id
      and organization_invites.active = true
  )
);

create policy "Admins can update company members"
on public.organization_members
for update
to authenticated
using (public.trackly_is_org_admin(organization_id))
with check (public.trackly_is_org_admin(organization_id));

create policy "Admins can delete company members"
on public.organization_members
for delete
to authenticated
using (public.trackly_is_org_admin(organization_id));

drop policy if exists "Anyone authenticated can read active invites by token" on public.organization_invites;
drop policy if exists "Admins can create company invites" on public.organization_invites;
drop policy if exists "Admins can read company invites" on public.organization_invites;
drop policy if exists "Admins can update company invites" on public.organization_invites;

create policy "Anyone authenticated can read active invites by token"
on public.organization_invites
for select
to authenticated
using (active = true);

create policy "Admins can create company invites"
on public.organization_invites
for insert
to authenticated
with check (public.trackly_is_org_admin(organization_id));

create policy "Admins can read company invites"
on public.organization_invites
for select
to authenticated
using (public.trackly_is_org_admin(organization_id));

create policy "Admins can update company invites"
on public.organization_invites
for update
to authenticated
using (public.trackly_is_org_admin(organization_id))
with check (public.trackly_is_org_admin(organization_id));

drop policy if exists "Users can read own attendance" on public.attendance_records;
drop policy if exists "Users can insert own attendance" on public.attendance_records;
drop policy if exists "Users can update own attendance" on public.attendance_records;
drop policy if exists "Users can delete own attendance" on public.attendance_records;
drop policy if exists "Admins can read company attendance" on public.attendance_records;
drop policy if exists "Admins can update company attendance" on public.attendance_records;
drop policy if exists "Admins can delete company attendance" on public.attendance_records;

create policy "Users can read own attendance"
on public.attendance_records
for select
to authenticated
using (lower(user_email) = lower(auth.jwt()->>'email'));

create policy "Users can insert own attendance"
on public.attendance_records
for insert
to authenticated
with check (lower(user_email) = lower(auth.jwt()->>'email'));

create policy "Users can update own attendance"
on public.attendance_records
for update
to authenticated
using (lower(user_email) = lower(auth.jwt()->>'email'))
with check (lower(user_email) = lower(auth.jwt()->>'email'));

create policy "Users can delete own attendance"
on public.attendance_records
for delete
to authenticated
using (lower(user_email) = lower(auth.jwt()->>'email'));

create policy "Admins can read company attendance"
on public.attendance_records
for select
to authenticated
using (public.trackly_can_admin_email(user_email));

create policy "Admins can update company attendance"
on public.attendance_records
for update
to authenticated
using (public.trackly_can_admin_email(user_email))
with check (public.trackly_can_admin_email(user_email));

create policy "Admins can delete company attendance"
on public.attendance_records
for delete
to authenticated
using (public.trackly_can_admin_email(user_email));

drop policy if exists "Users can read own salary settings" on public.user_salary_settings;
drop policy if exists "Users can insert own salary settings" on public.user_salary_settings;
drop policy if exists "Users can update own salary settings" on public.user_salary_settings;
drop policy if exists "Admins can read company salary settings" on public.user_salary_settings;
drop policy if exists "Admins can update company salary settings" on public.user_salary_settings;

create policy "Users can read own salary settings"
on public.user_salary_settings
for select
to authenticated
using (lower(user_email) = lower(auth.jwt()->>'email'));

create policy "Users can insert own salary settings"
on public.user_salary_settings
for insert
to authenticated
with check (lower(user_email) = lower(auth.jwt()->>'email'));

create policy "Users can update own salary settings"
on public.user_salary_settings
for update
to authenticated
using (lower(user_email) = lower(auth.jwt()->>'email'))
with check (lower(user_email) = lower(auth.jwt()->>'email'));

create policy "Admins can read company salary settings"
on public.user_salary_settings
for select
to authenticated
using (public.trackly_can_admin_email(user_email));

create policy "Admins can update company salary settings"
on public.user_salary_settings
for update
to authenticated
using (public.trackly_can_admin_email(user_email))
with check (public.trackly_can_admin_email(user_email));
