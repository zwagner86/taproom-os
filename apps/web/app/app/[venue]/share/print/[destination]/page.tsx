export const dynamic = "force-dynamic";

import QRCode from "react-qr-code";
import { notFound } from "next/navigation";

import { resolvePrintLayout, type PrintLayout, type ShareDestination } from "@/lib/share-kit";
import { resolveSharePrintDestination } from "@/server/share-print";

export default async function SharePrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ destination: string; venue: string }>;
  searchParams: Promise<{ layout?: string | string[] }>;
}) {
  const [{ destination, venue }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const resolvedDestination = await resolveSharePrintDestination({
    destinationKey: destination,
    venueSlug: venue,
  });

  if (!resolvedDestination) {
    notFound();
  }

  const layout = resolvePrintLayout(resolvedSearchParams.layout);
  const printLayout = getPrintLayoutConfig(layout);

  return (
    <main className="bg-white text-neutral-950">
      <style>{printStyles(resolvedDestination.access.venue.accent_color, printLayout)}</style>
      <PrintTemplate
        className={printLayout.className}
        destination={resolvedDestination.destination}
        inserts={printLayout.inserts}
        logoUrl={resolvedDestination.access.venue.logo_url}
        qrSize={printLayout.qrSize}
        venueName={resolvedDestination.access.venue.name}
      />
    </main>
  );
}

type PrintLayoutConfig = {
  className: string;
  inserts: number;
  pageSize: string;
  qrSize: number;
};

function getPrintLayoutConfig(layout: PrintLayout): PrintLayoutConfig {
  switch (layout) {
    case "half-letter":
      return {
        className: "print-sheet-half-letter",
        inserts: 2,
        pageSize: "8.5in 11in",
        qrSize: 260,
      };
    case "photo-4x6":
      return {
        className: "print-sheet-photo-4x6",
        inserts: 2,
        pageSize: "8.5in 11in",
        qrSize: 220,
      };
    case "letter":
      return {
        className: "print-sheet-letter",
        inserts: 1,
        pageSize: "8.5in 11in",
        qrSize: 340,
      };
  }
}

function PrintTemplate({
  className,
  destination,
  inserts,
  logoUrl,
  qrSize,
  venueName,
}: {
  className: string;
  destination: ShareDestination;
  inserts: number;
  logoUrl: string | null;
  qrSize: number;
  venueName: string;
}) {
  return (
    <div className={`print-sheet ${className}`}>
      {Array.from({ length: inserts }, (_, index) => (
        <div className="print-insert" key={index}>
          <PrintPanel destination={destination} logoUrl={logoUrl} qrSize={qrSize} venueName={venueName} />
        </div>
      ))}
    </div>
  );
}

function PrintPanel({
  destination,
  logoUrl,
  qrSize,
  venueName,
}: {
  destination: ShareDestination;
  logoUrl: string | null;
  qrSize: number;
  venueName: string;
}) {
  return (
    <section className="print-panel">
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

function printStyles(accentColor: string, layout: PrintLayoutConfig) {
  return `
    :root { --print-accent: ${accentColor || "#C96B2C"}; }
    @page { margin: 0; size: ${layout.pageSize}; }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body { background: white; }
    .print-sheet { background: white; color: #17120d; display: flex; height: 11in; position: relative; width: 8.5in; }
    .print-insert { align-items: center; display: flex; justify-content: center; position: relative; }
    .print-insert::after { border: 1px dashed #d8cfc6; content: ""; inset: 0; pointer-events: none; position: absolute; }
    .print-sheet-letter .print-insert::after { display: none; }
    .print-panel { align-items: center; display: flex; flex-direction: column; height: 100%; justify-content: center; overflow: hidden; padding: 0.35in; text-align: center; width: 100%; }
    .brand { align-items: center; display: flex; gap: 0.18in; justify-content: center; margin-bottom: 0.18in; }
    .brand-logo { border: 1px solid #e5ded6; border-radius: 0.13in; height: 0.7in; object-fit: cover; width: 0.7in; }
    .venue-name { color: var(--print-accent); font-size: 0.16in; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
    h1 { font-size: 0.42in; font-weight: 900; letter-spacing: 0; line-height: 1.05; margin: 0.04in 0 0; }
    .callout { color: #5f554d; font-size: 0.19in; margin: 0 0 0.18in; }
    .qr-box { background: white; border: 1px solid #e7ded4; border-radius: 0.18in; padding: 0.18in; }
    .print-url { color: #5f554d; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.115in; margin-top: 0.18in; max-width: 5.6in; overflow-wrap: anywhere; }
    footer { color: #91877e; font-size: 0.12in; font-weight: 600; margin-top: 0.16in; }
    .print-sheet-letter .print-insert { height: 11in; width: 8.5in; }
    .print-sheet-half-letter { flex-direction: column; }
    .print-sheet-half-letter::before { border-top: 1px dashed #b9afa5; content: ""; left: 0; position: absolute; right: 0; top: 5.5in; z-index: 2; }
    .print-sheet-half-letter .print-insert { height: 5.5in; width: 8.5in; }
    .print-sheet-half-letter .print-panel { height: 8.5in; left: 50%; padding: 0.32in; position: absolute; top: 50%; transform: translate(-50%, -50%) rotate(90deg); transform-origin: center; width: 5.5in; }
    .print-sheet-half-letter h1 { font-size: 0.34in; }
    .print-sheet-half-letter .brand-logo { height: 0.56in; width: 0.56in; }
    .print-sheet-half-letter .print-url { max-width: 4.6in; }
    .print-sheet-photo-4x6 { align-items: center; gap: 0.18in; justify-content: center; }
    .print-sheet-photo-4x6 .print-insert { height: 6in; width: 4in; }
    .print-sheet-photo-4x6 .print-panel { padding: 0.22in; }
    .print-sheet-photo-4x6 .brand { gap: 0.12in; margin-bottom: 0.12in; }
    .print-sheet-photo-4x6 .brand-logo { border-radius: 0.09in; height: 0.46in; width: 0.46in; }
    .print-sheet-photo-4x6 .venue-name { font-size: 0.12in; }
    .print-sheet-photo-4x6 h1 { font-size: 0.25in; }
    .print-sheet-photo-4x6 .callout { font-size: 0.15in; margin-bottom: 0.13in; }
    .print-sheet-photo-4x6 .qr-box { border-radius: 0.12in; padding: 0.12in; }
    .print-sheet-photo-4x6 .print-url { font-size: 0.08in; max-width: 3.4in; }
    .print-sheet-photo-4x6 footer { font-size: 0.09in; margin-top: 0.12in; }
    @media screen {
      main { padding: 24px; }
      .print-sheet { border: 1px solid #e5ded6; box-shadow: 0 20px 60px rgba(80, 54, 31, 0.12); margin: 0 auto; }
    }
  `;
}
