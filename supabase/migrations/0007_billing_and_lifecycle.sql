create table if not exists public.stripe_connections (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null unique references public.venues (id) on delete cascade,
  stripe_account_id text unique,
  access_token_encrypted text,
  refresh_token_encrypted text,
  status text not null default 'not_connected',
  charges_enabled boolean not null default false,
  details_submitted boolean not null default false,
  last_error text,
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint stripe_connections_status_check check (status in ('not_connected', 'pending', 'active', 'error'))
);

create trigger set_stripe_connections_updated_at
before update on public.stripe_connections
for each row
execute function public.set_updated_at();

alter table public.stripe_connections enable row level security;

create policy "stripe_connections_tenant_full_access"
on public.stripe_connections
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));

alter table public.events
add column if not exists status text not null default 'draft';

alter table public.events
add constraint events_status_check
check (status in ('draft', 'published', 'archived', 'cancelled'));

alter table public.event_bookings
add column if not exists unit_price_cents integer not null default 0,
add column if not exists total_price_cents integer not null default 0,
add column if not exists currency text not null default 'USD',
add column if not exists stripe_charge_id text,
add column if not exists refunded_amount_cents integer not null default 0,
add column if not exists confirmed_at timestamptz,
add column if not exists cancelled_at timestamptz;

alter table public.event_bookings
add constraint event_bookings_unit_price_cents_check
check (unit_price_cents >= 0);

alter table public.event_bookings
add constraint event_bookings_total_price_cents_check
check (total_price_cents >= 0);

alter table public.event_bookings
add constraint event_bookings_refunded_amount_cents_check
check (refunded_amount_cents >= 0 and refunded_amount_cents <= total_price_cents);

alter table public.event_bookings
add constraint event_bookings_currency_check
check (char_length(currency) = 3);

alter table public.membership_plans
add column if not exists currency text not null default 'USD';

alter table public.membership_plans
add constraint membership_plans_currency_check
check (char_length(currency) = 3);

alter table public.memberships
drop constraint if exists memberships_status_check;

alter table public.memberships
alter column status set default 'pending';

alter table public.memberships
add column if not exists plan_name_snapshot text,
add column if not exists billing_interval public.billing_interval,
add column if not exists price_cents integer,
add column if not exists currency text not null default 'USD',
add column if not exists current_period_end timestamptz,
add column if not exists cancel_at_period_end boolean not null default false,
add column if not exists cancelled_at timestamptz,
add column if not exists ended_at timestamptz;

alter table public.memberships
add constraint memberships_status_check
check (status in ('pending', 'active', 'past_due', 'cancelled'));

alter table public.memberships
add constraint memberships_price_check
check (price_cents is null or price_cents >= 0);

alter table public.memberships
add constraint memberships_currency_check
check (char_length(currency) = 3);

