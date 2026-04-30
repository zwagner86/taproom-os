export const dynamic = "force-dynamic";

import { canResumeMembership } from "@taproom/domain";
import type { Route } from "next";
import Link from "next/link";

import { Pencil, Tag } from "lucide-react";

import { Alert, Badge, Button, Card, DataTable, EmptyState, FieldHint, FieldLabel, Input, PageHeader } from "@/components/ui";

import { AdminCreateDrawer, AdminFormDrawer } from "@/components/admin-create-drawer";
import { MembershipPlanCreateForm, MembershipPlanForm } from "@/components/admin-create-forms";
import { DemoVenueMembershipsPage } from "@/components/demo-venue-memberships-page";
import {
  cancelMembershipAction,
  createMembershipPlanAction,
  resumeMembershipAction,
  updateMembershipProgramNameAction,
  updateMembershipPlanAction,
} from "@/server/actions/memberships";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listVenueMembershipPlans, listVenueMemberships } from "@/server/repositories/memberships";
import { requireVenueAccess } from "@/server/repositories/venues";
import { getVenuePaymentCapability } from "@/server/services/payment-capability";

export default async function VenueMembershipsPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { venue } = await params;
  const [access, { error, message }] = await Promise.all([
    requireVenueAccess(venue),
    searchParams,
  ]);
  const { venue: venueRecord } = access;
  const capability = await getVenuePaymentCapability(venueRecord.id);
  const [plans, memberships] = await Promise.all([
    listVenueMembershipPlans(venueRecord.id),
    listVenueMemberships(venueRecord.id),
  ]);
  const createAction = createMembershipPlanAction.bind(null, venue);
  const updateAction = updateMembershipPlanAction.bind(null, venue);
  const updateProgramNameAction = updateMembershipProgramNameAction.bind(null, venue);

  if (access.isDemoVenue) {
    return (
      <DemoVenueMembershipsPage
        capability={capability}
        initialError={error}
        initialMemberships={memberships}
        initialPlans={plans}
        initialVenue={venueRecord}
        venueSlug={venue}
      />
    );
  }

  return (
    <div>
      <PageHeader
        actions={
          <AdminCreateDrawer
            description="Create a public membership plan with pricing, billing cadence, and signup visibility."
            title="New membership plan"
            triggerLabel="New plan"
          >
            <MembershipPlanCreateForm
              action={createAction}
              canSellMemberships={capability.canSellMemberships}
              disabled={access.isDemoVenue}
            />
          </AdminCreateDrawer>
        }
        title="Memberships"
        subtitle={`${plans.filter((p) => p.active).length} active plans · ${memberships.length} members`}
      />

      {!capability.canSellMemberships && (
        <Alert variant="warning" className="mb-5">
          <strong>Stripe not connected.</strong> Memberships require payment setup.{" "}
          <Link className="font-semibold underline" href={`/app/${venue}/billing` as Route}>
            Set up billing →
          </Link>
        </Alert>
      )}
      {message && <Alert variant="success" className="mb-5">{message}</Alert>}
      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

      <Card className="mb-6">
        <form action={updateProgramNameAction} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="flex flex-col gap-1">
            <FieldLabel
              htmlFor="membership_label"
              info="This program name appears on membership admin screens, public signup pages, membership displays, and membership notifications."
            >
              Membership program name
            </FieldLabel>
            <Input
              aria-describedby="membership-label-hint"
              defaultValue={venueRecord.membership_label}
              id="membership_label"
              name="membership_label"
              placeholder="Mug Club"
            />
            <FieldHint id="membership-label-hint">Use a name like Mug Club, Beer Club, or Bottle Society. Blank saves as Club.</FieldHint>
          </div>
          <Button type="submit">Save name</Button>
        </form>
      </Card>

      {/* Plans grid */}
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
                  triggerDisabled={access.isDemoVenue}
                  triggerIcon={<Pencil className="h-3.5 w-3.5" />}
                  triggerLabel="Edit"
                  triggerSize="sm"
                  triggerVariant="secondary"
                >
                  <MembershipPlanForm
                    action={updateAction}
                    canSellMemberships={capability.canSellMemberships}
                    defaultValues={plan}
                    disabled={access.isDemoVenue}
                    mode="edit"
                  />
                </AdminFormDrawer>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Members table */}
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
            rows={memberships}
            keyExtractor={(m) => m.id}
            columns={[
              {
                key: "member",
                label: "Member",
                render: (m) => (
                  <>
                    <div className="font-semibold" style={{ color: "var(--c-text)" }}>{m.member_name}</div>
                    <div className="text-[11.5px]" style={{ color: "var(--c-muted)" }}>{m.member_email}</div>
                  </>
                ),
              },
              {
                key: "plan",
                label: "Plan",
                render: (m) => (
                  <Badge variant="accent">
                    {m.plan_name_snapshot ?? m.membership_plans?.name ?? "Membership"}
                  </Badge>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (m) => (
                  <div className="flex flex-col gap-1">
                    <Badge variant={m.status === "active" ? "success" : "default"}>{m.status}</Badge>
                    {m.cancel_at_period_end && (
                      <Badge variant="warning">
                        Cancels {m.current_period_end ? formatDate(m.current_period_end) : "soon"}
                      </Badge>
                    )}
                  </div>
                ),
              },
              {
                key: "period_ends",
                label: "Period ends",
                render: (m) => (
                  <span style={{ color: "var(--c-muted)", fontSize: 13 }}>
                    {m.current_period_end ? formatDate(m.current_period_end) : "—"}
                  </span>
                ),
              },
              {
                key: "actions",
                label: "Actions",
                render: (m) => {
                  const cancelAction = cancelMembershipAction.bind(null, venue, m.id);
                  const resumeAction = resumeMembershipAction.bind(null, venue, m.id);
                  const resumable = canResumeMembership({
                    cancelAtPeriodEnd: m.cancel_at_period_end,
                    endedAt: m.ended_at,
                    status: m.status as "active" | "pending" | "past_due" | "cancelled",
                  });
                  return resumable ? (
                    <form action={resumeAction}>
                      <Button disabled={access.isDemoVenue} size="sm" type="submit" variant="success">Resume</Button>
                    </form>
                  ) : m.status === "active" && !m.cancel_at_period_end ? (
                    <form action={cancelAction}>
                      <Button
                        disabled={access.isDemoVenue}
                        size="sm"
                        type="submit"
                        variant="ghost"
                        style={{ color: "oklch(45% 0.18 20)" }}
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : null;
                },
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
