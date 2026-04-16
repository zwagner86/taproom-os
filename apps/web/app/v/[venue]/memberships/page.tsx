export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { Badge, Button, Card, Input, Label } from "@taproom/ui";

import { PublicFollowCard } from "@/components/public-follow-card";
import { formatCurrency } from "@/lib/utils";
import { startMembershipCheckoutAction } from "@/server/actions/memberships";
import { listPublicMembershipPlans } from "@/server/repositories/memberships";

export default async function PublicMembershipsPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ checkout?: string; error?: string; message?: string }>;
}) {
  const { venue } = await params;
  const { checkout, error, message } = await searchParams;
  const { plans, venue: venueRecord } = await listPublicMembershipPlans(venue);

  if (!venueRecord) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-12 lg:px-8">
      <section className="space-y-4">
        <Badge>{venueRecord.membership_label}</Badge>
        <h1 className="font-display text-5xl text-ink">{venueRecord.membership_label} at {venueRecord.name}</h1>
      </section>
      {checkout === "success" ? (
        <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">Checkout completed. Your membership will confirm shortly.</p>
      ) : null}
      {checkout === "cancel" ? (
        <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">Checkout was canceled before subscription creation.</p>
      ) : null}
      {message ? <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">{message}</p> : null}
      {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const action = startMembershipCheckoutAction.bind(null, venue, plan.id);

          return (
            <Card className="space-y-4" key={plan.id}>
              <div className="space-y-2">
                <h2 className="font-display text-2xl text-ink">{plan.name}</h2>
                <p className="text-sm text-ink/55">
                  {formatCurrency(plan.price_cents, plan.currency)} / {plan.billing_interval}
                </p>
                <p className="text-sm leading-6 text-ink/70">{plan.description ?? "Recurring membership"}</p>
              </div>

              <form action={action} className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`member-name-${plan.id}`}>Your name</Label>
                  <Input id={`member-name-${plan.id}`} name="member_name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`member-email-${plan.id}`}>Email</Label>
                  <Input id={`member-email-${plan.id}`} name="member_email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`member-phone-${plan.id}`}>Phone</Label>
                  <Input id={`member-phone-${plan.id}`} name="member_phone" />
                </div>
                <div>
                  <Button type="submit">Join {plan.name}</Button>
                </div>
              </form>
            </Card>
          );
        })}

        {plans.length === 0 ? (
          <Card>
            <p className="text-sm leading-6 text-ink/65">No public membership plans are active yet for this venue.</p>
          </Card>
        ) : null}
      </div>

      <PublicFollowCard returnPath={`/v/${venue}/memberships`} venueSlug={venue} />
    </main>
  );
}
