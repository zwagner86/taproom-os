export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/ui";
import { ShareQrCard } from "@/components/share-qr-card";
import { getEnv } from "@/env";
import { buildCoreShareDestinations, buildEventShareDestination } from "@/lib/share-kit";
import { listVenueEvents } from "@/server/repositories/events";
import { requireVenueAccess } from "@/server/repositories/venues";

export default async function VenueSharePage({
  params,
}: {
  params: Promise<{ venue: string }>;
}) {
  const { venue } = await params;
  const access = await requireVenueAccess(venue);
  const events = await listVenueEvents(access.venue.id);
  const appUrl = getEnv().NEXT_PUBLIC_APP_URL;
  const coreDestinations = buildCoreShareDestinations({ appUrl, venueSlug: venue });
  const eventDestinations = events
    .filter((event) => event.published && event.status === "published")
    .map((event) => buildEventShareDestination({ appUrl, event, venueSlug: venue }));

  return (
    <div className="space-y-6">
      <PageHeader
        subtitle={`Copy stable public links, download QR codes, and print table tents or posters for ${access.venue.name}.`}
        title="Share & QR"
      />

      <section className="grid gap-4">
        {coreDestinations.map((destination) => (
          <ShareQrCard destination={destination} key={destination.id} venueSlug={venue} />
        ))}
      </section>

      {eventDestinations.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Event links</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Individual event QR codes use permanent event IDs so printed materials keep working even if event titles change.
            </p>
          </div>
          <div className="grid gap-4">
            {eventDestinations.map((destination) => (
              <ShareQrCard destination={destination} key={destination.id} venueSlug={venue} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
