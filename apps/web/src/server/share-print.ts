import { getEnv } from "@/env";
import {
  buildCoreShareDestinations,
  buildEventShareDestination,
  parsePrintDestinationKey,
  type ShareDestination,
} from "@/lib/share-kit";
import { getVenueEventById } from "@/server/repositories/events";
import { requireVenueAccess } from "@/server/repositories/venues";

export async function resolveSharePrintDestination({
  destinationKey,
  venueSlug,
}: {
  destinationKey: string;
  venueSlug: string;
}) {
  const access = await requireVenueAccess(venueSlug);
  const parsed = parsePrintDestinationKey(destinationKey);

  if (!parsed) {
    return null;
  }

  const appUrl = getEnv().NEXT_PUBLIC_APP_URL;
  const destination: ShareDestination | null =
    parsed.kind === "event"
      ? await resolveEventDestination({
          appUrl,
          eventId: parsed.eventId,
          venueId: access.venue.id,
          venueSlug,
        })
      : buildCoreShareDestinations({ appUrl, venueSlug }).find((entry) => entry.id === parsed.id) ?? null;

  if (!destination) {
    return null;
  }

  return {
    access,
    destination,
  };
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
