alter table public.notification_logs
add column if not exists context_type text,
add column if not exists context_id text,
add column if not exists subject text,
add column if not exists error_message text,
add column if not exists sent_at timestamptz;

alter table public.square_connections
add column if not exists last_error text;

create index if not exists notification_logs_venue_created_at_idx
on public.notification_logs (venue_id, created_at desc);

create index if not exists followers_venue_active_idx
on public.followers (venue_id, active);

create index if not exists item_external_links_venue_provider_idx
on public.item_external_links (venue_id, provider);
