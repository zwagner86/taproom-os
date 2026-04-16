create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  billing_interval public.billing_interval not null,
  price_cents integer not null,
  active boolean not null default true,
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (venue_id, slug),
  constraint membership_plans_price_check check (price_cents >= 0)
);

create trigger set_membership_plans_updated_at
before update on public.membership_plans
for each row
execute function public.set_updated_at();

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  membership_plan_id uuid not null references public.membership_plans (id) on delete cascade,
  member_name text not null,
  member_email citext,
  member_phone text,
  status text not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint memberships_status_check check (status in ('active', 'past_due', 'cancelled'))
);

create trigger set_memberships_updated_at
before update on public.memberships
for each row
execute function public.set_updated_at();

alter table public.membership_plans enable row level security;
alter table public.memberships enable row level security;

create policy "membership_plans_public_read_active"
on public.membership_plans
for select
using (active = true);

create policy "membership_plans_tenant_full_access"
on public.membership_plans
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));

create policy "memberships_tenant_full_access"
on public.memberships
for all
using (public.user_has_venue_access(venue_id))
with check (public.user_has_venue_access(venue_id));

