export const dynamic = "force-dynamic";

import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Alert, Badge, Button, Card, EmptyState, FieldHint, FieldLabel, Input, PageHeader, Select } from "@/components/ui";
import { createVenueAsPlatformAction } from "@/server/actions/venues";
import { isPlatformAdmin, requireUser } from "@/server/auth";
import { listVenuesForUser } from "@/server/repositories/venues";

export default async function InternalVenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const user = await requireUser();
  const admin = await isPlatformAdmin();

  if (!admin) {
    redirect("/");
  }

  const [venues, { error, message }] = await Promise.all([listVenuesForUser(user), searchParams]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <PageHeader
        subtitle="Create venue shells and optionally invite owners."
        title="Venue provisioning"
      />

      <div className="mt-6 space-y-4">
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="error">{error}</Alert>}
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1fr_1.45fr]">
        <Card className="border-border/80 bg-white/88 shadow-[0_18px_48px_rgba(80,54,31,0.08)]">
          <div className="mb-4 text-lg font-semibold text-foreground">New venue shell</div>
          <form action={createVenueAsPlatformAction} className="space-y-4">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="venue-name" required>
                Venue name
              </FieldLabel>
              <Input
                aria-describedby="internal-venue-name-hint"
                id="venue-name"
                name="name"
                placeholder="Driftline Cider House"
                required
              />
              <FieldHint id="internal-venue-name-hint">
                Create the shell with the same venue name the operator expects to use publicly.
              </FieldHint>
            </div>

            <div className="space-y-1.5">
              <FieldLabel
                htmlFor="venue-slug"
                info="If left blank, the slug will be generated from the venue name. Slugs are used in admin and public URLs."
              >
                Slug
              </FieldLabel>
              <Input
                aria-describedby="internal-venue-slug-hint"
                id="venue-slug"
                name="slug"
                placeholder="driftline-cider-house"
              />
              <FieldHint id="internal-venue-slug-hint">Lowercase letters, numbers, and hyphens only.</FieldHint>
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="venue-type">Venue type</FieldLabel>
              <Select aria-describedby="internal-venue-type-hint" defaultValue="brewery" id="venue-type" name="venue_type">
                <option value="brewery">Brewery</option>
                <option value="cidery">Cidery</option>
                <option value="meadery">Meadery</option>
                <option value="distillery">Distillery</option>
                <option value="taproom">Taproom</option>
              </Select>
              <FieldHint id="internal-venue-type-hint">
                Choose the closest venue category for terminology and internal description purposes.
              </FieldHint>
            </div>

            <div className="space-y-1.5">
              <FieldLabel
                htmlFor="owner-email"
                info="If provided, TaproomOS will try to invite this person and attach them as the venue owner. Leave blank to keep ownership with the current platform admin for now."
              >
                Owner email
              </FieldLabel>
              <Input
                aria-describedby="internal-owner-email-hint"
                id="owner-email"
                name="owner_email"
                placeholder="owner@venue.com"
                type="email"
              />
              <FieldHint id="internal-owner-email-hint">
                Use the future venue owner’s email if you want them invited during provisioning.
              </FieldHint>
            </div>

            <Button type="submit">Create venue shell</Button>
          </form>
        </Card>

        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            All venues · {venues.length}
          </div>
          {venues.length === 0 ? (
            <EmptyState title="No venues provisioned yet" />
          ) : (
            venues.map((venue) => (
              <Card
                className="border-border/80 bg-white/88 shadow-[0_14px_40px_rgba(80,54,31,0.06)]"
                key={venue.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}
              >
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">{venue.name}</div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>/{venue.slug}</span>
                    <Badge variant="info">{venue.venue_type}</Badge>
                  </div>
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/internal/venues/${venue.slug}/impersonate` as Route}>Open</Link>
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
