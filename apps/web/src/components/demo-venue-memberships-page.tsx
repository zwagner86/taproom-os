"use client";

import { canResumeMembership } from "@taproom/domain";
import { useEffect, useMemo, useState } from "react";

import type { Route } from "next";
import Link from "next/link";

import { Pencil, Tag } from "lucide-react";

import { AdminCreateDrawer, AdminFormDrawer } from "@/components/admin-create-drawer";
import { MembershipPlanCreateForm, MembershipPlanForm } from "@/components/admin-create-forms";
import { DemoMutationAlert } from "@/components/demo-mutation-alert";
import { useDemoVenue } from "@/components/demo-venue-provider";
import { Alert, Badge, Button, Card, DataTable, EmptyState, FieldHint, FieldLabel, Input, PageHeader } from "@/components/ui";
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
    saveMembershipProgramName,
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
        actions={
          <AdminCreateDrawer
            description="Create a public membership plan with pricing, billing cadence, and signup visibility."
            title="New membership plan"
            triggerLabel="New plan"
          >
            {({ close }) => (
              <MembershipPlanCreateForm
                action={async (formData) => {
                  try {
                    setError(null);
                    setResult(createMembershipPlan(formData, capability));
                    close();
                  } catch (nextError) {
                    setResult(null);
                    setError(nextError instanceof Error ? nextError.message : "Unable to create the membership plan.");
                  }
                }}
                canSellMemberships={capability.canSellMemberships}
              />
            )}
          </AdminCreateDrawer>
        }
        subtitle={`${activePlans} active plans · ${memberships.length} members`}
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

      <Card className="mb-6">
        <form
          action={async (formData) => {
            try {
              setError(null);
              setResult(saveMembershipProgramName(formData));
            } catch (nextError) {
              setResult(null);
              setError(nextError instanceof Error ? nextError.message : "Unable to save the membership program name.");
            }
          }}
          className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"
          key={venue.membership_label}
        >
          <div className="flex flex-col gap-1">
            <FieldLabel
              htmlFor="membership_label"
              info="This program name appears on membership admin screens, public signup pages, membership displays, and membership notifications."
            >
              Membership program name
            </FieldLabel>
            <Input
              aria-describedby="membership-label-hint"
              defaultValue={venue.membership_label}
              id="membership_label"
              name="membership_label"
              placeholder="Mug Club"
            />
            <FieldHint id="membership-label-hint">Use a name like Mug Club, Beer Club, or Bottle Society. Blank saves as Club.</FieldHint>
          </div>
          <Button type="submit">Save name</Button>
        </form>
      </Card>

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
                <AdminFormDrawer
                  description="Update pricing, billing cadence, public signup visibility, and guest-facing plan copy."
                  title="Edit membership plan"
                  triggerIcon={<Pencil className="h-3.5 w-3.5" />}
                  triggerLabel="Edit"
                  triggerSize="sm"
                  triggerVariant="secondary"
                >
                  {({ close }) => (
                    <MembershipPlanForm
                      action={async (formData) => {
                        try {
                          setError(null);
                          setResult(updateMembershipPlan(formData, capability));
                          close();
                        } catch (nextError) {
                          setResult(null);
                          setError(nextError instanceof Error ? nextError.message : "Unable to save the membership plan.");
                        }
                      }}
                      canSellMemberships={capability.canSellMemberships}
                      defaultValues={plan}
                      mode="edit"
                    />
                  )}
                </AdminFormDrawer>
              </Card>
            ))}
          </div>
        )}
      </div>

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
