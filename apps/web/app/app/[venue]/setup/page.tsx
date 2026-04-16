export const dynamic = "force-dynamic";

import { Button, Card, Input, Label } from "@taproom/ui";

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
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Venue setup</p>
          <h1 className="font-display text-4xl text-ink">{venueRecord.name}</h1>
          <p className="max-w-2xl text-sm leading-6 text-ink/65">
            Configure terminology, branding, and the public voice that powers menu, embed, and TV outputs.
          </p>
        </div>
        {message ? <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">{message}</p> : null}
        {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
      </Card>

      <Card>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Venue name</Label>
            <Input defaultValue={venueRecord.name} id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu_label">Menu label</Label>
            <Input defaultValue={venueRecord.menu_label} id="menu_label" name="menu_label" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="membership_label">Membership label</Label>
            <Input defaultValue={venueRecord.membership_label} id="membership_label" name="membership_label" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accent_color">Accent color</Label>
            <Input defaultValue={venueRecord.accent_color} id="accent_color" name="accent_color" pattern="^#([0-9a-fA-F]{6})$" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input defaultValue={venueRecord.logo_url ?? ""} id="logo_url" name="logo_url" type="url" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input defaultValue={venueRecord.tagline ?? ""} id="tagline" name="tagline" />
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button type="submit">Save venue settings</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

