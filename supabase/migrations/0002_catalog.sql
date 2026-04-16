create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  type public.item_type not null,
  name text not null,
  style_or_category text,
  abv numeric(4,1),
  description text,
  image_url text,
  active boolean not null default true,
  display_order integer not null default 0,
  price_source public.price_source not null default 'unpriced',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_items_updated_at
before update on public.items
for each row
execute function public.set_updated_at();

create table if not exists public.item_external_links (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  venue_id uuid not null references public.venues (id) on delete cascade,
  provider text not null,
  external_id text not null,
  price_snapshot_cents integer,
  price_snapshot_currency text,
  availability_snapshot boolean,
  synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (provider, external_id),
  unique (item_id, provider),
  constraint item_external_links_provider_check check (provider in ('square')),
  constraint item_external_links_currency_check check (price_snapshot_currency is null or char_length(price_snapshot_currency) = 3)
);

create trigger set_item_external_links_updated_at
before update on public.item_external_links
for each row
execute function public.set_updated_at();

alter table public.items enable row level security;
alter table public.item_external_links enable row level security;

create policy "items_public_read_active"
on public.items
for select
using (active = true);

create policy "items_tenant_full_access"
on public.items
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));

create policy "item_external_links_public_read_for_active_items"
on public.item_external_links
for select
using (
  exists (
    select 1
    from public.items
    where items.id = item_external_links.item_id
      and items.active = true
  )
);

create policy "item_external_links_tenant_full_access"
on public.item_external_links
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));

