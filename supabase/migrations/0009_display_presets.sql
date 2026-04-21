create table if not exists public.display_presets (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  slug text not null,
  name text not null,
  kind text not null default 'view',
  default_surface text not null default 'public',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (venue_id, slug),
  constraint display_presets_kind_check check (kind in ('view', 'playlist')),
  constraint display_presets_surface_check check (default_surface in ('public', 'embed', 'tv'))
);

create trigger set_display_presets_updated_at
before update on public.display_presets
for each row
execute function public.set_updated_at();

alter table public.display_presets enable row level security;

create policy "display_presets_public_read"
on public.display_presets
for select
using (true);

create policy "display_presets_tenant_full_access"
on public.display_presets
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));
