# Cloudflare Deployment Notes

## Current deployment posture

- The web app is structured for Cloudflare Workers with OpenNext.
- `apps/web/open-next.config.ts` and `apps/web/wrangler.jsonc` provide the initial adapter/config shape.
- `nodejs_compat` is enabled in Wrangler because the current stack depends on Node-compatible behavior.

## Commands

- Local app dev: `pnpm dev`
- Local Cloudflare-style preview: `pnpm web:preview`
- Deploy: `pnpm web:deploy`

## Environment and secrets

The Worker/runtime environment needs at least:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `PLATFORM_ADMIN_EMAILS`
- `APP_ENCRYPTION_KEY`

Add live integration secrets for commerce and messaging:

- Stripe Connect client ID, secret, and webhook secret
- Twilio credentials
- Resend sender + API key
- Square application credentials + environment

## Practical notes

- The local `build` script uses webpack for a predictable Next.js build in this environment.
- OpenNext preview/deploy commands are still the intended Cloudflare deployment path.
- If you introduce ISR or on-demand revalidation later, revisit the OpenNext/Cloudflare cache setup rather than layering it in ad hoc.
- Stripe and Square callbacks assume `NEXT_PUBLIC_APP_URL` matches the public Cloudflare-hosted origin.
- Use the Supabase publishable key for browser and SSR session clients, and the Supabase secret key only for server-side admin actions.
