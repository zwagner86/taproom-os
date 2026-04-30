import type { Database } from "../../../../supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export type CoreShareDestinationId = "events" | "follow" | "memberships" | "menu";
export type ShareDestinationKind = CoreShareDestinationId | "event";
export type PrintLayout = "letter" | "half-letter" | "photo-4x6";

export type ShareDestination = {
  description: string;
  fileName: string;
  id: string;
  kind: ShareDestinationKind;
  label: string;
  path: string;
  printKey: string;
  subtitle: string;
  url: string;
};

export const CORE_SHARE_DESTINATIONS: Array<{
  description: string;
  id: CoreShareDestinationId;
  label: string;
  pathSegment: string;
  subtitle: string;
}> = [
  {
    description: "Point guests to your live public menu.",
    id: "menu",
    label: "Menu",
    pathSegment: "menu",
    subtitle: "Full menu page",
  },
  {
    description: "Share your upcoming public event list.",
    id: "events",
    label: "Events",
    pathSegment: "events",
    subtitle: "Event calendar",
  },
  {
    description: "Send guests to public membership signup.",
    id: "memberships",
    label: "Memberships",
    pathSegment: "memberships",
    subtitle: "Membership signup",
  },
  {
    description: "Collect email and SMS update opt-ins.",
    id: "follow",
    label: "Follow / updates",
    pathSegment: "follow",
    subtitle: "Follower signup",
  },
];

export function buildAbsoluteShareUrl(appUrl: string, path: string) {
  return `${appUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export function buildCorePublicPath(venueSlug: string, id: CoreShareDestinationId) {
  const destination = CORE_SHARE_DESTINATIONS.find((entry) => entry.id === id);

  if (!destination) {
    throw new Error(`Unknown share destination: ${id}`);
  }

  return `/v/${venueSlug}/${destination.pathSegment}`;
}

export function buildEventPublicPath(venueSlug: string, eventId: string) {
  return `/v/${venueSlug}/events/${eventId}`;
}

export function buildCoreShareDestinations(input: {
  appUrl: string;
  venueSlug: string;
}) {
  return CORE_SHARE_DESTINATIONS.map((destination) => {
    const path = buildCorePublicPath(input.venueSlug, destination.id);

    return {
      description: destination.description,
      fileName: buildShareFileName(input.venueSlug, destination.id),
      id: destination.id,
      kind: destination.id,
      label: destination.label,
      path,
      printKey: destination.id,
      subtitle: destination.subtitle,
      url: buildAbsoluteShareUrl(input.appUrl, path),
    } satisfies ShareDestination;
  });
}

export function buildEventShareDestination(input: {
  appUrl: string;
  event: Pick<EventRow, "id" | "starts_at" | "title">;
  venueSlug: string;
}) {
  const path = buildEventPublicPath(input.venueSlug, input.event.id);

  return {
    description: "Share this event's permanent public page.",
    fileName: buildShareFileName(input.venueSlug, `event-${input.event.id}`),
    id: `event-${input.event.id}`,
    kind: "event",
    label: input.event.title,
    path,
    printKey: `event-${input.event.id}`,
    subtitle: "Individual event",
    url: buildAbsoluteShareUrl(input.appUrl, path),
  } satisfies ShareDestination;
}

export function parsePrintDestinationKey(destination: string) {
  if (isCoreShareDestination(destination)) {
    return { id: destination, kind: destination } as const;
  }

  if (destination.startsWith("event-")) {
    const eventId = destination.slice("event-".length);

    if (eventId.length > 0) {
      return { eventId, kind: "event" } as const;
    }
  }

  return null;
}

export function resolvePrintLayout(value: string | string[] | undefined): PrintLayout {
  const layout = Array.isArray(value) ? value[0] : value;

  if (layout === "half-letter" || layout === "photo-4x6") {
    return layout;
  }

  return "letter";
}

function isCoreShareDestination(value: string): value is CoreShareDestinationId {
  return CORE_SHARE_DESTINATIONS.some((entry) => entry.id === value);
}

function buildShareFileName(venueSlug: string, destination: string) {
  return `${venueSlug}-${destination}-qr`;
}
