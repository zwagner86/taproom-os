export const dynamic = "force-dynamic";

import { canResumeMembership } from "@taproom/domain";
import type { Route } from "next";
import Link from "next/link";

import { Badge, Button, Card, Input, Label, Select, Textarea } from "@taproom/ui";

import { getMembershipGateCopy } from "@/lib/venue-payment-capability";
import {
  cancelMembershipAction,
  createMembershipPlanAction,
  resumeMembershipAction,
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
  const [{ venue: venueRecord }, { error, message }] = await Promise.all([
    requireVenueAccess(venue),
    searchParams,
  ]);
  const capability = await getVenuePaymentCapability(venueRecord.id);
  const [plans, memberships] = await Promise.all([
    listVenueMembershipPlans(venueRecord.id),
    listVenueMemberships(venueRecord.id),
  ]);
  const createAction = createMembershipPlanAction.bind(null, venue);
  const updateAction = updateMembershipPlanAction.bind(null, venue);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-7 gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.5px] mb-1" style={{ color: "var(--c-text)" }}>
            Memberships
          </h1>
          <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
            {venueRecord.membership_label} · {plans.filter((p) => p.active).length} active plans · {memberships.length} members
          </p>
        </div>
      </div>

      {!capability.canSellMemberships && (
        <div className="mb-5 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          <strong>Stripe not connected.</strong> Memberships require payment setup.{" "}
          <Link className="font-semibold underline" href={`/app/${venue}/billing` as Route}>
            Set up billing →
          </Link>
        </div>
      )}
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

      {/* Plans grid */}
      <div className="mb-6">
        <div
          className="text-[13px] font-bold uppercase tracking-[0.8px] mb-3"
          style={{ color: "var(--c-muted)" }}
        >
          Plans
        </div>
        {plans.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div style={{ fontSize: 32 }}>🏷</div>
              <div className="font-semibold text-[15px]" style={{ color: "var(--c-text)" }}>No plans yet</div>
            </div>
          </Card>
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
                  <form action={updateAction} className="mt-3 flex flex-col gap-3">
                    <input name="plan_id" type="hidden" value={plan.id} />
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`plan-name-${plan.id}`}>Plan name</Label>
                      <Input defaultValue={plan.name} id={`plan-name-${plan.id}`} name="name" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor={`plan-price-${plan.id}`}>Price (cents)</Label>
                        <Input defaultValue={plan.price_cents} id={`plan-price-${plan.id}`} name="price_cents" type="number" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor={`plan-interval-${plan.id}`}>Interval</Label>
                        <Select defaultValue={plan.billing_interval} id={`plan-interval-${plan.id}`} name="billing_interval">
                          <option value="month">Monthly</option>
                          <option value="quarter">Quarterly</option>
                          <option value="year">Yearly</option>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`plan-desc-${plan.id}`}>Description</Label>
                      <Textarea defaultValue={plan.description ?? ""} id={`plan-desc-${plan.id}`} name="description" rows={2} />
                    </div>
                    <label className="flex items-center gap-2 text-[13.5px] cursor-pointer" style={{ color: "var(--c-text)" }}>
                      <input defaultChecked={plan.active} name="active" type="checkbox" />
                      Allow public signup
                    </label>
                    <Button size="sm" type="submit">Save plan</Button>
                  </form>
                </details>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create plan */}
      <Card style={{ marginBottom: 24 }}>
        <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>New membership plan</div>
        <form action={createAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="create-plan-name">Plan name <span style={{ color: "var(--accent)" }}>*</span></Label>
            <Input id="create-plan-name" name="name" placeholder="Mug Club Gold" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="create-plan-desc">Description</Label>
            <Textarea id="create-plan-desc" name="description" placeholder="What members get each cycle" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="create-plan-price">Price (cents) <span style={{ color: "var(--accent)" }}>*</span></Label>
              <Input id="create-plan-price" name="price_cents" placeholder="2500" type="number" />
              {!capability.canSellMemberships && (
                <span className="text-xs text-amber-600">{getMembershipGateCopy()}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="create-plan-interval">Billing interval</Label>
              <Select defaultValue="month" id="create-plan-interval" name="billing_interval">
                <option value="month">Monthly</option>
                <option value="quarter">Quarterly</option>
                <option value="year">Yearly</option>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-[13.5px] cursor-pointer" style={{ color: "var(--c-text)" }}>
            <input defaultChecked name="active" type="checkbox" />
            Allow public signup
          </label>
          <Button type="submit">Create plan</Button>
        </form>
      </Card>

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
          <Card style={{ padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid var(--c-border)" }}>
                    {["Member", "Plan", "Status", "Period ends", "Actions"].map((h) => (
                      <th
                        key={h}
                        style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "var(--c-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {memberships.map((membership, i) => {
                    const cancelAction = cancelMembershipAction.bind(null, venue, membership.id);
                    const resumeAction = resumeMembershipAction.bind(null, venue, membership.id);
                    const resumable = canResumeMembership({
                      cancelAtPeriodEnd: membership.cancel_at_period_end,
                      endedAt: membership.ended_at,
                      status: membership.status as "active" | "pending" | "past_due" | "cancelled",
                    });

                    return (
                      <tr
                        key={membership.id}
                        style={{ borderBottom: i < memberships.length - 1 ? "1px solid var(--c-border)" : "none" }}
                      >
                        <td style={{ padding: "11px 12px" }}>
                          <div className="font-semibold" style={{ color: "var(--c-text)" }}>
                            {membership.member_name}
                          </div>
                          <div className="text-[11.5px]" style={{ color: "var(--c-muted)" }}>
                            {membership.member_email}
                          </div>
                        </td>
                        <td style={{ padding: "11px 12px" }}>
                          <Badge variant="accent">
                            {membership.plan_name_snapshot ?? membership.membership_plans?.name ?? "Membership"}
                          </Badge>
                        </td>
                        <td style={{ padding: "11px 12px" }}>
                          <div className="flex flex-col gap-1">
                            <Badge variant={membership.status === "active" ? "success" : "default"}>
                              {membership.status}
                            </Badge>
                            {membership.cancel_at_period_end && (
                              <Badge variant="warning">
                                Cancels {membership.current_period_end ? formatDate(membership.current_period_end) : "soon"}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "11px 12px", color: "var(--c-muted)", fontSize: 13 }}>
                          {membership.current_period_end ? formatDate(membership.current_period_end) : "—"}
                        </td>
                        <td style={{ padding: "11px 12px" }}>
                          {resumable ? (
                            <form action={resumeAction}>
                              <Button size="sm" type="submit" variant="success">Resume</Button>
                            </form>
                          ) : membership.status === "active" && !membership.cancel_at_period_end ? (
                            <form action={cancelAction}>
                              <Button size="sm" type="submit" variant="ghost" style={{ color: "oklch(45% 0.18 20)" }}>
                                Cancel
                              </Button>
                            </form>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
