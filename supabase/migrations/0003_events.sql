create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  image_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer,
  price_cents integer,
  currency text not null default 'USD',
  published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (venue_id, slug),
  constraint events_capacity_check check (capacity is null or capacity > 0),
  constraint events_price_check check (price_cents is null or price_cents >= 0),
  constraint events_currency_check check (char_length(currency) = 3)
);

create trigger set_events_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

create table if not exists public.event_bookings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  venue_id uuid not null references public.venues (id) on delete cascade,
  purchaser_name text not null,
  purchaser_email citext,
  purchaser_phone text,
  party_size integer not null,
  checked_in_count integer not null default 0,
  payment_status public.payment_status not null default 'unpaid',
  booking_status public.booking_status not null default 'pending',
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint event_bookings_party_size_check check (party_size > 0),
  constraint event_bookings_check_in_count_check check (checked_in_count >= 0 and checked_in_count <= party_size)
);

create trigger set_event_bookings_updated_at
before update on public.event_bookings
for each row
execute function public.set_updated_at();

create table if not exists public.event_check_in_sessions (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  session_name text not null,
  pin text,
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  created_by_user_id uuid references auth.users (id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_event_check_in_sessions_updated_at
before update on public.event_check_in_sessions
for each row
execute function public.set_updated_at();

create table if not exists public.check_in_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.event_bookings (id) on delete cascade,
  venue_id uuid not null references public.venues (id) on delete cascade,
  delta integer not null,
  actor_type text not null,
  actor_reference text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint check_in_events_actor_type_check check (actor_type in ('venue_user', 'shared_session'))
);

alter table public.events enable row level security;
alter table public.event_bookings enable row level security;
alter table public.event_check_in_sessions enable row level security;
alter table public.check_in_events enable row level security;

create policy "events_public_read_published"
on public.events
for select
using (published = true);

create policy "events_tenant_full_access"
on public.events
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));

create policy "event_bookings_tenant_full_access"
on public.event_bookings
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));

create policy "event_check_in_sessions_tenant_full_access"
on public.event_check_in_sessions
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));

create policy "check_in_events_tenant_full_access"
on public.check_in_events
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));

