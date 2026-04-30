export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/ui";

import { DemoVenueSetupPage } from "@/components/demo-venue-setup-page";
import { VenueSettingsForm } from "@/components/venue-settings-form";
import { updateVenueSettingsAction } from "@/server/actions/venues";
import { requireVenueAccess } from "@/server/repositories/venues";

export default async function VenueSetupPage({
  params,
}: {
  params: Promise<{ venue: string }>;
}) {
  const { venue } = await params;
  const access = await requireVenueAccess(venue);
  const { venue: venueRecord } = access;
  const action = updateVenueSettingsAction.bind(null, venue);

  if (access.isDemoVenue) {
    return <DemoVenueSetupPage initialVenue={venueRecord} />;
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <PageHeader title="Venue Setup" subtitle="Configure your venue identity and branding." />
      <VenueSettingsForm action={action} demoMode={false} venue={venueRecord} />
    </div>
  );
}
