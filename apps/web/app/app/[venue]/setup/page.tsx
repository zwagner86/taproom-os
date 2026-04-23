export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/ui";

import { VenueSettingsForm } from "@/components/venue-settings-form";
import { updateVenueSettingsAction } from "@/server/actions/venues";
import { requireVenueAccess } from "@/server/repositories/venues";

export default async function VenueSetupPage({
  params,
}: {
  params: Promise<{ venue: string }>;
}) {
  const { venue } = await params;
  const { venue: venueRecord } = await requireVenueAccess(venue);
  const action = updateVenueSettingsAction.bind(null, venue);

  return (
    <div style={{ maxWidth: 680 }}>
      <PageHeader title="Venue Setup" subtitle="Configure your venue identity and display labels." />
      <VenueSettingsForm action={action} venue={venueRecord} />
    </div>
  );
}
