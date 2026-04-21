export const dynamic = "force-dynamic";

import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge, Button, Card, FieldHint, FieldLabel, Input, Select } from "@taproom/ui";

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
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-7">
        <div
          className="text-[11px] font-bold uppercase tracking-[0.8px] mb-1"
          style={{ color: "var(--accent)" }}
        >
          Internal tools
        </div>
        <h1 className="text-[28px] font-black tracking-[-0.5px] mb-1" style={{ color: "var(--c-text)" }}>
          Venue provisioning
        </h1>
        <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
          Create venue shells and optionally invite owners.
        </p>
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

      <div className="grid grid-cols-[1fr_1.5fr] gap-6 items-start">
        <Card>
          <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>New venue shell</div>
          <form action={createVenueAsPlatformAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="venue-name" required>Venue name</FieldLabel>
              <Input aria-describedby="internal-venue-name-hint" id="venue-name" name="name" placeholder="Driftline Cider House" required />
              <FieldHint id="internal-venue-name-hint">
                Create the shell with the same venue name the operator expects to use publicly.
              </FieldHint>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel
                htmlFor="venue-slug"
                info="If left blank, the slug will be generated from the venue name. Slugs are used in admin and public URLs."
              >
                Slug
              </FieldLabel>
              <Input aria-describedby="internal-venue-slug-hint" id="venue-slug" name="slug" placeholder="driftline-cider-house" />
              <FieldHint id="internal-venue-slug-hint">
                Lowercase letters, numbers, and hyphens only.
              </FieldHint>
            </div>
            <div className="flex flex-col gap-1">
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
            <div className="flex flex-col gap-1">
              <FieldLabel
                htmlFor="owner-email"
                info="If provided, TaproomOS will try to invite this person and attach them as the venue owner. Leave blank to keep ownership with the current platform admin for now."
              >
                Owner email
              </FieldLabel>
              <Input aria-describedby="internal-owner-email-hint" id="owner-email" name="owner_email" placeholder="owner@venue.com" type="email" />
              <FieldHint id="internal-owner-email-hint">
                Use the future venue owner’s email if you want them invited during provisioning.
              </FieldHint>
            </div>
            <Button type="submit">Create venue shell</Button>
          </form>
        </Card>

        <div>
          <div
            className="text-[13px] font-bold uppercase tracking-[0.8px] mb-3"
            style={{ color: "var(--c-muted)" }}
          >
            All venues · {venues.length}
          </div>
          {venues.length === 0 ? (
            <Card>
              <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>No venues provisioned yet.</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {venues.map((venue) => (
                <Card key={venue.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <div className="font-semibold text-[14px]" style={{ color: "var(--c-text)" }}>{venue.name}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: "var(--c-muted)" }}>
                      /{venue.slug} · <Badge variant="info" style={{ fontSize: 11 }}>{venue.venue_type}</Badge>
                    </div>
                  </div>
                  <Link
                    className="inline-flex items-center rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition"
                    href={`/internal/venues/${venue.slug}/impersonate` as Route}
                    style={{ borderColor: "var(--c-border)", color: "var(--c-text)" }}
                  >
                    Open →
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
