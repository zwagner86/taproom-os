# TaproomOS QR + Share Kit

The Share & QR admin page lives at `/app/[venue]/share`. It uses TaproomOS public routes as the stable QR contract:

- `/v/[venue]/menu`
- `/v/[venue]/events`
- `/v/[venue]/memberships`
- `/v/[venue]/follow`
- `/v/[venue]/events/[eventId]`

QR codes are generated dynamically in the browser from these absolute URLs with `react-qr-code`. PNG and SVG downloads are derived from the rendered SVG at click time; no QR images are stored in Supabase tables, Supabase Storage, or any other asset store.

Print PDFs live under `/app/[venue]/share/print/[destination]/pdf` and require the same venue admin access as the rest of the admin app. The supported layouts are `?layout=letter`, `?layout=half-letter`, and `?layout=photo-4x6` for acrylic sign inserts. Every PDF is a letter-sized page: letter prints one 8.5 x 11 insert, while half-letter and 4 x 6 print two inserts per page with subtle cut guides. PDFs are generated server-side with vector QR codes, venue name, accent color, destination copy, URL, and a subtle “Powered by TaproomOS” footer. The HTML print route remains available at `/app/[venue]/share/print/[destination]` as a fallback, and legacy `poster` and `tent` layout values fall back to the letter insert.

Event QR links use immutable event IDs. Legacy event slug URLs still resolve, but editing an event no longer rewrites the existing slug.

Deferred scope remains intentionally out of v1: QR scan analytics, dynamic destinations, smart redirects, template editing, advanced branding controls, A/B testing, campaigns, and custom domains.
