export const dynamic = "force-dynamic";

import QRCode from "react-qr-code";
import { notFound } from "next/navigation";

import { getEnv } from "@/env";
import {
  buildCoreShareDestinations,
  buildEventShareDestination,
  parsePrintDestinationKey,
  resolvePrintLayout,
  type PrintLayout,
  type ShareDestination,
} from "@/lib/share-kit";
import { getVenueEventById } from "@/server/repositories/events";
import { requireVenueAccess } from "@/server/repositories/venues";

export default async function SharePrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ destination: string; venue: string }>;
  searchParams: Promise<{ layout?: string | string[] }>;
}) {
  const [{ destination, venue }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const access = await requireVenueAccess(venue);
  const parsed = parsePrintDestinationKey(destination);

  if (!parsed) {
    notFound();
  }

  const appUrl = getEnv().NEXT_PUBLIC_APP_URL;
  const shareDestination =
    parsed.kind === "event"
      ? await resolveEventDestination({
          appUrl,
          eventId: parsed.eventId,
          venueId: access.venue.id,
          venueSlug: venue,
        })
      : buildCoreShareDestinations({ appUrl, venueSlug: venue }).find((entry) => entry.id === parsed.id) ?? null;

  if (!shareDestination) {
    notFound();
  }

  const layout = resolvePrintLayout(resolvedSearchParams.layout);

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <style>{printStyles(access.venue.accent_color, layout)}</style>
      {layout === "poster" ? (
        <PosterTemplate destination={shareDestination} logoUrl={access.venue.logo_url} venueName={access.venue.name} />
      ) : (
        <TableTentTemplate destination={shareDestination} logoUrl={access.venue.logo_url} venueName={access.venue.name} />
      )}
    </main>
  );
}

async function resolveEventDestination({
  appUrl,
  eventId,
  venueId,
  venueSlug,
}: {
  appUrl: string;
  eventId: string;
  venueId: string;
  venueSlug: string;
}) {
  const event = await getVenueEventById(venueId, eventId);

  if (!event || !event.published || event.status !== "published") {
    return null;
  }

  return buildEventShareDestination({ appUrl, event, venueSlug });
}

function TableTentTemplate({
  destination,
  logoUrl,
  venueName,
}: {
  destination: ShareDestination;
  logoUrl: string | null;
  venueName: string;
}) {
  return (
    <div className="print-sheet print-sheet-tent">
      <PrintPanel destination={destination} flipped logoUrl={logoUrl} qrSize={210} venueName={venueName} />
      <div className="fold-line" />
      <PrintPanel destination={destination} logoUrl={logoUrl} qrSize={210} venueName={venueName} />
    </div>
  );
}

function PosterTemplate({
  destination,
  logoUrl,
  venueName,
}: {
  destination: ShareDestination;
  logoUrl: string | null;
  venueName: string;
}) {
  return (
    <div className="print-sheet print-sheet-poster">
      <PrintPanel destination={destination} logoUrl={logoUrl} qrSize={320} venueName={venueName} />
    </div>
  );
}

function PrintPanel({
  destination,
  flipped = false,
  logoUrl,
  qrSize,
  venueName,
}: {
  destination: ShareDestination;
  flipped?: boolean;
  logoUrl: string | null;
  qrSize: number;
  venueName: string;
}) {
  return (
    <section className={flipped ? "print-panel flipped" : "print-panel"}>
      <div className="brand">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={`${venueName} logo`} className="brand-logo" src={logoUrl} />
        )}
        <div>
          <div className="venue-name">{venueName}</div>
          <h1>{destination.label}</h1>
        </div>
      </div>
      <p className="callout">{printCallout(destination.kind)}</p>
      <div className="qr-box">
        <QRCode
          bgColor="#ffffff"
          fgColor="#000000"
          level="Q"
          size={qrSize}
          title={`${destination.label} QR code`}
          value={destination.url}
          viewBox={`0 0 ${qrSize} ${qrSize}`}
        />
      </div>
      <div className="print-url">{destination.url}</div>
      <footer>Powered by TaproomOS</footer>
    </section>
  );
}

function printCallout(kind: ShareDestination["kind"]) {
  switch (kind) {
    case "events":
      return "Scan for upcoming events.";
    case "event":
      return "Scan for event details and RSVP.";
    case "follow":
      return "Scan for taproom updates.";
    case "memberships":
      return "Scan to join the club.";
    case "menu":
      return "Scan for today's menu.";
  }
}

function printStyles(accentColor: string, layout: PrintLayout) {
  const pageSize = layout === "poster" ? "letter portrait" : "letter landscape";

  return `
    :root { --print-accent: ${accentColor || "#C96B2C"}; }
    @page { margin: 0.35in; size: ${pageSize}; }
    body { background: white; }
    .print-sheet { min-height: 100vh; background: white; color: #17120d; }
    .print-sheet-tent { display: grid; grid-template-rows: 1fr 1px 1fr; min-height: calc(100vh - 0.7in); }
    .print-sheet-poster { display: flex; min-height: calc(100vh - 0.7in); }
    .fold-line { border-top: 1px dashed #b9afa5; }
    .print-panel { align-items: center; display: flex; flex: 1; flex-direction: column; justify-content: center; padding: 0.25in; text-align: center; }
    .print-panel.flipped { transform: rotate(180deg); }
    .brand { align-items: center; display: flex; gap: 0.18in; justify-content: center; margin-bottom: 0.18in; }
    .brand-logo { border: 1px solid #e5ded6; border-radius: 0.13in; height: 0.7in; object-fit: cover; width: 0.7in; }
    .venue-name { color: var(--print-accent); font-size: 0.16in; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
    h1 { font-size: 0.42in; font-weight: 900; letter-spacing: 0; line-height: 1.05; margin: 0.04in 0 0; }
    .callout { color: #5f554d; font-size: 0.19in; margin: 0 0 0.18in; }
    .qr-box { background: white; border: 1px solid #e7ded4; border-radius: 0.18in; padding: 0.18in; }
    .print-url { color: #5f554d; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.115in; margin-top: 0.18in; max-width: 5.6in; overflow-wrap: anywhere; }
    footer { color: #91877e; font-size: 0.12in; font-weight: 600; margin-top: 0.16in; }
    @media screen {
      main { padding: 24px; }
      .print-sheet { border: 1px solid #e5ded6; box-shadow: 0 20px 60px rgba(80, 54, 31, 0.12); margin: 0 auto; max-width: 11in; min-height: 8.2in; }
      .print-sheet-poster { max-width: 8.5in; min-height: 11in; }
    }
    @media print {
      .print-sheet { min-height: auto; }
      .print-sheet-poster { min-height: 10.3in; }
    }
  `;
}
