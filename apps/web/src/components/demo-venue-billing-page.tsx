"use client";

import { calculateApplicationFee, type VenuePaymentCapability } from "@taproom/domain";
import { useState } from "react";

import { DemoMutationAlert } from "@/components/demo-mutation-alert";
import { Alert, Badge, Button, Card, DataTable, PageHeader } from "@/components/ui";
import type { DemoMutationResult } from "@/lib/demo-venue-state";
import {
  getBillingCapabilitySummary,
  getRefundGateCopy,
  stripeOptionalFeatureList,
} from "@/lib/venue-payment-capability";
import { formatCurrency } from "@/lib/utils";
import type { StripeConnectionRow } from "@/server/repositories/providers";
import type { Database } from "../../../../supabase/types";

type RefundableBookingRecord = Database["public"]["Tables"]["event_bookings"]["Row"] & {
  events: { title: string } | null;
};

type FinanceEntry = {
  amountCents: number;
  currency: string;
  feeCents: number;
  id: string;
  occurredAt: string;
  status: string;
  title: string;
  type: string;
};

export function DemoVenueBillingPage({
  capability,
  feePercent,
  initialConnection,
  initialError,
  initialLedger,
  initialRefundableBookings,
}: {
  capability: VenuePaymentCapability;
  feePercent: number;
  initialConnection: StripeConnectionRow | null;
  initialError?: string;
  initialLedger: FinanceEntry[];
  initialRefundableBookings: RefundableBookingRecord[];
}) {
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [result, setResult] = useState<DemoMutationResult | null>(null);

  const statusVariant =
    capability.status === "ready" ? "success" :
    capability.status === "restricted" ? "error" :
    capability.status === "onboarding_incomplete" ? "warning" : "default";

  const handleDemoAction = (message: string) => {
    setError(null);
    setResult({
      detail: "Provider actions stay in demo preview mode here and do not connect, sync, or refund anything.",
      message,
    });
  };

  return (
    <div>
      <PageHeader subtitle="Stripe connection, ledger, and refunds." title="Billing & Payments" />

      <div className="mb-5 space-y-4">
        <DemoMutationAlert onDismiss={() => setResult(null)} result={result} />
        {error && (
          <Alert onDismiss={() => setError(null)} variant="error">
            {error}
          </Alert>
        )}
      </div>

      <div className="mb-6 grid items-start gap-6 xl:grid-cols-[1fr_1.5fr]">
        <div className="flex flex-col gap-4">
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
            {initialConnection?.stripe_account_id && (
              <div
                className="rounded-lg px-3 py-2 text-[12px] mb-4"
                style={{ background: "var(--c-bg2)", color: "var(--c-muted)" }}
              >
                Account: {initialConnection.stripe_account_id} · Charges: {initialConnection.charges_enabled ? "enabled" : "disabled"}
              </div>
            )}
            {initialConnection?.last_error && (
              <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
                {initialConnection.last_error}
              </div>
            )}
            <div className="flex flex-col gap-2">
              {capability.status === "not_connected" && (
                <Button className="w-full" onClick={() => handleDemoAction("Stripe connect flow previewed for demo.")} type="button">
                  Connect Stripe account
                </Button>
              )}
              {capability.status === "onboarding_incomplete" && (
                <Button className="w-full" onClick={() => handleDemoAction("Stripe onboarding previewed for demo.")} type="button">
                  Continue Stripe onboarding
                </Button>
              )}
              {(capability.status === "restricted" || capability.status === "ready") && (
                <Button
                  className="w-full"
                  onClick={() => handleDemoAction("Stripe dashboard handoff previewed for demo.")}
                  type="button"
                  variant="secondary"
                >
                  Open Stripe dashboard
                </Button>
              )}
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold mb-2" style={{ color: "var(--c-text)" }}>Platform fee</div>
            <div className="text-[32px] font-black mb-1" style={{ color: "var(--c-text)" }}>
              {Math.round(feePercent * 100)}%
            </div>
            <div className="text-[13px]" style={{ color: "var(--c-muted)" }}>
              Example: {formatCurrency(2500)} sale → {formatCurrency(calculateApplicationFee(2500, feePercent))} fee
            </div>
          </Card>

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

        <div>
          <div
            className="text-[13px] font-bold uppercase tracking-[0.8px] mb-3"
            style={{ color: "var(--c-muted)" }}
          >
            Finance ledger · {initialLedger.length} entries
          </div>
          {initialLedger.length === 0 ? (
            <Card>
              <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
                {capability.status === "ready"
                  ? "No paid activity yet."
                  : "Ledger activity will appear here after Stripe setup is complete."}
              </p>
            </Card>
          ) : (
            <DataTable
              columns={[
                {
                  key: "description",
                  label: "Description",
                  render: (entry) => (
                    <>
                      <div className="font-semibold text-[13px]" style={{ color: "var(--c-text)" }}>{entry.title}</div>
                      <div className="text-[11.5px]" style={{ color: "var(--c-muted)" }}>{entry.status}</div>
                    </>
                  ),
                },
                { key: "type", label: "Type", render: (entry) => <Badge variant="info">{entry.type}</Badge> },
                {
                  key: "fee",
                  label: "Fee",
                  render: (entry) => (
                    <span style={{ fontSize: 13, color: "var(--c-muted)" }}>
                      {formatCurrency(entry.feeCents, entry.currency)}
                    </span>
                  ),
                },
                {
                  key: "amount",
                  label: "Amount",
                  render: (entry) => (
                    <span
                      className="font-semibold text-[13.5px]"
                      style={{ color: entry.amountCents >= 0 ? "oklch(45% 0.15 155)" : "oklch(45% 0.18 20)" }}
                    >
                      {formatCurrency(entry.amountCents, entry.currency)}
                    </span>
                  ),
                },
                {
                  key: "date",
                  label: "Date",
                  render: (entry) => (
                    <span style={{ fontSize: 12, color: "var(--c-muted)" }}>
                      {new Date(entry.occurredAt).toLocaleDateString()}
                    </span>
                  ),
                },
              ]}
              keyExtractor={(entry) => entry.id}
              rows={initialLedger}
            />
          )}
        </div>
      </div>

      <div>
        <div
          className="text-[13px] font-bold uppercase tracking-[0.8px] mb-3"
          style={{ color: "var(--c-muted)" }}
        >
          Refundable bookings · {initialRefundableBookings.length}
        </div>
        {!capability.canIssueRefunds && (
          <div
            className="mb-4 rounded-[10px] px-4 py-3 text-[13px]"
            style={{ background: "var(--c-bg2)", color: "var(--c-muted)" }}
          >
            {getRefundGateCopy()}
          </div>
        )}
        {initialRefundableBookings.length === 0 ? (
          <Card>
            <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
              No paid bookings available for refund.
            </p>
          </Card>
        ) : (
          <DataTable
            columns={[
              {
                key: "event",
                label: "Event",
                render: (booking) => (
                  <span style={{ fontWeight: 500, color: "var(--c-text)" }}>
                    {booking.events?.title ?? "Paid event"}
                  </span>
                ),
              },
              {
                key: "guest",
                label: "Guest",
                render: (booking) => (
                  <span style={{ color: "var(--c-muted)", fontSize: 13 }}>{booking.purchaser_name}</span>
                ),
              },
              {
                key: "amount",
                label: "Amount",
                render: (booking) => (
                  <span style={{ fontWeight: 600, color: "var(--c-text)" }}>
                    {formatCurrency(booking.total_price_cents, booking.currency)}
                  </span>
                ),
              },
              {
                key: "action",
                label: "Action",
                render: () => (
                  <Button
                    onClick={() => handleDemoAction("Refund previewed for demo.")}
                    size="sm"
                    type="button"
                    variant="ghost"
                    style={{ color: "oklch(45% 0.18 20)" }}
                  >
                    Full refund
                  </Button>
                ),
              },
            ]}
            keyExtractor={(booking) => booking.id}
            rows={initialRefundableBookings}
          />
        )}
      </div>
    </div>
  );
}
