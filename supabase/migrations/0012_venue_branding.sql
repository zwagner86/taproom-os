alter table public.venues
  add column if not exists secondary_accent_color text not null default '#2E9F9A',
  add column if not exists display_theme text not null default 'light';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'venues_secondary_accent_color_format'
  ) then
    alter table public.venues
      add constraint venues_secondary_accent_color_format check (secondary_accent_color ~ '^#([0-9a-fA-F]{6})$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'venues_display_theme_check'
  ) then
    alter table public.venues
      add constraint venues_display_theme_check check (display_theme in ('light', 'dark'));
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('venue-logos', 'venue-logos', true)
on conflict (id) do update set public = excluded.public;

create policy "venue_logos_public_read"
on storage.objects
for select
using (bucket_id = 'venue-logos');

create policy "venue_logos_tenant_insert"
on storage.objects
for insert
with check (
  bucket_id = 'venue-logos'
  and public.user_has_venue_access((storage.foldername(name))[1]::uuid)
);

create policy "venue_logos_tenant_update"
on storage.objects
for update
using (
  bucket_id = 'venue-logos'
  and public.user_has_venue_access((storage.foldername(name))[1]::uuid)
)
with check (
  bucket_id = 'venue-logos'
  and public.user_has_venue_access((storage.foldername(name))[1]::uuid)
);

create policy "venue_logos_tenant_delete"
on storage.objects
for delete
using (
  bucket_id = 'venue-logos'
  and public.user_has_venue_access((storage.foldername(name))[1]::uuid)
);
