export const dynamic = "force-dynamic";

import { calculateApplicationFee } from "@taproom/domain";
import { Button, Card } from "@taproom/ui";

import { getEnv } from "@/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { refundEventBookingAction } from "@/server/actions/events";
import { startStripeConnectAction } from "@/server/actions/providers";
import { getStripeConnectionForVenue } from "@/server/repositories/providers";
import { requireVenueAccess } from "@/server/repositories/venues";
import { buildVenueFinanceLedger } from "@/server/services/finance";

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
  const connectAction = startStripeConnectAction.bind(null, venue);
  const feePercent = getEnv().STRIPE_APPLICATION_FEE_PERCENT;

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Billing</p>
          <h1 className="font-display text-4xl text-ink">Payments and ledger</h1>
          <p className="max-w-3xl text-sm leading-6 text-ink/65">
            Stripe Standard Connect keeps venues as merchant of record. This hub gives the taproom an operational view
            of connection health, platform fee estimates, recent paid activity, and refund controls.
          </p>
        </div>
        {message ? <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">{message}</p> : null}
        {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-3 md:col-span-2">
          <p className="text-sm font-semibold text-ink">Stripe connection</p>
          <p className="text-sm text-ink/65">
            Status: {connection?.status ?? "not_connected"}
            {connection?.stripe_account_id ? ` · ${connection.stripe_account_id}` : ""}
          </p>
          <p className="text-sm text-ink/55">
            Charges enabled: {connection?.charges_enabled ? "Yes" : "No"} · Details submitted:{" "}
            {connection?.details_submitted ? "Yes" : "No"}
          </p>
          {connection?.last_error ? <p className="text-sm text-ember">{connection.last_error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <form action={connectAction}>
              <Button type="submit">{connection?.stripe_account_id ? "Reconnect Stripe" : "Connect Stripe"}</Button>
            </form>
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/10 bg-white px-5 text-sm font-semibold text-ink transition hover:border-ink/20"
              href="https://dashboard.stripe.com/"
              rel="noreferrer"
              target="_blank"
            >
              Open Stripe dashboard
            </a>
          </div>
        </Card>
        <Card className="space-y-3">
          <p className="text-sm font-semibold text-ink">TaproomOS fee</p>
          <p className="font-display text-4xl text-ink">{Math.round(feePercent * 100)}%</p>
          <p className="text-sm text-ink/60">
            Example: {formatCurrency(2500)} sale yields {formatCurrency(calculateApplicationFee(2500, feePercent))} in platform fees.
          </p>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-ink">Ledger</h2>
          <p className="text-sm text-ink/55">{ledger.length} entries</p>
        </div>
        {ledger.length === 0 ? (
          <p className="text-sm leading-6 text-ink/65">No paid event or membership activity yet.</p>
        ) : (
          <div className="grid gap-3">
            {ledger.map((entry) => (
              <div className="rounded-3xl border border-ink/10 bg-mist/35 p-4" key={entry.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{entry.title}</p>
                    <p className="text-sm text-ink/60">
                      {entry.type} · {entry.status} · Fee {formatCurrency(entry.feeCents, entry.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink">{formatCurrency(entry.amountCents, entry.currency)}</p>
                    <p className="text-sm text-ink/55">{new Date(entry.occurredAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-ink">Refund controls</h2>
          <p className="text-sm text-ink/55">{refundableBookings.length} refundable bookings</p>
        </div>
        {refundableBookings.length === 0 ? (
          <p className="text-sm leading-6 text-ink/65">No paid event bookings are currently waiting for refund actions.</p>
        ) : (
          <div className="grid gap-3">
            {refundableBookings.map((booking) => {
              const refundAction = refundEventBookingAction.bind(null, venue, booking.id);

              return (
                <div className="rounded-3xl border border-ink/10 bg-mist/35 p-4" key={booking.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{booking.events?.title ?? "Paid event booking"}</p>
                      <p className="text-sm text-ink/60">
                        {booking.purchaser_name} · {formatCurrency(booking.total_price_cents, booking.currency)}
                      </p>
                    </div>
                    <form action={refundAction}>
                      <Button type="submit" variant="ghost">
                        Full refund
                      </Button>
                    </form>
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
