drop table if exists public.display_presets cascade;

create table if not exists public.display_views (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  content text not null,
  surface text not null,
  name text,
  slug text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint display_views_content_check check (content in ('menu', 'drinks', 'food', 'events', 'memberships')),
  constraint display_views_surface_check check (surface in ('public', 'embed', 'tv')),
  constraint display_views_identity_check check (
    (surface = 'public' and name is null and slug is null)
    or
    (surface <> 'public' and name is not null and slug is not null)
  )
);

create unique index if not exists display_views_public_unique
on public.display_views (venue_id, content)
where surface = 'public';

create unique index if not exists display_views_saved_slug_unique
on public.display_views (venue_id, surface, slug)
where surface <> 'public';

create index if not exists display_views_lookup_idx
on public.display_views (venue_id, content, surface);

create trigger set_display_views_updated_at
before update on public.display_views
for each row
execute function public.set_updated_at();

alter table public.display_views enable row level security;

create policy "display_views_public_read"
on public.display_views
for select
using (true);

create policy "display_views_tenant_full_access"
on public.display_views
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));

create table if not exists public.display_playlists (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  surface text not null,
  name text not null,
  slug text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint display_playlists_surface_check check (surface in ('embed', 'tv'))
);

create unique index if not exists display_playlists_slug_unique
on public.display_playlists (venue_id, surface, slug);

create trigger set_display_playlists_updated_at
before update on public.display_playlists
for each row
execute function public.set_updated_at();

alter table public.display_playlists enable row level security;

create policy "display_playlists_public_read"
on public.display_playlists
for select
using (true);

create policy "display_playlists_tenant_full_access"
on public.display_playlists
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));
