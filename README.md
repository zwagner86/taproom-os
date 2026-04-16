# TaproomOS

TaproomOS is a taproom-first operating system for breweries, cideries, meaderies, distilleries, and similar tasting-room venues. This repo is a greenfield MVP scaffold built around Cloudflare-hosted Next.js, Supabase, Stripe Connect, and a clean multi-tenant domain model.

## Current slice

The repo currently implements:

- `pnpm` + Turborepo monorepo
- Next.js App Router app at `apps/web`
- Cloudflare/OpenNext-ready project structure
- Supabase schema + RLS migrations for the planned MVP
- Auth scaffolding for email/password and magic link
- Operator onboarding + internal venue provisioning
- Venue setup page for terminology and branding
- Manual item CRUD for the unified content model
- Public menu, embed menu, and TV display pages
- Event CRUD, public RSVP and paid-event flows, guest list, and shared-session check-in
- Membership plan CRUD, public signup, and in-app cancel/resume controls
- Billing hub with Stripe connect status, fee visibility, ledger, and refund actions
- Follow capture, transactional notifications, and simple broadcast sends
- Square OAuth, live catalog search, link, and read-only snapshot sync
- Shared domain helpers and basic tests for key business rules

## Monorepo layout

- `apps/web`: Next.js app, server actions, route handlers, admin UI, public pages
- `packages/ui`: shared UI primitives and mobile shell
- `packages/domain`: typed domain entities, enums, validation, and pure business rules
- `packages/integrations`: provider contracts plus Stripe/Square/notification stubs
- `packages/config`: shared tsconfig, env parsing helpers, and Tailwind preset
- `supabase/`: SQL migrations, seed data, and handwritten database types
- `docs/`: architecture, local setup, deployment, and deferred scope notes

## Quick start

1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project and set the public URL, anon key, and service-role key.
3. Apply the SQL in `supabase/migrations` to your Supabase database in order.
4. Optionally run `supabase/seed.sql` for the demo venue and public menu data.
5. Install dependencies with `pnpm install`.
6. Run `pnpm dev`.
7. Create an account at `/signup`, then create a venue at `/onboarding`.
8. Add Stripe, Resend, Twilio, and Square credentials if you want live commerce and messaging instead of the built-in no-op adapters.

## Commands

- `pnpm dev`
- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @taproom/web build`
- `pnpm web:preview`

## Notes

- The local web build is pinned to `next build --webpack` because that validated cleanly in this environment.
- `opennextjs-cloudflare build` and deployment notes are documented in [docs/deployment-cloudflare.md](/Users/zacharywagner/code/taproom-os/docs/deployment-cloudflare.md).
- Stripe uses `Standard + direct charges` in this MVP.
- Square remains read-only and link-based: TaproomOS items stay canonical, and Square supplies snapshot pricing/availability.
- Refunds are full-refund only in MVP.
