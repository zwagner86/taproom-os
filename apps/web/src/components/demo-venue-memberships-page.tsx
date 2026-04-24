"use client";

import { canResumeMembership } from "@taproom/domain";
import { useEffect, useMemo, useState } from "react";

import type { Route } from "next";
import Link from "next/link";

import { Tag } from "lucide-react";

import { DemoMutationAlert } from "@/components/demo-mutation-alert";
import { useDemoVenue } from "@/components/demo-venue-provider";
import { Alert, Badge, Button, Card, DataTable, EmptyState, FieldHint, FieldLabel, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { getMembershipGateCopy } from "@/lib/venue-payment-capability";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DemoMembershipPlanRecord, DemoMembershipRecord } from "@/lib/demo-venue-state";
import type { VenueRow } from "@/server/repositories/venues";
import type { VenuePaymentCapability } from "@taproom/domain";

export function DemoVenueMembershipsPage({
  capability,
  initialError,
  initialMemberships,
  initialPlans,
  initialVenue,
  venueSlug,
}: {
  capability: VenuePaymentCapability;
  initialError?: string;
  initialMemberships: DemoMembershipRecord[];
  initialPlans: DemoMembershipPlanRecord[];
  initialVenue: VenueRow;
  venueSlug: string;
}) {
  const {
    createMembershipPlan,
    dispatchSeedMemberships,
    state,
    updateMembershipPlan,
    updateMembershipStatus,
  } = useDemoVenue();
  const venue = state.venue ?? initialVenue;
  const plans = state.memberships.plans ?? initialPlans;
  const memberships = state.memberships.memberships ?? initialMemberships;
  const activePlans = useMemo(() => plans.filter((plan) => plan.active).length, [plans]);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [result, setResult] = useState<ReturnType<typeof createMembershipPlan> | null>(null);

  useEffect(() => {
    dispatchSeedMemberships(initialPlans, initialMemberships);
  }, [dispatchSeedMemberships, initialMemberships, initialPlans]);

  return (
    <div>
      <PageHeader
        subtitle={`${venue.membership_label} · ${activePlans} active plans · ${memberships.length} members`}
        title="Memberships"
      />

      {!capability.canSellMemberships && (
        <Alert variant="warning" className="mb-5">
          <strong>Stripe not connected.</strong> Memberships require payment setup.{" "}
          <Link className="font-semibold underline" href={`/app/${venueSlug}/billing` as Route}>
            Set up billing →
          </Link>
        </Alert>
      )}

      <div className="mb-5 space-y-4">
        <DemoMutationAlert onDismiss={() => setResult(null)} result={result} />
        {error && (
          <Alert onDismiss={() => setError(null)} variant="error">
            {error}
          </Alert>
        )}
      </div>

      <div className="mb-6">
        <div
          className="text-[13px] font-bold uppercase tracking-[0.8px] mb-3"
          style={{ color: "var(--c-muted)" }}
        >
          Plans
        </div>
        {plans.length === 0 ? (
          <EmptyState icon={<Tag className="w-9 h-9 text-muted" />} title="No plans yet" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <div className="flex justify-between items-start mb-2.5">
                  <div className="font-bold text-[15px]" style={{ color: "var(--c-text)" }}>
                    {plan.name}
                  </div>
                  <Badge variant={plan.active ? "success" : "default"}>
                    {plan.active ? "Active" : "Hidden"}
                  </Badge>
                </div>
                {plan.description && (
                  <div className="text-[13px] leading-relaxed mb-3.5" style={{ color: "var(--c-muted)" }}>
                    {plan.description}
                  </div>
                )}
                <div className="flex items-baseline gap-1 mb-3.5">
                  <span className="text-[24px] font-black" style={{ color: "var(--c-text)" }}>
                    {formatCurrency(plan.price_cents, plan.currency)}
                  </span>
                  <span className="text-[13px]" style={{ color: "var(--c-muted)" }}>
                    / {plan.billing_interval}
                  </span>
                </div>
                <details>
                  <summary className="cursor-pointer">
                    <Button size="sm" type="button" variant="secondary">Edit</Button>
                  </summary>
                  <form
                    action={async (formData) => {
                      try {
                        setError(null);
                        setResult(updateMembershipPlan(formData, capability));
                      } catch (nextError) {
                        setResult(null);
                        setError(nextError instanceof Error ? nextError.message : "Unable to save the membership plan.");
                      }
                    }}
                    className="mt-3 flex flex-col gap-3"
                  >
                    <input name="plan_id" type="hidden" value={plan.id} />
                    <div className="flex flex-col gap-1">
                      <FieldLabel htmlFor={`plan-name-${plan.id}`} required>Plan name</FieldLabel>
                      <Input
                        aria-describedby={`plan-name-${plan.id}-hint`}
                        defaultValue={plan.name}
                        id={`plan-name-${plan.id}`}
                        name="name"
                        required
                      />
                      <FieldHint id={`plan-name-${plan.id}-hint`}>
                        This name appears on internal plan lists, Stripe-backed memberships, and your public signup page.
                      </FieldHint>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <FieldLabel
                          htmlFor={`plan-price-${plan.id}`}
                          info="Membership prices are stored in cents, so use 2500 for a $25.00 plan."
                        >
                          Price (cents)
                        </FieldLabel>
                        <Input
                          aria-describedby={`plan-price-${plan.id}-hint`}
                          defaultValue={plan.price_cents}
                          id={`plan-price-${plan.id}`}
                          name="price_cents"
                          type="number"
                        />
                        <FieldHint id={`plan-price-${plan.id}-hint`}>
                          Enter the amount to charge each billing cycle in cents.
                        </FieldHint>
                      </div>
                      <div className="flex flex-col gap-1">
                        <FieldLabel
                          htmlFor={`plan-interval-${plan.id}`}
                          info="Billing interval controls how often TaproomOS and Stripe renew the plan."
                        >
                          Interval
                        </FieldLabel>
                        <Select
                          aria-describedby={`plan-interval-${plan.id}-hint`}
                          defaultValue={plan.billing_interval}
                          id={`plan-interval-${plan.id}`}
                          name="billing_interval"
                        >
                          <option value="month">Monthly</option>
                          <option value="quarter">Quarterly</option>
                          <option value="year">Yearly</option>
                        </Select>
                        <FieldHint id={`plan-interval-${plan.id}-hint`}>
                          Choose how often members should be charged and receive plan benefits.
                        </FieldHint>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <FieldLabel htmlFor={`plan-desc-${plan.id}`}>Description</FieldLabel>
                      <Textarea
                        aria-describedby={`plan-desc-${plan.id}-hint`}
                        defaultValue={plan.description ?? ""}
                        id={`plan-desc-${plan.id}`}
                        name="description"
                        rows={2}
                      />
                      <FieldHint id={`plan-desc-${plan.id}-hint`}>
                        Explain what members get each cycle so staff and guests can tell plans apart.
                      </FieldHint>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="flex items-center gap-2 text-[13.5px] cursor-pointer" htmlFor={`plan-active-${plan.id}`} style={{ color: "var(--c-text)" }}>
                        <input
                          aria-describedby={`plan-active-${plan.id}-hint`}
                          defaultChecked={plan.active}
                          id={`plan-active-${plan.id}`}
                          name="active"
                          type="checkbox"
                        />
                        Allow public signup
                      </label>
                      <FieldHint id={`plan-active-${plan.id}-hint`}>
                        Turn this on to show the plan on your public membership page. Turn it off to hide the plan without deleting existing members.
                      </FieldHint>
                    </div>
                    <Button size="sm" type="submit">Save plan</Button>
                  </form>
                </details>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card style={{ marginBottom: 24 }}>
        <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>New membership plan</div>
        <form
          action={async (formData) => {
            try {
              setError(null);
              setResult(createMembershipPlan(formData, capability));
            } catch (nextError) {
              setResult(null);
              setError(nextError instanceof Error ? nextError.message : "Unable to create the membership plan.");
            }
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="create-plan-name" required>Plan name</FieldLabel>
            <Input aria-describedby="create-plan-name-hint" id="create-plan-name" name="name" placeholder="Mug Club Gold" required />
            <FieldHint id="create-plan-name-hint">
              This is the public and internal name for the membership option guests can choose.
            </FieldHint>
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="create-plan-desc">Description</FieldLabel>
            <Textarea
              aria-describedby="create-plan-desc-hint"
              id="create-plan-desc"
              name="description"
              placeholder="What members get each cycle"
              rows={2}
            />
            <FieldHint id="create-plan-desc-hint">
              Describe the perks, pours, discounts, or pickups members receive each billing cycle.
            </FieldHint>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <FieldLabel
                htmlFor="create-plan-price"
                info="Membership prices are stored in cents, so 2500 becomes $25.00 on the public page and checkout."
                required
              >
                Price (cents)
              </FieldLabel>
              <Input
                aria-describedby={`create-plan-price-hint${!capability.canSellMemberships ? " create-plan-price-gate" : ""}`}
                id="create-plan-price"
                name="price_cents"
                placeholder="2500"
                type="number"
              />
              <FieldHint id="create-plan-price-hint">Enter the recurring charge amount in cents for each billing interval.</FieldHint>
              {!capability.canSellMemberships && (
                <span className="text-xs text-amber-600" id="create-plan-price-gate">{getMembershipGateCopy()}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel
                htmlFor="create-plan-interval"
                info="Billing interval decides how often members renew and how the plan is labeled publicly."
              >
                Billing interval
              </FieldLabel>
              <Select aria-describedby="create-plan-interval-hint" defaultValue="month" id="create-plan-interval" name="billing_interval">
                <option value="month">Monthly</option>
                <option value="quarter">Quarterly</option>
                <option value="year">Yearly</option>
              </Select>
              <FieldHint id="create-plan-interval-hint">
                Choose the cadence for billing and benefits, such as monthly pours or yearly mug renewals.
              </FieldHint>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-[13.5px] cursor-pointer" htmlFor="create-plan-active" style={{ color: "var(--c-text)" }}>
              <input aria-describedby="create-plan-active-hint" defaultChecked id="create-plan-active" name="active" type="checkbox" />
              Allow public signup
            </label>
            <FieldHint id="create-plan-active-hint">
              Leave this on if guests should be able to join immediately from your public membership page.
            </FieldHint>
          </div>
          <Button type="submit">Create plan</Button>
        </form>
      </Card>

      <div>
        <div
          className="text-[13px] font-bold uppercase tracking-[0.8px] mb-3"
          style={{ color: "var(--c-muted)" }}
        >
          Members · {memberships.length}
        </div>
        {memberships.length === 0 ? (
          <Card>
            <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
              No memberships yet. Public signup will create records here.
            </p>
          </Card>
        ) : (
          <DataTable
            columns={[
              {
                key: "member",
                label: "Member",
                render: (membership) => (
                  <>
                    <div className="font-semibold" style={{ color: "var(--c-text)" }}>{membership.member_name}</div>
                    <div className="text-[11.5px]" style={{ color: "var(--c-muted)" }}>{membership.member_email}</div>
                  </>
                ),
              },
              {
                key: "plan",
                label: "Plan",
                render: (membership) => (
                  <Badge variant="accent">
                    {membership.plan_name_snapshot ?? membership.membership_plans?.name ?? "Membership"}
                  </Badge>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (membership) => (
                  <div className="flex flex-col gap-1">
                    <Badge variant={membership.status === "active" ? "success" : "default"}>{membership.status}</Badge>
                    {membership.cancel_at_period_end && (
                      <Badge variant="warning">
                        Cancels {membership.current_period_end ? formatDate(membership.current_period_end) : "soon"}
                      </Badge>
                    )}
                  </div>
                ),
              },
              {
                key: "period_ends",
                label: "Period ends",
                render: (membership) => (
                  <span style={{ color: "var(--c-muted)", fontSize: 13 }}>
                    {membership.current_period_end ? formatDate(membership.current_period_end) : "—"}
                  </span>
                ),
              },
              {
                key: "actions",
                label: "Actions",
                render: (membership) => {
                  const resumable = canResumeMembership({
                    cancelAtPeriodEnd: membership.cancel_at_period_end,
                    endedAt: membership.ended_at,
                    status: membership.status as "active" | "pending" | "past_due" | "cancelled",
                  });

                  return resumable ? (
                    <Button
                      onClick={() => {
                        try {
                          setError(null);
                          setResult(updateMembershipStatus(membership.id, "resume"));
                        } catch (nextError) {
                          setResult(null);
                          setError(nextError instanceof Error ? nextError.message : "Unable to resume membership.");
                        }
                      }}
                      size="sm"
                      type="button"
                      variant="success"
                    >
                      Resume
                    </Button>
                  ) : membership.status === "active" && !membership.cancel_at_period_end ? (
                    <Button
                      onClick={() => {
                        try {
                          setError(null);
                          setResult(updateMembershipStatus(membership.id, "cancel"));
                        } catch (nextError) {
                          setResult(null);
                          setError(nextError instanceof Error ? nextError.message : "Unable to cancel membership.");
                        }
                      }}
                      size="sm"
                      type="button"
                      variant="ghost"
                      style={{ color: "oklch(45% 0.18 20)" }}
                    >
                      Cancel
                    </Button>
                  ) : null;
                },
              },
            ]}
            keyExtractor={(membership) => membership.id}
            rows={memberships}
          />
        )}
      </div>
    </div>
  );
}
