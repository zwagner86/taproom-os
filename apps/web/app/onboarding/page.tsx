export const dynamic = "force-dynamic";

import { Button, Card, Input, Label, Select } from "@taproom/ui";

import { createVenueForCurrentUserAction } from "@/server/actions/venues";
import { requireUser } from "@/server/auth";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <Card className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Venue onboarding</p>
          <h1 className="font-display text-4xl text-ink">Create your first venue</h1>
          <p className="max-w-2xl text-sm leading-6 text-ink/65">
            This is the light self-serve path. You become the venue owner immediately, then finish branding and menu
            setup inside the admin shell.
          </p>
        </div>

        {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}

        <form action={createVenueForCurrentUserAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Venue name</Label>
            <Input id="name" name="name" placeholder="Northline Brewery" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" placeholder="northline-brewery" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue_type">Venue type</Label>
            <Select defaultValue="brewery" id="venue_type" name="venue_type">
              <option value="brewery">Brewery</option>
              <option value="cidery">Cidery</option>
              <option value="meadery">Meadery</option>
              <option value="distillery">Distillery</option>
              <option value="taproom">Taproom</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Create venue and continue</Button>
          </div>
        </form>
      </Card>
    </main>
  );
}

