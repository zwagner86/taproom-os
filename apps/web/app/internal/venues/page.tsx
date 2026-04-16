export const dynamic = "force-dynamic";

import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button, Card, Input, Label, Select } from "@taproom/ui";

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
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-12 lg:px-8">
      <Card className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Internal tools</p>
          <h1 className="font-display text-4xl text-ink">Provision a venue</h1>
          <p className="max-w-3xl text-sm leading-6 text-ink/65">
            Operator-assisted is the MVP default. This screen creates the venue shell now and optionally attempts an
            owner invite if you provide an email.
          </p>
        </div>

        {message ? <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">{message}</p> : null}
        {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}

        <form action={createVenueAsPlatformAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="venue-name">Venue name</Label>
            <Input id="venue-name" name="name" placeholder="Driftline Cider House" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue-slug">Slug</Label>
            <Input id="venue-slug" name="slug" placeholder="driftline-cider-house" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue-type">Venue type</Label>
            <Select defaultValue="brewery" id="venue-type" name="venue_type">
              <option value="brewery">Brewery</option>
              <option value="cidery">Cidery</option>
              <option value="meadery">Meadery</option>
              <option value="distillery">Distillery</option>
              <option value="taproom">Taproom</option>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="owner-email">Owner email</Label>
            <Input id="owner-email" name="owner_email" placeholder="owner@venue.com" type="email" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Create internal venue shell</Button>
          </div>
        </form>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {venues.map((venue) => (
          <Card className="space-y-4" key={venue.id}>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{venue.venue_type}</p>
              <h2 className="font-display text-2xl text-ink">{venue.name}</h2>
              <p className="text-sm text-ink/55">/{venue.slug}</p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/10 bg-white px-5 text-sm font-semibold text-ink transition hover:border-ink/20"
              href={`/internal/venues/${venue.slug}/impersonate` as Route}
            >
              Open venue shell
            </Link>
          </Card>
        ))}
      </section>
    </main>
  );
}
