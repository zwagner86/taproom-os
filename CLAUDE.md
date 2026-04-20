# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

TaproomOS is a greenfield MVP operating system for taproom-style venues (breweries, cideries, meaderies, distilleries). It's a pnpm + Turborepo monorepo targeting Cloudflare Workers deployment via OpenNext.

## Commands

### Development
```bash
pnpm install                        # Install all workspace deps
pnpm dev                            # Start all packages in dev mode (Next.js on :3000)
pnpm typecheck                      # TypeScript check across all packages
pnpm test                           # Run Vitest tests across all packages
pnpm build                          # Build all packages (required before deploy)
```

### Single package
```bash
pnpm --filter @taproom/web dev      # Web app only
pnpm --filter @taproom/domain test  # Domain tests only
pnpm --filter @taproom/web build --webpack  # Webpack-pinned build for Cloudflare
```

### Cloudflare
```bash
pnpm web:preview    # Local Cloudflare Workers preview via OpenNext
pnpm web:deploy     # Deploy to Cloudflare
```

### Supabase
```bash
supabase db reset   # Apply all migrations from scratch
supabase gen types typescript --local > supabase/types.ts  # Regenerate DB types
```

## Monorepo Structure

```
apps/web/           Next.js 16+ App Router (main frontend, Cloudflare target)
packages/domain/    Domain entities, Zod schemas, pure business logic + tests
packages/ui/        Shared React components and primitives
packages/integrations/  Provider implementations (Stripe, Square, Resend, Twilio)
packages/config/    Shared tsconfig, Tailwind preset (fonts, colors, shadows)
supabase/           Migrations (0001–0008), generated types.ts, seed.sql
docs/               Architecture, local-setup, deployment, deferred-scope docs
```

All packages use `workspace:*` protocol. Turborepo tasks: `build → ^build`, `dev` (no cache), `typecheck`, `test`.

## Architecture

### Routing Layout (apps/web/app/)

| Path pattern | Purpose |
|---|---|
| `/app/[venue]/...` | Operator admin routes (auth-required) |
| `/v/[venue]/...` | Public venue-facing pages |
| `/embed/[venue]/...` | Embeddable iframes |
| `/tv/[venue]` | TV display mode |
| `/internal/...` | Platform admin tooling (PLATFORM_ADMIN_EMAILS only) |
| `/check-in/[token]` | Shared event check-in |

### Server-Side Layers (apps/web/src/server/)

- **`actions/`** — Next.js Server Actions for mutations (form submissions)
- **`repositories/`** — Data queries (read-only Supabase calls)
- **`services/`** — Business logic (finance, notifications, payment capability)
- **`providers.ts`** — Factory functions that wire live vs. stub providers based on env vars
- **`auth.ts`** — `getOptionalUser()`, `requireUser()`, `isPlatformAdmin()`

### Provider Pattern

All integrations have abstract contracts in `packages/integrations/src/contracts.ts`. Stubs are the default — no live credentials needed for local dev. Provider factories in `apps/web/src/server/providers.ts` check env vars to decide live vs. stub:

- **Stripe** — `StripePaymentsProvider` / `StubStripePaymentsProvider`
- **Square** — `SquareCatalogProvider` / `StubSquareCatalogProvider`
- **Notifications** — `ResendEmailProvider`, `TwilioSmsProvider`, `NoopNotificationProvider`

### Multi-Tenancy

All tenant tables have a `venue_id` FK. Supabase RLS enforces venue isolation — access is gated via `venue_users` membership. The `createServerSupabaseClient()` (SSR+cookies) respects RLS; `createAdminSupabaseClient()` (secret key) bypasses it for server-only operations.

### Supabase Clients (apps/web/src/lib/supabase/server.ts)

- `createServerSupabaseClient()` — uses publishable key + cookie session (SSR, respects RLS)
- `createAdminSupabaseClient()` — uses secret key (server actions only, bypasses RLS)

### Environment Variables (apps/web/src/env.ts)

Parsed via Zod with caching. Required: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `PLATFORM_ADMIN_EMAILS`, `APP_ENCRYPTION_KEY`. Commerce/notification/integration vars are optional — features degrade gracefully when absent.

For Cloudflare Workers, vars live in `apps/web/.dev.vars` (local) or Wrangler secrets (prod). Not in `.env.local`.

## Database Migrations

Apply in order `0001` → `0008`:
1. `0001_core.sql` — user_profiles, venues, venue_users, platform_admins, RLS
2. `0002_catalog.sql` — items, item_external_links
3. `0003_events.sql` — events, event_bookings, check-in sessions
4. `0004_memberships.sql` — membership_plans, memberships
5. `0005_engagement.sql` — followers
6. `0006_providers.sql` — provider connections
7. `0007_billing_and_lifecycle.sql` — billing ledger, lifecycle events
8. `0008_notifications_and_square.sql` — notification_logs, square_connections, webhook events

Optional: `seed.sql` creates a `demo-taproom` venue.

## Key Domain Concepts

- **Stripe Standard Connect** — Each venue connects its own Stripe account; TaproomOS takes a platform fee (`STRIPE_APPLICATION_FEE_PERCENT`, default 0.08).
- **Square is read-only** — TaproomOS items are canonical; Square provides pricing/availability snapshots only (no writeback in MVP).
- **Venue terminology** — Venues customize labels (e.g. "pour" → "pint", "member" → "member"). Use `resolveTerminology()` from `@taproom/domain` when rendering venue-facing strings.
- **Refunds** — Full-refund only in MVP scope.

## Cloudflare / OpenNext Notes

- Build is pinned to webpack: `next build --webpack` (for predictable Cloudflare output).
- `open-next.config.ts` disables cache interception (ISR not supported on Workers free tier).
- `nodejs_compat` flag is enabled in `wrangler.jsonc` for Node.js API compatibility.
- Do not use Node.js APIs unavailable in the Workers runtime (e.g., `fs`, `child_process`).

## Testing

Domain package (`packages/domain/src/index.test.ts`) contains business rule unit tests — run these when changing domain logic. Web app passes with no tests (`--passWithNoTests`). Use `pnpm --filter @taproom/domain test` to run domain tests in isolation.
