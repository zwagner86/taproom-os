export const dynamic = "force-dynamic";

import { calculateApplicationFee } from "@taproom/domain";
import { Badge, Button, Card } from "@taproom/ui";

import { getEnv } from "@/env";
import {
  getBillingCapabilitySummary,
  getRefundGateCopy,
  stripeOptionalFeatureList,
} from "@/lib/venue-payment-capability";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { refundEventBookingAction } from "@/server/actions/events";
import { startStripeConnectAction } from "@/server/actions/providers";
import { getStripeConnectionForVenue } from "@/server/repositories/providers";
import { requireVenueAccess } from "@/server/repositories/venues";
import { buildVenueFinanceLedger } from "@/server/services/finance";
import { getVenuePaymentCapability } from "@/server/services/payment-capability";

export default async function VenueBillingPage({
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
  const [connection, ledger, refundableBookings] = await Promise.all([
    getStripeConnectionForVenue(venueRecord.id),
    buildVenueFinanceLedger(venueRecord.id),
    listRefundableBookings(venueRecord.id),
  ]);
  const capability = await getVenuePaymentCapability(venueRecord.id);
  const connectAction = startStripeConnectAction.bind(null, venue);
  const feePercent = getEnv().STRIPE_APPLICATION_FEE_PERCENT;

  const statusVariant =
    capability.status === "ready" ? "success" :
    capability.status === "restricted" ? "error" :
    capability.status === "onboarding_incomplete" ? "warning" : "default";

  return (
    <div>
      <div className="flex items-start justify-between mb-7 gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.5px] mb-1" style={{ color: "var(--c-text)" }}>
            Billing & Payments
          </h1>
          <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
            Stripe connection, ledger, and refunds.
          </p>
        </div>
      </div>

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

      <div className="grid grid-cols-[1fr_1.5fr] gap-6 items-start mb-6">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          {/* Stripe status */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Stripe connection</div>
              <Badge variant={statusVariant}>
                {capability.status === "ready" ? "Ready" :
                 capability.status === "restricted" ? "Restricted" :
                 capability.status === "onboarding_incomplete" ? "Incomplete" : "Not connected"}
              </Badge>
            </div>
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--c-muted)" }}>
              {getBillingCapabilitySummary(capability)}
            </p>
            {connection?.stripe_account_id && (
              <div
                className="rounded-lg px-3 py-2 text-[12px] mb-4"
                style={{ background: "var(--c-bg2)", color: "var(--c-muted)" }}
              >
                Account: {connection.stripe_account_id} · Charges: {connection.charges_enabled ? "enabled" : "disabled"}
              </div>
            )}
            {connection?.last_error && (
              <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
                {connection.last_error}
              </div>
            )}
            <div className="flex flex-col gap-2">
              {capability.status === "not_connected" && (
                <form action={connectAction}>
                  <Button className="w-full" type="submit">Connect Stripe account</Button>
                </form>
              )}
              {capability.status === "onboarding_incomplete" && (
                <form action={connectAction}>
                  <Button className="w-full" type="submit">Continue Stripe onboarding</Button>
                </form>
              )}
              {(capability.status === "restricted" || capability.status === "ready") && (
                <a
                  className="inline-flex w-full items-center justify-center rounded-lg border px-4 py-[9px] text-[13.5px] font-semibold transition"
                  href="https://dashboard.stripe.com/"
                  rel="noreferrer"
                  style={{ borderColor: "var(--c-border)", color: "var(--c-text)" }}
                  target="_blank"
                >
                  Open Stripe dashboard ↗
                </a>
              )}
            </div>
          </Card>

          {/* Platform fee */}
          <Card>
            <div className="text-sm font-semibold mb-2" style={{ color: "var(--c-text)" }}>Platform fee</div>
            <div className="text-[32px] font-black mb-1" style={{ color: "var(--c-text)" }}>
              {Math.round(feePercent * 100)}%
            </div>
            <div className="text-[13px]" style={{ color: "var(--c-muted)" }}>
              Example: {formatCurrency(2500)} sale → {formatCurrency(calculateApplicationFee(2500, feePercent))} fee
            </div>
          </Card>

          {/* Still works without Stripe */}
          {capability.status !== "ready" && (
            <Card>
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--c-text)" }}>Still works without Stripe</div>
              <div className="flex flex-col gap-2">
                {stripeOptionalFeatureList.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-[13px]"
                    style={{ color: "var(--c-muted)" }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: "var(--accent)" }}
                    />
                    {feature}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right column — Ledger */}
        <div>
          <div
            className="text-[13px] font-bold uppercase tracking-[0.8px] mb-3"
            style={{ color: "var(--c-muted)" }}
          >
            Finance ledger · {ledger.length} entries
          </div>
          {ledger.length === 0 ? (
            <Card>
              <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
                {capability.status === "ready"
                  ? "No paid activity yet."
                  : "Ledger activity will appear here after Stripe setup is complete."}
              </p>
            </Card>
          ) : (
            <Card style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid var(--c-border)" }}>
                    {["Description", "Type", "Fee", "Amount", "Date"].map((h) => (
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
                  {ledger.map((entry, i) => (
                    <tr key={entry.id} style={{ borderBottom: i < ledger.length - 1 ? "1px solid var(--c-border)" : "none" }}>
                      <td style={{ padding: "11px 12px" }}>
                        <div className="font-semibold text-[13px]" style={{ color: "var(--c-text)" }}>{entry.title}</div>
                        <div className="text-[11.5px]" style={{ color: "var(--c-muted)" }}>{entry.status}</div>
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <Badge variant="info">{entry.type}</Badge>
                      </td>
                      <td style={{ padding: "11px 12px", fontSize: 13, color: "var(--c-muted)" }}>
                        {formatCurrency(entry.feeCents, entry.currency)}
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <span
                          className="font-semibold text-[13.5px]"
                          style={{ color: entry.amountCents >= 0 ? "oklch(45% 0.15 155)" : "oklch(45% 0.18 20)" }}
                        >
                          {formatCurrency(entry.amountCents, entry.currency)}
                        </span>
                      </td>
                      <td style={{ padding: "11px 12px", fontSize: 12, color: "var(--c-muted)" }}>
                        {new Date(entry.occurredAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>

      {/* Refund controls */}
      <div>
        <div
          className="text-[13px] font-bold uppercase tracking-[0.8px] mb-3"
          style={{ color: "var(--c-muted)" }}
        >
          Refundable bookings · {refundableBookings.length}
        </div>
        {!capability.canIssueRefunds && (
          <div
            className="mb-4 rounded-[10px] px-4 py-3 text-[13px]"
            style={{ background: "var(--c-bg2)", color: "var(--c-muted)" }}
          >
            {getRefundGateCopy()}
          </div>
        )}
        {refundableBookings.length === 0 ? (
          <Card>
            <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
              No paid bookings available for refund.
            </p>
          </Card>
        ) : (
          <Card style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid var(--c-border)" }}>
                  {["Event", "Guest", "Amount", "Action"].map((h) => (
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
                {refundableBookings.map((booking, i) => {
                  const refundAction = refundEventBookingAction.bind(null, venue, booking.id);
                  return (
                    <tr key={booking.id} style={{ borderBottom: i < refundableBookings.length - 1 ? "1px solid var(--c-border)" : "none" }}>
                      <td style={{ padding: "11px 12px", fontWeight: 500, color: "var(--c-text)" }}>
                        {booking.events?.title ?? "Paid event"}
                      </td>
                      <td style={{ padding: "11px 12px", color: "var(--c-muted)", fontSize: 13 }}>
                        {booking.purchaser_name}
                      </td>
                      <td style={{ padding: "11px 12px", fontWeight: 600, color: "var(--c-text)" }}>
                        {formatCurrency(booking.total_price_cents, booking.currency)}
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        {capability.canIssueRefunds ? (
                          <form action={refundAction}>
                            <Button size="sm" type="submit" variant="ghost" style={{ color: "oklch(45% 0.18 20)" }}>
                              Full refund
                            </Button>
                          </form>
                        ) : (
                          <span className="text-[12px]" style={{ color: "var(--c-muted)" }}>Stripe required</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}

async function listRefundableBookings(venueId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("event_bookings")
    .select("*, events(title)")
    .eq("venue_id", venueId)
    .eq("payment_status", "paid")
    .not("stripe_charge_id", "is", null)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}
