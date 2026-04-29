# TaproomOS QR + Share Kit

The Share & QR admin page lives at `/app/[venue]/share`. It uses TaproomOS public routes as the stable QR contract:

- `/v/[venue]/menu`
- `/v/[venue]/events`
- `/v/[venue]/memberships`
- `/v/[venue]/follow`
- `/v/[venue]/events/[eventId]`

QR codes are generated dynamically in the browser from these absolute URLs with `react-qr-code`. PNG and SVG downloads are derived from the rendered SVG at click time; no QR images are stored in Supabase tables, Supabase Storage, or any other asset store.

Print templates live under `/app/[venue]/share/print/[destination]` and require the same venue admin access as the rest of the admin app. The supported layouts are `?layout=tent` and `?layout=poster`. They use HTML/CSS print styles, venue name, logo, and accent color, plus a subtle “Powered by TaproomOS” footer.

Event QR links use immutable event IDs. Legacy event slug URLs still resolve, but editing an event no longer rewrites the existing slug.

Deferred scope remains intentionally out of v1: QR scan analytics, dynamic destinations, smart redirects, template editing, advanced branding controls, A/B testing, campaigns, and custom domains.
