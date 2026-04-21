"use client";

import { useActionState } from "react";

import { Alert, Button, Card, Input, Label, Select } from "@taproom/ui";

import { AccentPresetPicker } from "@/components/accent-preset-picker";
import type { VenueSettingsState } from "@/server/actions/venues";
import type { VenueRow } from "@/server/repositories/venues";

export function VenueSettingsForm({
  venue,
  action,
}: {
  venue: VenueRow;
  action: (prevState: VenueSettingsState, formData: FormData) => Promise<VenueSettingsState>;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.message && <Alert variant="success">{state.message}</Alert>}
      {state?.error && <Alert variant="error">{state.error}</Alert>}

      <Card>
        <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>Basic Info</div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="name">Venue name</Label>
              <Input defaultValue={venue.name} id="name" name="name" required />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="venue_type">Venue type</Label>
              <Select defaultValue={venue.venue_type} id="venue_type" name="venue_type">
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
              defaultValue={venue.tagline ?? ""}
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

      <Card>
        <div className="text-sm font-semibold mb-1" style={{ color: "var(--c-text)" }}>Display Labels</div>
        <p className="text-[12.5px] mb-4" style={{ color: "var(--c-muted)" }}>
          Customize how your menu and membership program are named throughout TaproomOS.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="menu_label">Menu label</Label>
            <Input defaultValue={venue.menu_label} id="menu_label" name="menu_label" placeholder="Tap List" />
            <span className="text-xs" style={{ color: "var(--c-muted)" }}>e.g. Tap List, Pour List, Menu</span>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="membership_label">Membership label</Label>
            <Input
              defaultValue={venue.membership_label}
              id="membership_label"
              name="membership_label"
              placeholder="Mug Club"
            />
            <span className="text-xs" style={{ color: "var(--c-muted)" }}>e.g. Mug Club, Beer Club</span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>Branding</div>
        <div className="flex flex-col gap-4">
          <AccentPresetPicker defaultValue={venue.accent_color} />
          <div className="flex flex-col gap-1">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              defaultValue={venue.logo_url ?? ""}
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
  );
}
