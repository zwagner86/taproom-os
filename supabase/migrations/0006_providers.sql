create table if not exists public.square_connections (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null unique references public.venues (id) on delete cascade,
  merchant_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  status text not null default 'not_connected',
  synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint square_connections_status_check check (status in ('not_connected', 'pending', 'active', 'error'))
);

create trigger set_square_connections_updated_at
before update on public.square_connections
for each row
execute function public.set_updated_at();

create table if not exists public.provider_webhook_events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues (id) on delete set null,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (provider, provider_event_id),
  constraint provider_webhook_events_provider_check check (provider in ('stripe', 'square', 'twilio', 'resend'))
);

alter table public.square_connections enable row level security;
alter table public.provider_webhook_events enable row level security;

create policy "square_connections_tenant_full_access"
on public.square_connections
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));

create policy "provider_webhook_events_tenant_read"
on public.provider_webhook_events
for select
using (venue_id is not null and public.user_has_venue_access(venue_id));

