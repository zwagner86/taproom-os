create table if not exists public.followers (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  email citext,
  phone text,
  channel_preferences jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  consented_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint followers_contact_check check (email is not null or phone is not null)
);

create trigger set_followers_updated_at
before update on public.followers
for each row
execute function public.set_updated_at();

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  recipient text not null,
  channel public.notification_channel not null,
  template_key text not null,
  provider text not null,
  provider_message_id text,
  status text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.followers enable row level security;
alter table public.notification_logs enable row level security;

create policy "followers_tenant_full_access"
on public.followers
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));

create policy "notification_logs_tenant_full_access"
on public.notification_logs
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));

