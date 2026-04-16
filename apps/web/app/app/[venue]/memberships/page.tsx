export const dynamic = "force-dynamic";

import { canResumeMembership } from "@taproom/domain";
import { Button, Card, Input, Label, Select, Textarea } from "@taproom/ui";

import {
  cancelMembershipAction,
  createMembershipPlanAction,
  resumeMembershipAction,
  updateMembershipPlanAction,
} from "@/server/actions/memberships";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listVenueMembershipPlans, listVenueMemberships } from "@/server/repositories/memberships";
import { requireVenueAccess } from "@/server/repositories/venues";

export default async function VenueMembershipsPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { venue } = await params;
  const [{ venue: venueRecord }, { error, message }] = await Promise.all([
    requireVenueAccess(venue),
    searchParams,
  ]);
  const [plans, memberships] = await Promise.all([
    listVenueMembershipPlans(venueRecord.id),
    listVenueMemberships(venueRecord.id),
  ]);
  const createAction = createMembershipPlanAction.bind(null, venue);
  const updateAction = updateMembershipPlanAction.bind(null, venue);

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{venueRecord.membership_label}</p>
          <h1 className="font-display text-4xl text-ink">Membership operations</h1>
          <p className="max-w-3xl text-sm leading-6 text-ink/65">
            Keep recurring plans simple: create a few options, let fans join with Stripe Checkout, and manage cancel or
            resume from the same admin surface.
          </p>
        </div>
        {message ? <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">{message}</p> : null}
        {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
      </Card>

      <Card>
        <form action={createAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="create-plan-name">Plan name</Label>
            <Input id="create-plan-name" name="name" placeholder="Barrel Club" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-plan-slug">Slug</Label>
            <Input id="create-plan-slug" name="slug" placeholder="barrel-club" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-plan-interval">Billing interval</Label>
            <Select defaultValue="month" id="create-plan-interval" name="billing_interval">
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
              <option value="year">Yearly</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-plan-price">Price cents</Label>
            <Input id="create-plan-price" name="price_cents" placeholder="2500" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-plan-currency">Currency</Label>
            <Input defaultValue="USD" id="create-plan-currency" name="currency" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="create-plan-description">Description</Label>
            <Textarea id="create-plan-description" name="description" placeholder="What members get each cycle" />
          </div>
          <label className="inline-flex items-center gap-3 text-sm font-semibold text-ink/70 md:col-span-2">
            <input defaultChecked name="active" type="checkbox" />
            Show this plan publicly
          </label>
          <div className="md:col-span-2">
            <Button type="submit">Create membership plan</Button>
          </div>
        </form>
      </Card>

      <section className="grid gap-4">
        {plans.map((plan) => (
          <Card className="space-y-4" key={plan.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{plan.billing_interval}</p>
                <h2 className="font-display text-2xl text-ink">{plan.name}</h2>
                <p className="text-sm text-ink/55">{formatCurrency(plan.price_cents, plan.currency)}</p>
              </div>
            </div>

            <form action={updateAction} className="grid gap-4 md:grid-cols-2">
              <input name="plan_id" type="hidden" value={plan.id} />
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`plan-name-${plan.id}`}>Plan name</Label>
                <Input defaultValue={plan.name} id={`plan-name-${plan.id}`} name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`plan-slug-${plan.id}`}>Slug</Label>
                <Input defaultValue={plan.slug} id={`plan-slug-${plan.id}`} name="slug" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`plan-interval-${plan.id}`}>Billing interval</Label>
                <Select defaultValue={plan.billing_interval} id={`plan-interval-${plan.id}`} name="billing_interval">
                  <option value="month">Monthly</option>
                  <option value="quarter">Quarterly</option>
                  <option value="year">Yearly</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`plan-price-${plan.id}`}>Price cents</Label>
                <Input defaultValue={plan.price_cents} id={`plan-price-${plan.id}`} name="price_cents" type="number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`plan-currency-${plan.id}`}>Currency</Label>
                <Input defaultValue={plan.currency} id={`plan-currency-${plan.id}`} name="currency" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`plan-description-${plan.id}`}>Description</Label>
                <Textarea defaultValue={plan.description ?? ""} id={`plan-description-${plan.id}`} name="description" />
              </div>
              <label className="inline-flex items-center gap-3 text-sm font-semibold text-ink/70 md:col-span-2">
                <input defaultChecked={plan.active} name="active" type="checkbox" />
                Show this plan publicly
              </label>
              <div className="md:col-span-2">
                <Button type="submit">Save plan</Button>
              </div>
            </form>
          </Card>
        ))}

        {plans.length === 0 ? (
          <Card>
            <p className="text-sm leading-6 text-ink/65">No membership plans yet. Add one above to start recurring signups.</p>
          </Card>
        ) : null}
      </section>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-ink">Members</h2>
          <p className="text-sm text-ink/55">{memberships.length} total</p>
        </div>
        {memberships.length === 0 ? (
          <p className="text-sm leading-6 text-ink/65">No memberships yet. Public signup will create records here.</p>
        ) : (
          <div className="grid gap-3">
            {memberships.map((membership) => {
              const cancelAction = cancelMembershipAction.bind(null, venue, membership.id);
              const resumeAction = resumeMembershipAction.bind(null, venue, membership.id);
              const resumable = canResumeMembership({
                cancelAtPeriodEnd: membership.cancel_at_period_end,
                endedAt: membership.ended_at,
                status: membership.status as "active" | "pending" | "past_due" | "cancelled",
              });

              return (
                <div className="rounded-3xl border border-ink/10 bg-mist/35 p-4" key={membership.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{membership.member_name}</p>
                      <p className="text-sm text-ink/60">
                        {membership.plan_name_snapshot ?? membership.membership_plans?.name ?? "Membership"} · {membership.status}
                      </p>
                      <p className="text-sm text-ink/55">
                        Period ends {membership.current_period_end ? formatDate(membership.current_period_end) : "TBD"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!membership.cancel_at_period_end && membership.status === "active" ? (
                        <form action={cancelAction}>
                          <Button type="submit" variant="ghost">
                            Cancel at period end
                          </Button>
                        </form>
                      ) : null}
                      {resumable ? (
                        <form action={resumeAction}>
                          <Button type="submit">Resume</Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
