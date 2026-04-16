create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.venue_type as enum ('brewery', 'cidery', 'meadery', 'distillery', 'taproom');
create type public.venue_role as enum ('owner', 'admin', 'staff');
create type public.item_type as enum ('pour', 'food', 'merch', 'event');
create type public.price_source as enum ('unpriced', 'manual', 'square');
create type public.booking_status as enum ('pending', 'confirmed', 'cancelled');
create type public.payment_status as enum ('unpaid', 'paid', 'refunded');
create type public.billing_interval as enum ('month', 'quarter', 'year');
create type public.notification_channel as enum ('email', 'sms');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  venue_type public.venue_type not null,
  menu_label text not null default 'Tap List',
  membership_label text not null default 'Club',
  accent_color text not null default '#C96B2C',
  logo_url text,
  tagline text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint venues_slug_format check (slug::text ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint venues_accent_color_format check (accent_color ~ '^#([0-9a-fA-F]{6})$')
);

create trigger set_venues_updated_at
before update on public.venues
for each row
execute function public.set_updated_at();

create table if not exists public.venue_users (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.venue_role not null default 'admin',
  created_at timestamptz not null default timezone('utc', now()),
  unique (venue_id, user_id)
);

create table if not exists public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins
    where user_id = auth.uid()
  );
$$;

create or replace function public.user_has_venue_access(target_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_platform_admin()
    or exists (
      select 1
      from public.venue_users
      where venue_id = target_venue_id
        and user_id = auth.uid()
    );
$$;

alter table public.user_profiles enable row level security;
alter table public.venues enable row level security;
alter table public.venue_users enable row level security;
alter table public.platform_admins enable row level security;

create policy "user_profiles_self_select"
on public.user_profiles
for select
using (auth.uid() = id);

create policy "user_profiles_self_update"
on public.user_profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "user_profiles_self_insert"
on public.user_profiles
for insert
with check (auth.uid() = id);

create policy "venues_public_read"
on public.venues
for select
using (true);

create policy "venues_authenticated_insert"
on public.venues
for insert
with check (auth.role() = 'authenticated');

create policy "venues_tenant_update"
on public.venues
for update
using (public.user_has_venue_access(id))
with check (public.user_has_venue_access(id));

create policy "venue_users_visible_to_tenant"
on public.venue_users
for select
using (public.user_has_venue_access(venue_id) or auth.uid() = user_id);

create policy "venue_users_self_insert"
on public.venue_users
for insert
with check (
  auth.uid() = user_id
  and role = 'owner'
);

create policy "venue_users_tenant_update"
on public.venue_users
for update
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));

create policy "venue_users_tenant_delete"
on public.venue_users
for delete
using (public.user_has_venue_access(venue_id));

create policy "platform_admins_self_select"
on public.platform_admins
for select
using (auth.uid() = user_id);

