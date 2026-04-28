create type public.item_status as enum ('active', 'coming_soon', 'hidden');

create table if not exists public.menu_sections (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  item_type public.item_type not null,
  name text not null,
  description text,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_menu_sections_updated_at
before update on public.menu_sections
for each row
execute function public.set_updated_at();

alter table public.items
add column if not exists menu_section_id uuid references public.menu_sections (id) on delete set null,
add column if not exists producer_name text,
add column if not exists producer_location text,
add column if not exists status public.item_status not null default 'active';

update public.items
set status = case when active then 'active'::public.item_status else 'hidden'::public.item_status end
where status is distinct from case when active then 'active'::public.item_status else 'hidden'::public.item_status end;

create table if not exists public.item_servings (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  venue_id uuid not null references public.venues (id) on delete cascade,
  label text not null,
  size_oz numeric(5,1),
  glassware text,
  price_cents integer,
  currency text not null default 'USD',
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint item_servings_price_check check (price_cents is null or price_cents >= 0),
  constraint item_servings_size_check check (size_oz is null or size_oz > 0),
  constraint item_servings_currency_check check (char_length(currency) = 3)
);

create trigger set_item_servings_updated_at
before update on public.item_servings
for each row
execute function public.set_updated_at();

create table if not exists public.item_serving_external_links (
  id uuid primary key default gen_random_uuid(),
  item_serving_id uuid not null references public.item_servings (id) on delete cascade,
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
  unique (item_serving_id, provider),
  constraint item_serving_external_links_provider_check check (provider in ('square')),
  constraint item_serving_external_links_currency_check check (price_snapshot_currency is null or char_length(price_snapshot_currency) = 3)
);

create trigger set_item_serving_external_links_updated_at
before update on public.item_serving_external_links
for each row
execute function public.set_updated_at();

create index if not exists menu_sections_venue_type_order_idx
on public.menu_sections (venue_id, item_type, display_order, name);

create index if not exists items_venue_section_order_idx
on public.items (venue_id, menu_section_id, status, display_order, name);

create index if not exists item_servings_item_order_idx
on public.item_servings (item_id, active, display_order, label);

create or replace function public.seed_default_menu_sections(target_venue_id uuid, target_venue_type public.venue_type)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.menu_sections where venue_id = target_venue_id) then
    return;
  end if;

  if target_venue_type in ('brewery', 'taproom') then
    insert into public.menu_sections (venue_id, item_type, name, display_order)
    values
      (target_venue_id, 'pour', 'Regular Beers', 10),
      (target_venue_id, 'pour', 'Seasonal Beers', 20),
      (target_venue_id, 'pour', 'Guest Pours', 30),
      (target_venue_id, 'pour', 'Non-Alcoholic', 40),
      (target_venue_id, 'food', 'Food', 50);
  else
    insert into public.menu_sections (venue_id, item_type, name, display_order)
    values
      (target_venue_id, 'pour', 'Drinks', 10),
      (target_venue_id, 'food', 'Food', 20);
  end if;
end;
$$;

create or replace function public.seed_default_menu_sections_for_new_venue()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_menu_sections(new.id, new.venue_type);
  return new;
end;
$$;

drop trigger if exists seed_default_menu_sections_for_new_venue on public.venues;
create trigger seed_default_menu_sections_for_new_venue
after insert on public.venues
for each row
execute function public.seed_default_menu_sections_for_new_venue();

create or replace function public.assign_default_menu_section()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.menu_section_id is null then
    select id into new.menu_section_id
    from public.menu_sections
    where venue_id = new.venue_id
      and item_type = new.type
    order by display_order, name
    limit 1;
  end if;

  new.status = case
    when new.status = 'hidden'::public.item_status or new.active = false then 'hidden'::public.item_status
    else new.status
  end;
  new.active = new.status <> 'hidden'::public.item_status;
  return new;
end;
$$;

drop trigger if exists assign_default_menu_section on public.items;
create trigger assign_default_menu_section
before insert or update on public.items
for each row
execute function public.assign_default_menu_section();

create or replace function public.create_default_item_serving()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.item_servings where item_id = new.id) then
    insert into public.item_servings (item_id, venue_id, label, display_order)
    values (new.id, new.venue_id, 'Serving', 0);
  end if;
  return new;
end;
$$;

drop trigger if exists create_default_item_serving on public.items;
create trigger create_default_item_serving
after insert on public.items
for each row
execute function public.create_default_item_serving();

do $$
declare
  venue_record record;
  section_id uuid;
  item_record record;
  serving_id uuid;
begin
  for venue_record in select id, venue_type from public.venues loop
    perform public.seed_default_menu_sections(venue_record.id, venue_record.venue_type);
  end loop;

  for item_record in select id, venue_id, type, price_source from public.items loop
    select id into section_id
    from public.menu_sections
    where venue_id = item_record.venue_id
      and item_type = item_record.type
    order by display_order, name
    limit 1;

    if section_id is not null then
      update public.items
      set menu_section_id = section_id
      where id = item_record.id
        and menu_section_id is null;
    end if;

    if not exists (select 1 from public.item_servings where item_id = item_record.id) then
      insert into public.item_servings (item_id, venue_id, label, display_order)
      values (item_record.id, item_record.venue_id, 'Serving', 0)
      returning id into serving_id;

      insert into public.item_serving_external_links (
        item_serving_id,
        venue_id,
        provider,
        external_id,
        price_snapshot_cents,
        price_snapshot_currency,
        availability_snapshot,
        synced_at
      )
      select
        serving_id,
        venue_id,
        provider,
        external_id,
        price_snapshot_cents,
        price_snapshot_currency,
        availability_snapshot,
        synced_at
      from public.item_external_links
      where item_id = item_record.id
      on conflict do nothing;
    end if;
  end loop;
end $$;

alter table public.menu_sections enable row level security;
alter table public.item_servings enable row level security;
alter table public.item_serving_external_links enable row level security;

drop policy if exists "items_public_read_active" on public.items;
create policy "items_public_read_visible"
on public.items
for select
using (status in ('active', 'coming_soon'));

create policy "menu_sections_public_read_active"
on public.menu_sections
for select
using (active = true);

create policy "menu_sections_tenant_full_access"
on public.menu_sections
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));

create policy "item_servings_public_read_for_visible_items"
on public.item_servings
for select
using (
  active = true
  and exists (
    select 1
    from public.items
    where items.id = item_servings.item_id
      and items.status in ('active', 'coming_soon')
  )
);

create policy "item_servings_tenant_full_access"
on public.item_servings
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));

create policy "item_serving_external_links_public_read_for_visible_items"
on public.item_serving_external_links
for select
using (
  exists (
    select 1
    from public.item_servings
    join public.items on items.id = item_servings.item_id
    where item_servings.id = item_serving_external_links.item_serving_id
      and item_servings.active = true
      and items.status in ('active', 'coming_soon')
  )
);

create policy "item_serving_external_links_tenant_full_access"
on public.item_serving_external_links
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));
