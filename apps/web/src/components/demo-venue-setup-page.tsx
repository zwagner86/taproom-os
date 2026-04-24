"use client";

import { useMemo, useState } from "react";

import { DemoMutationAlert } from "@/components/demo-mutation-alert";
import { AccentPresetPicker } from "@/components/accent-preset-picker";
import { useDemoVenue } from "@/components/demo-venue-provider";
import { Alert, Button, Card, FieldHint, FieldLabel, Input, PageHeader, Select } from "@/components/ui";
import type { VenueRow } from "@/server/repositories/venues";

export function DemoVenueSetupPage({
  initialError,
  initialVenue,
}: {
  initialError?: string;
  initialVenue: VenueRow;
}) {
  const { saveVenueSettings, state } = useDemoVenue();
  const venue = state.venue ?? initialVenue;
  const [result, setResult] = useState<ReturnType<typeof saveVenueSettings> | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const formKey = useMemo(
    () => [
      venue.accent_color,
      venue.display_theme,
      venue.logo_url ?? "",
      venue.secondary_accent_color,
      venue.name,
      venue.tagline ?? "",
      venue.venue_type,
      venue.updated_at,
    ].join("|"),
    [venue],
  );

  const action = async (formData: FormData) => {
    try {
      setError(null);
      setResult(saveVenueSettings(formData));
    } catch (nextError) {
      setResult(null);
      setError(nextError instanceof Error ? nextError.message : "Unable to update venue settings.");
    }
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <PageHeader subtitle="Configure your venue identity and branding." title="Venue Setup" />

      <div className="mb-5 space-y-4">
        <DemoMutationAlert onDismiss={() => setResult(null)} result={result} />
        {error && (
          <Alert onDismiss={() => setError(null)} variant="error">
            {error}
          </Alert>
        )}
      </div>

      <form action={action} className="flex flex-col gap-5" key={formKey}>
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
          <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>Branding</div>
          <div className="flex flex-col gap-4">
            <AccentPresetPicker
              defaultSecondaryValue={venue.secondary_accent_color}
              defaultTheme={venue.display_theme}
              defaultValue={venue.accent_color}
              logoUrl={venue.logo_url}
            />
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
    </div>
  );
}
