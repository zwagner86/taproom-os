import { NextResponse } from "next/server";

import { createSharePrintPdf } from "@/lib/share-print-pdf";
import { resolvePrintLayout } from "@/lib/share-kit";
import { resolveSharePrintDestination } from "@/server/share-print";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ destination: string; venue: string }>;
  },
) {
  const { destination, venue } = await params;
  const resolvedDestination = await resolveSharePrintDestination({
    destinationKey: destination,
    venueSlug: venue,
  });

  if (!resolvedDestination) {
    return NextResponse.json({ error: "Print destination not found" }, { status: 404 });
  }

  const searchParams = new URL(request.url).searchParams;
  const layout = resolvePrintLayout(searchParams.get("layout") ?? undefined);
  const pdfBytes = await createSharePrintPdf({
    accentColor: resolvedDestination.access.venue.accent_color,
    destination: resolvedDestination.destination,
    layout,
    venueName: resolvedDestination.access.venue.name,
  });
  const fileName = `${resolvedDestination.destination.fileName}-${layout}.pdf`;
  const body = new ArrayBuffer(pdfBytes.byteLength);
  new Uint8Array(body).set(pdfBytes);

  return new Response(body, {
    headers: {
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Content-Type": "application/pdf",
    },
  });
}
