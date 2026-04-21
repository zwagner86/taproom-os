export const dynamic = "force-dynamic";

import { Button, Card, Input, Label, Select } from "@taproom/ui";

import { AccentPresetPicker } from "@/components/accent-preset-picker";
import { updateVenueSettingsAction } from "@/server/actions/venues";
import { requireVenueAccess } from "@/server/repositories/venues";

export default async function VenueSetupPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { venue } = await params;
  const [{ venue: venueRecord }, { error, message }] = await Promise.all([
    requireVenueAccess(venue),
    searchParams,
  ]);

  const action = updateVenueSettingsAction.bind(null, venue);

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Page header */}
      <div className="flex items-start justify-between mb-7 gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.5px] mb-1" style={{ color: "var(--c-text)" }}>
            Venue Setup
          </h1>
          <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
            Configure your venue identity and display labels.
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-5 rounded-[10px] border border-green-200 bg-green-50 px-4 py-3 text-[13px] text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {error}
        </div>
      )}

      <form action={action} className="flex flex-col gap-5">
        {/* Basic info */}
        <Card>
          <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>Basic Info</div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="name">Venue name</Label>
                <Input defaultValue={venueRecord.name} id="name" name="name" required />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="venue_type">Venue type</Label>
                <Select defaultValue={venueRecord.venue_type} id="venue_type" name="venue_type">
                  <option value="brewery">Brewery</option>
                  <option value="cidery">Cidery</option>
                  <option value="meadery">Meadery</option>
                  <option value="distillery">Distillery</option>
                  <option value="taproom">Taproom</option>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                defaultValue={venueRecord.tagline ?? ""}
                id="tagline"
                name="tagline"
                placeholder="Small batch. Big character."
              />
              <span className="text-xs" style={{ color: "var(--c-muted)" }}>
                Shown on your public menu and event pages.
              </span>
            </div>
          </div>
        </Card>

        {/* Display labels */}
        <Card>
          <div className="text-sm font-semibold mb-1" style={{ color: "var(--c-text)" }}>Display Labels</div>
          <p className="text-[12.5px] mb-4" style={{ color: "var(--c-muted)" }}>
            Customize how your menu and membership program are named throughout TaproomOS.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="menu_label">Menu label</Label>
              <Input defaultValue={venueRecord.menu_label} id="menu_label" name="menu_label" placeholder="Tap List" />
              <span className="text-xs" style={{ color: "var(--c-muted)" }}>e.g. Tap List, Pour List, Menu</span>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="membership_label">Membership label</Label>
              <Input
                defaultValue={venueRecord.membership_label}
                id="membership_label"
                name="membership_label"
                placeholder="Mug Club"
              />
              <span className="text-xs" style={{ color: "var(--c-muted)" }}>e.g. Mug Club, Beer Club</span>
            </div>
          </div>
        </Card>

        {/* Branding */}
        <Card>
          <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>Branding</div>
          <div className="flex flex-col gap-4">
            <AccentPresetPicker defaultValue={venueRecord.accent_color} />
            <div className="flex flex-col gap-1">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                defaultValue={venueRecord.logo_url ?? ""}
                id="logo_url"
                name="logo_url"
                placeholder="https://yourbrewery.com/logo.png"
                type="url"
              />
              <span className="text-xs" style={{ color: "var(--c-muted)" }}>Square format recommended.</span>
            </div>
          </div>
        </Card>

        <div className="flex gap-2">
          <Button size="lg" type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  );
}
