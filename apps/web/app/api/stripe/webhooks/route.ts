import { NextResponse } from "next/server";

import { isDemoVenueId } from "@/lib/demo-venue";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getPaymentsProvider } from "@/server/providers";
import {
  getEventBookingByChargeIdAdmin,
  getEventBookingByIdAdmin,
  getVenueEventByIdAdmin,
  updateEventBookingAdmin,
} from "@/server/repositories/events";
import {
  getMembershipByIdAdmin,
  getMembershipBySubscriptionIdAdmin,
  updateMembershipAdmin,
} from "@/server/repositories/memberships";
import {
  getStripeConnectionByAccountIdAdmin,
  markProviderWebhookProcessedAdmin,
  recordProviderWebhookEventAdmin,
} from "@/server/repositories/providers";
import { sendEmailFirstNotification } from "@/server/services/notifications";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event: any;

  try {
    event = await getPaymentsProvider().verifyWebhook(payload, signature);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify Stripe webhook.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const accountId = typeof event.account === "string" ? event.account : null;
  const connection = accountId ? await getStripeConnectionByAccountIdAdmin(accountId) : null;

  if (isDemoVenueId(connection?.venue_id)) {
    return NextResponse.json({ ignored: true, received: true });
  }

  const webhookEvent = await recordProviderWebhookEventAdmin({
    eventType: event.type,
    payload: JSON.parse(payload),
    provider: "stripe",
    providerEventId: event.id,
    venueId: connection?.venue_id ?? null,
  });

  if (!webhookEvent) {
    return NextResponse.json({ duplicate: true, received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const metadata = session.metadata ?? {};

        if (session.mode === "payment" && metadata.booking_id) {
          const booking = await getEventBookingByIdAdmin(String(metadata.booking_id));

          if (booking) {
            const chargeId =
              accountId && typeof session.payment_intent === "string"
                ? await getPaymentsProvider().getPaymentIntentChargeId(accountId, session.payment_intent)
                : null;
            const eventRecord = await getVenueEventByIdAdmin(booking.event_id);

            await updateEventBookingAdmin(booking.id, {
              booking_status: "confirmed",
              confirmed_at: new Date().toISOString(),
              payment_status: "paid",
              stripe_charge_id: chargeId,
              stripe_checkout_session_id: session.id,
              stripe_payment_intent_id:
                typeof session.payment_intent === "string" ? session.payment_intent : booking.stripe_payment_intent_id,
            });

            if (booking.purchaser_email) {
              await sendEmailFirstNotification({
                contextId: booking.id,
                contextType: "event_booking",
                email: booking.purchaser_email,
                emailBody: `Your booking for ${eventRecord?.title ?? "the event"} is confirmed. Party size: ${booking.party_size}.`,
                subject: `Booking confirmed${eventRecord?.title ? ` for ${eventRecord.title}` : ""}`,
                templateKey: "event_paid_confirmation",
                venueId: booking.venue_id,
              });
            }
          }
        }

        if (session.mode === "subscription" && metadata.membership_id) {
          const membership = await getMembershipByIdAdmin(String(metadata.membership_id));

          if (membership) {
            await updateMembershipAdmin(membership.id, {
              status: "active",
              stripe_customer_id: typeof session.customer === "string" ? session.customer : membership.stripe_customer_id,
              stripe_subscription_id:
                typeof session.subscription === "string"
                  ? session.subscription
                  : membership.stripe_subscription_id,
            });

            if (membership.member_email) {
              await sendEmailFirstNotification({
                contextId: membership.id,
                contextType: "membership",
                email: membership.member_email,
                emailBody: `Your membership is now active. We'll keep renewal and lifecycle updates simple from here.`,
                subject: "Membership confirmed",
                templateKey: "membership_confirmation",
                venueId: membership.venue_id,
              });
            }
          }
        }

        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const metadata = subscription.metadata ?? {};
        const membership = metadata.membership_id
          ? await getMembershipByIdAdmin(String(metadata.membership_id))
          : await getMembershipBySubscriptionIdAdmin(subscription.id);

        if (membership) {
          const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
            : null;
          const mappedStatus =
            subscription.status === "active"
              ? "active"
              : subscription.status === "past_due"
                ? "past_due"
                : subscription.status === "canceled"
                  ? "cancelled"
                  : "pending";

          await updateMembershipAdmin(membership.id, {
            cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
            cancelled_at: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000).toISOString()
              : null,
            current_period_end: currentPeriodEnd,
            ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
            status: mappedStatus,
            stripe_customer_id:
              typeof subscription.customer === "string" ? subscription.customer : membership.stripe_customer_id,
            stripe_subscription_id: subscription.id,
          });
        }

        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        const booking = await getEventBookingByChargeIdAdmin(charge.id);

        if (booking) {
          await updateEventBookingAdmin(booking.id, {
            booking_status: "cancelled",
            cancelled_at: new Date().toISOString(),
            payment_status: "refunded",
            refunded_amount_cents: charge.amount_refunded ?? booking.total_price_cents,
          });

          if (booking.purchaser_email) {
            await sendEmailFirstNotification({
              contextId: booking.id,
              contextType: "event_booking",
              email: booking.purchaser_email,
              emailBody: `A full refund was processed for your event booking.`,
              subject: "Event refund processed",
              templateKey: "event_refund",
              venueId: booking.venue_id,
            });
          }
        }

        break;
      }
      case "account.updated": {
        const account = event.data.object;

        if (accountId) {
          const supabase = await createAdminSupabaseClient();
          await supabase
            .from("stripe_connections")
            .update({
              charges_enabled: Boolean(account.charges_enabled),
              details_submitted: Boolean(account.details_submitted),
              last_synced_at: new Date().toISOString(),
              status: account.charges_enabled && account.details_submitted ? "active" : "pending",
            })
            .eq("stripe_account_id", accountId);
        }

        break;
      }
      default:
        break;
    }

    await markProviderWebhookProcessedAdmin(webhookEvent.id);
    return NextResponse.json({ received: true });
  } catch (processingError) {
    const message = processingError instanceof Error ? processingError.message : "Unable to process Stripe webhook.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
