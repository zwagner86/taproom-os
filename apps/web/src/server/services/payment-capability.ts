import { resolveVenuePaymentCapability, type StripeConnection, type VenuePaymentCapability } from "@taproom/domain";

import { getStripeConnectionForVenue } from "@/server/repositories/providers";

function mapStripeConnection(connection: Awaited<ReturnType<typeof getStripeConnectionForVenue>>): StripeConnection | null {
  if (!connection) {
    return null;
  }

  return {
    chargesEnabled: connection.charges_enabled,
    detailsSubmitted: connection.details_submitted,
    id: connection.id,
    lastError: connection.last_error,
    lastSyncedAt: connection.last_synced_at,
    status: connection.status,
    stripeAccountId: connection.stripe_account_id,
    venueId: connection.venue_id,
  };
}

export async function getVenuePaymentCapability(venueId: string): Promise<VenuePaymentCapability> {
  const connection = await getStripeConnectionForVenue(venueId);
  return resolveVenuePaymentCapability(mapStripeConnection(connection));
}
