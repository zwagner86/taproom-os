# Local Setup

## Prerequisites

- Node 22+
- pnpm 9+
- A Supabase project

## Environment

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `PLATFORM_ADMIN_EMAILS` (comma-separated signed-in emails that should get platform-admin access)
- `APP_ENCRYPTION_KEY`

Add live integrations when you want end-to-end commerce and messaging:

- `STRIPE_CONNECT_CLIENT_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_FROM_EMAIL`
- `RESEND_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_PHONE`
- `SQUARE_APPLICATION_ID`
- `SQUARE_APPLICATION_SECRET`
- `SQUARE_ENVIRONMENT`

## Database setup

Apply the files in `supabase/migrations` in order:

1. `0001_core.sql`
2. `0002_catalog.sql`
3. `0003_events.sql`
4. `0004_memberships.sql`
5. `0005_engagement.sql`
6. `0006_providers.sql`
7. `0007_billing_and_lifecycle.sql`
8. `0008_notifications_and_square.sql`

Optional: run `supabase/seed.sql` to get the `demo-taproom` venue, sample operating data, and seeded displays immediately.

If `0003_events.sql` failed previously while applying, the Supabase CLI usually does not record it as applied. Re-run from `0003` after fixing the file. If the failed attempt left partial objects behind, clean up only `events`, `event_bookings`, `event_check_in_sessions`, and `check_in_events`, then continue with `0004` onward.

## Development flow

- `pnpm install`
- `pnpm dev`
- Visit `/signup` to create an operator account.
- Visit `/onboarding` to create a venue as the signed-in user.
- If your signed-in email matches `PLATFORM_ADMIN_EMAILS`, use `/internal` for the platform-admin dashboard and `/internal/venues` for provisioning.
- Stripe is optional for menus, free events, followers, displays, and Square-linked catalog syncing.
- Use `/app/[venue]/billing` when you want to connect or create the venue's Stripe account for paid events or memberships.
- Connect Square from `/app/[venue]/integrations/square`.
- Use `/app/[venue]/events`, `/app/[venue]/memberships`, `/app/[venue]/notifications`, and `/app/[venue]/followers` to exercise the rest of the MVP.

## Verification

- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @taproom/web build`
