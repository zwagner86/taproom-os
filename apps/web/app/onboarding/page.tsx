export const dynamic = "force-dynamic";

import { Button, Input, Label, Select } from "@taproom/ui";

import { AuthLayout } from "@/components/auth-layout";
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
    <AuthLayout subtitle="Tell us about your taproom. You can change this anytime." title="Create your venue">
      {error && (
        <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {error}
        </div>
      )}

      <form action={createVenueForCurrentUserAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="name">Venue name <span style={{ color: "var(--accent)" }}>*</span></Label>
          <Input id="name" name="name" placeholder="Ironwood Brewing Co." required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="slug">Venue slug <span style={{ color: "var(--accent)" }}>*</span></Label>
          <Input id="slug" name="slug" placeholder="ironwood-brewing" />
          <span className="text-xs" style={{ color: "var(--c-muted)" }}>
            Lowercase letters, numbers, and hyphens only.
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="venue_type">Venue type <span style={{ color: "var(--accent)" }}>*</span></Label>
          <Select defaultValue="brewery" id="venue_type" name="venue_type">
            <option value="brewery">Brewery</option>
            <option value="cidery">Cidery</option>
            <option value="meadery">Meadery</option>
            <option value="distillery">Distillery</option>
            <option value="taproom">Taproom</option>
          </Select>
        </div>
        <Button className="w-full" size="lg" type="submit">
          Create venue →
        </Button>
      </form>
    </AuthLayout>
  );
}
