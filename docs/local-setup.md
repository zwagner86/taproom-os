# Local Setup

## Prerequisites

- Node 22+
- pnpm 9+
- A Supabase project

## Environment

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PLATFORM_ADMIN_EMAILS`
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

Optional: run `supabase/seed.sql` to get the `demo-taproom` public venue immediately.

## Development flow

- `pnpm install`
- `pnpm dev`
- Visit `/signup` to create an operator account.
- Visit `/onboarding` to create a venue as the signed-in user.
- If your email is listed in `PLATFORM_ADMIN_EMAILS`, use `/internal/venues` for operator-assisted venue provisioning.
- Connect Stripe from `/app/[venue]/billing` and Square from `/app/[venue]/integrations/square`.
- Use `/app/[venue]/events`, `/app/[venue]/memberships`, `/app/[venue]/notifications`, and `/app/[venue]/followers` to exercise the rest of the MVP.

## Verification

- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @taproom/web build`
