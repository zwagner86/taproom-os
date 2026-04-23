"use client";

import { useActionState } from "react";

import { Alert, Button, Card, FieldHint, FieldLabel, Input, Select } from "@/components/ui";

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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="name" required>Venue name</FieldLabel>
              <Input aria-describedby="venue-name-hint" defaultValue={venue.name} id="name" name="name" required />
              <FieldHint id="venue-name-hint">
                This is the primary venue name shown throughout the admin and on public-facing pages.
              </FieldHint>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel
                htmlFor="venue_type"
                info="Venue type helps TaproomOS describe the business consistently in setup flows and labels, but it does not change your billing or permissions."
              >
                Venue type
              </FieldLabel>
              <Select aria-describedby="venue-type-hint" defaultValue={venue.venue_type} id="venue_type" name="venue_type">
                <option value="brewery">Brewery</option>
                <option value="cidery">Cidery</option>
                <option value="meadery">Meadery</option>
                <option value="distillery">Distillery</option>
                <option value="taproom">Taproom</option>
              </Select>
              <FieldHint id="venue-type-hint">
                Choose the closest fit for how your venue should be described across TaproomOS.
              </FieldHint>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="tagline">Tagline</FieldLabel>
            <Input
              aria-describedby="tagline-hint"
              defaultValue={venue.tagline ?? ""}
              id="tagline"
              name="tagline"
              placeholder="Small batch. Big character."
            />
            <FieldHint id="tagline-hint">
              Shown on your public menu and event pages.
            </FieldHint>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold mb-1" style={{ color: "var(--c-text)" }}>Display Labels</div>
        <p className="text-[12.5px] mb-4" style={{ color: "var(--c-muted)" }}>
          Customize how your menu and membership program are named throughout TaproomOS.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <FieldLabel
              htmlFor="menu_label"
              info="This label is reused anywhere your main list of pours, food, or merch is referenced. Use the language your staff and guests already know."
            >
              Menu label
            </FieldLabel>
            <Input aria-describedby="menu-label-hint" defaultValue={venue.menu_label} id="menu_label" name="menu_label" placeholder="Tap List" />
            <FieldHint id="menu-label-hint">Use a label like Tap List, Pour List, or Menu.</FieldHint>
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel
              htmlFor="membership_label"
              info="This label appears on membership admin screens and public membership signup pages."
            >
              Membership label
            </FieldLabel>
            <Input
              aria-describedby="membership-label-hint"
              defaultValue={venue.membership_label}
              id="membership_label"
              name="membership_label"
              placeholder="Mug Club"
            />
            <FieldHint id="membership-label-hint">Use a label like Mug Club, Beer Club, or Bottle Society.</FieldHint>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>Branding</div>
        <div className="flex flex-col gap-4">
          <AccentPresetPicker defaultValue={venue.accent_color} />
          <div className="flex flex-col gap-1">
            <FieldLabel
              htmlFor="logo_url"
              info="The logo is used when a surface supports venue branding. If you leave this blank, TaproomOS will fall back to text-only branding."
            >
              Logo URL
            </FieldLabel>
            <Input
              aria-describedby="logo-url-hint"
              defaultValue={venue.logo_url ?? ""}
              id="logo_url"
              name="logo_url"
              placeholder="https://yourbrewery.com/logo.png"
              type="url"
            />
            <FieldHint id="logo-url-hint">Square or near-square images work best for badges, cards, and display headers.</FieldHint>
          </div>
        </div>
      </Card>

      <div className="flex gap-2">
        <Button size="lg" type="submit">Save changes</Button>
      </div>
    </form>
  );
}
