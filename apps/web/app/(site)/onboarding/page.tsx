export const dynamic = "force-dynamic";

import { Button, FieldHint, FieldLabel, Input, Select } from "@taproom/ui";

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
          <FieldLabel htmlFor="name" required>Venue name</FieldLabel>
          <Input aria-describedby="onboarding-name-hint" id="name" name="name" placeholder="Ironwood Brewing Co." required />
          <FieldHint id="onboarding-name-hint">
            This is the public-facing venue name guests and staff will see throughout TaproomOS.
          </FieldHint>
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel
            htmlFor="slug"
            info="The slug becomes part of your venue URLs. Keep it short and stable, because changing it later can break bookmarked public links."
            required
          >
            Venue slug
          </FieldLabel>
          <Input aria-describedby="onboarding-slug-hint" id="slug" name="slug" placeholder="ironwood-brewing" />
          <FieldHint id="onboarding-slug-hint">
            Lowercase letters, numbers, and hyphens only.
          </FieldHint>
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel
            htmlFor="venue_type"
            info="Venue type helps TaproomOS describe your business consistently in setup copy and labels."
            required
          >
            Venue type
          </FieldLabel>
          <Select aria-describedby="onboarding-venue-type-hint" defaultValue="brewery" id="venue_type" name="venue_type">
            <option value="brewery">Brewery</option>
            <option value="cidery">Cidery</option>
            <option value="meadery">Meadery</option>
            <option value="distillery">Distillery</option>
            <option value="taproom">Taproom</option>
          </Select>
          <FieldHint id="onboarding-venue-type-hint">
            Choose the closest fit for how you want the venue categorized inside TaproomOS.
          </FieldHint>
        </div>
        <Button className="w-full" size="lg" type="submit">
          Create venue →
        </Button>
      </form>
    </AuthLayout>
  );
}
