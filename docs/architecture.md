# Architecture

## Runtime

- Frontend: Next.js App Router in `apps/web`
- Deployment target: Cloudflare Workers via OpenNext
- Data/auth/storage: Supabase
- Monorepo orchestration: Turborepo

## Package boundaries

- `apps/web` owns routes, server actions, server-side repositories, auth flow, and venue-facing UI.
- `packages/domain` owns enums, schemas, and pure helpers such as terminology defaults, check-in sorting, and fee math.
- `packages/integrations` owns provider contracts and placeholder adapters so external APIs stay behind clear interfaces.
- `packages/ui` owns the shared visual primitives and the mobile-first admin shell.
- `packages/config` centralizes env parsing, shared tsconfig files, and the Tailwind preset.

## Data model

The schema in `supabase/migrations` covers the planned MVP surface:

- Core tenancy: `venues`, `venue_users`, `platform_admins`, `user_profiles`
- Catalog: `items`, `item_external_links`
- Events: `events`, `event_bookings`, `event_check_in_sessions`, `check_in_events`
- Memberships: `membership_plans`, `memberships`
- Engagement: `followers`, `notification_logs`
- Providers: `square_connections`, `provider_webhook_events`

## Multi-tenant approach

- Every tenant-owned table carries `venue_id`.
- RLS is enabled on tenant tables.
- Authenticated users gain access through `venue_users`.
- Platform admins are recognized through either the `platform_admins` table or the `PLATFORM_ADMIN_EMAILS` bootstrap env.
- Public reads are limited to published or active venue content.

## MVP choices

- Operator-assisted onboarding is primary.
- Stripe Connect is planned around `Standard + direct charges`.
- TaproomOS owns item records; Square becomes an optional linked source.
- Distribution starts with iframe embeds and dynamic SSR pages.
- No queueing, webhook orchestration, or advanced cache invalidation yet.

