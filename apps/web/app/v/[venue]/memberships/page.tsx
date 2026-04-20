export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { Badge, Button, Card, Input, Label } from "@taproom/ui";

import { PublicFollowCard } from "@/components/public-follow-card";
import { getMembershipGateCopy } from "@/lib/venue-payment-capability";
import { formatCurrency } from "@/lib/utils";
import { startMembershipCheckoutAction } from "@/server/actions/memberships";
import { listPublicMembershipPlans } from "@/server/repositories/memberships";
import { getVenuePaymentCapability } from "@/server/services/payment-capability";

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

  const paymentCapability = await getVenuePaymentCapability(venueRecord.id);

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-8">
        <Badge variant="accent" style={{ marginBottom: 10 }}>{venueRecord.membership_label}</Badge>
        <h1 className="text-[36px] font-black tracking-[-0.8px] mb-2" style={{ color: "var(--c-text)", fontFamily: "Lora, serif" }}>
          {venueRecord.membership_label} at {venueRecord.name}
        </h1>
        <p className="text-[15px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
          Join and get recurring perks at {venueRecord.name}.
        </p>
      </div>

      {!paymentCapability.canSellMemberships && (
        <div className="mb-5 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          <strong>Membership signup is unavailable right now.</strong> {getMembershipGateCopy()}
        </div>
      )}
      {checkout === "success" && (
        <div className="mb-5 rounded-[10px] border border-green-200 bg-green-50 px-4 py-3 text-[13px] text-green-800">
          Checkout completed. Your membership will confirm shortly.
        </div>
      )}
      {checkout === "cancel" && (
        <div className="mb-5 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          Checkout was canceled before subscription creation.
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

      {plans.length === 0 ? (
        <Card style={{ marginBottom: 24 }}>
          <div className="py-8 text-center">
            <div className="text-[32px] mb-2">🏷</div>
            <p className="text-[14px]" style={{ color: "var(--c-muted)" }}>No public membership plans are active yet.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {plans.map((plan) => {
            const action = startMembershipCheckoutAction.bind(null, venue, plan.id);
            return (
              <Card key={plan.id}>
                <div className="mb-4">
                  <div className="font-bold text-[18px] tracking-[-0.3px] mb-1" style={{ color: "var(--c-text)", fontFamily: "Lora, serif" }}>
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-[26px] font-black" style={{ color: "var(--c-text)" }}>
                      {formatCurrency(plan.price_cents, plan.currency)}
                    </span>
                    <span className="text-[13px]" style={{ color: "var(--c-muted)" }}>/ {plan.billing_interval}</span>
                  </div>
                  {plan.description && (
                    <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
                      {plan.description}
                    </p>
                  )}
                </div>
                <form action={action} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`member-name-${plan.id}`}>Your name <span style={{ color: "var(--accent)" }}>*</span></Label>
                    <Input
                      disabled={!paymentCapability.canSellMemberships}
                      id={`member-name-${plan.id}`}
                      name="member_name"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`member-email-${plan.id}`}>Email</Label>
                    <Input
                      disabled={!paymentCapability.canSellMemberships}
                      id={`member-email-${plan.id}`}
                      name="member_email"
                      type="email"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`member-phone-${plan.id}`}>Phone</Label>
                    <Input
                      disabled={!paymentCapability.canSellMemberships}
                      id={`member-phone-${plan.id}`}
                      name="member_phone"
                    />
                  </div>
                  <Button className="w-full" disabled={!paymentCapability.canSellMemberships} type="submit">
                    Join {plan.name}
                  </Button>
                  {!paymentCapability.canSellMemberships && (
                    <p className="text-[12px]" style={{ color: "var(--c-muted)" }}>{getMembershipGateCopy()}</p>
                  )}
                </form>
              </Card>
            );
          })}
        </div>
      )}

      <PublicFollowCard returnPath={`/v/${venue}/memberships`} venueSlug={venue} />
    </main>
  );
}
