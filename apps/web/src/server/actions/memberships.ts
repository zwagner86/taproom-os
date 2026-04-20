"use server";

import { canResumeMembership } from "@taproom/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Database } from "../../../../../supabase/types";
import { getEnv } from "@/env";
import { getMembershipGateCopy } from "@/lib/venue-payment-capability";
import { slugify } from "@/lib/utils";
import { getPaymentsProvider } from "@/server/providers";
import {
  createMembershipAdmin,
  createMembershipPlanAdmin,
  getMembershipById,
  getMembershipPlanById,
  listPublicMembershipPlans,
  updateMembershipAdmin,
  updateMembershipPlanAdmin,
} from "@/server/repositories/memberships";
import { getStripeConnectionForVenue } from "@/server/repositories/providers";
import { requireVenueAccess } from "@/server/repositories/venues";
import { sendEmailFirstNotification } from "@/server/services/notifications";
import { getVenuePaymentCapability } from "@/server/services/payment-capability";

type MembershipPlanInsert = Database["public"]["Tables"]["membership_plans"]["Insert"];
type MembershipPlanUpdate = Database["public"]["Tables"]["membership_plans"]["Update"];

export async function createMembershipPlanAction(venueSlug: string, formData: FormData) {
  const access = await requireVenueAccess(venueSlug);
  const capability = await getVenuePaymentCapability(access.venue.id);
  const { payload, warning } = buildCreatePlanPayload(access.venue.id, formData, capability.canSellMemberships);

  try {
    await createMembershipPlanAdmin(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create membership plan.";
    redirect(`/app/${venueSlug}/memberships?error=${encodeURIComponent(message)}`);
  }

  revalidateMembershipPaths(venueSlug);
  redirect(`/app/${venueSlug}/memberships?message=${encodeURIComponent(warning ?? "Membership plan created.")}`);
}

export async function updateMembershipPlanAction(venueSlug: string, formData: FormData) {
  const access = await requireVenueAccess(venueSlug);
  const planId = String(formData.get("plan_id") ?? "");
  const capability = await getVenuePaymentCapability(access.venue.id);
  const existing = await getMembershipPlanById(access.venue.id, planId);

  if (!existing) {
    redirect(`/app/${venueSlug}/memberships?error=${encodeURIComponent("Membership plan not found.")}`);
  }

  const { payload, warning } = buildPlanPayload(formData, capability.canSellMemberships, existing.active, true);

  try {
    await updateMembershipPlanAdmin(access.venue.id, planId, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save membership plan.";
    redirect(`/app/${venueSlug}/memberships?error=${encodeURIComponent(message)}`);
  }

  revalidateMembershipPaths(venueSlug);
  redirect(`/app/${venueSlug}/memberships?message=${encodeURIComponent(warning ?? "Membership plan updated.")}`);
}

export async function startMembershipCheckoutAction(venueSlug: string, planId: string, formData: FormData) {
  const { plans, venue } = await listPublicMembershipPlans(venueSlug);
  const plan = plans.find((entry) => entry.id === planId);

  if (!plan || !venue) {
    redirect(`/v/${venueSlug}/memberships?error=${encodeURIComponent("Membership plan not found.")}`);
  }

  const capability = await getVenuePaymentCapability(venue.id);
  const connection = await getStripeConnectionForVenue(venue.id);

  if (!capability.canSellMemberships) {
    redirect(`/v/${venueSlug}/memberships?error=${encodeURIComponent(getMembershipGateCopy())}`);
  }

  if (!connection?.stripe_account_id) {
    redirect(`/v/${venueSlug}/memberships?error=${encodeURIComponent(getMembershipGateCopy())}`);
  }

  let resolvedPlan = plan;

  if (!plan.stripe_product_id || !plan.stripe_price_id) {
    const price = await getPaymentsProvider().ensureMembershipPlanPrice({
      amountCents: plan.price_cents,
      connectedAccountId: connection.stripe_account_id,
      currency: plan.currency,
      description: plan.description,
      interval: plan.billing_interval,
      name: plan.name,
    });

    resolvedPlan = await updateMembershipPlanAdmin(venue.id, plan.id, {
      stripe_price_id: price.priceId,
      stripe_product_id: price.productId,
    });
  }

  const membership = await createMembershipAdmin({
    billing_interval: resolvedPlan.billing_interval,
    cancel_at_period_end: false,
    currency: resolvedPlan.currency,
    member_email: normalizeOptionalString(formData.get("member_email")),
    member_name: String(formData.get("member_name") ?? "").trim(),
    member_phone: normalizeOptionalString(formData.get("member_phone")),
    membership_plan_id: resolvedPlan.id,
    plan_name_snapshot: resolvedPlan.name,
    price_cents: resolvedPlan.price_cents,
    status: "pending",
    venue_id: venue.id,
  });

  try {
    const session = await getPaymentsProvider().createMembershipCheckoutSession({
      amountCents: resolvedPlan.price_cents,
      applicationFeePercent: getEnv().STRIPE_APPLICATION_FEE_PERCENT,
      cancelUrl: `${getEnv().NEXT_PUBLIC_APP_URL}/v/${venueSlug}/memberships?checkout=cancel`,
      connectedAccountId: connection.stripe_account_id,
      currency: resolvedPlan.currency,
      customerEmail: membership.member_email ?? undefined,
      lineItemName: resolvedPlan.name,
      metadata: {
        membership_id: membership.id,
        membership_plan_id: resolvedPlan.id,
        venue_id: venue.id,
        venue_slug: venueSlug,
      },
      recurringInterval: resolvedPlan.billing_interval,
      stripePriceId: resolvedPlan.stripe_price_id ?? undefined,
      successUrl: `${getEnv().NEXT_PUBLIC_APP_URL}/v/${venueSlug}/memberships?checkout=success`,
      venueId: venue.id,
      venueName: venue.name,
    });

    redirect(session.checkoutUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start membership checkout.";
    redirect(`/v/${venueSlug}/memberships?error=${encodeURIComponent(message)}`);
  }
}

export async function cancelMembershipAction(venueSlug: string, membershipId: string) {
  const access = await requireVenueAccess(venueSlug);
  const connection = await getStripeConnectionForVenue(access.venue.id);
  const membership = await getMembershipById(access.venue.id, membershipId);

  if (!connection?.stripe_account_id || !membership?.stripe_subscription_id) {
    redirect(`/app/${venueSlug}/memberships?error=${encodeURIComponent("Membership cannot be cancelled from the app yet.")}`);
  }

  try {
    const result = await getPaymentsProvider().cancelMembership(
      connection.stripe_account_id,
      membership.stripe_subscription_id,
    );

    await updateMembershipAdmin(membership.id, {
      cancel_at_period_end: result.cancelAtPeriodEnd,
      cancelled_at: result.cancelledAt,
      current_period_end: result.currentPeriodEnd,
      ended_at: result.endedAt,
      status: result.status,
    });

    if (membership.member_email) {
      await sendEmailFirstNotification({
        contextId: membership.id,
        contextType: "membership",
        email: membership.member_email,
        emailBody: `${access.venue.name} scheduled your membership to end at the close of the current billing period.`,
        subject: `${access.venue.membership_label} cancellation scheduled`,
        templateKey: "membership_cancelled",
        venueId: access.venue.id,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to cancel membership.";
    redirect(`/app/${venueSlug}/memberships?error=${encodeURIComponent(message)}`);
  }

  revalidateMembershipPaths(venueSlug);
  redirect(`/app/${venueSlug}/memberships?message=${encodeURIComponent("Membership scheduled to cancel at period end.")}`);
}

export async function resumeMembershipAction(venueSlug: string, membershipId: string) {
  const access = await requireVenueAccess(venueSlug);
  const connection = await getStripeConnectionForVenue(access.venue.id);
  const membership = await getMembershipById(access.venue.id, membershipId);

  if (!membership || !canResumeMembership({
    cancelAtPeriodEnd: membership.cancel_at_period_end,
    endedAt: membership.ended_at,
    status: membership.status as "active" | "pending" | "past_due" | "cancelled",
  })) {
    redirect(`/app/${venueSlug}/memberships?error=${encodeURIComponent("That membership cannot be resumed.")}`);
  }

  if (!connection?.stripe_account_id || !membership.stripe_subscription_id) {
    redirect(`/app/${venueSlug}/memberships?error=${encodeURIComponent("Membership cannot be resumed from the app yet.")}`);
  }

  try {
    const result = await getPaymentsProvider().resumeMembership(
      connection.stripe_account_id,
      membership.stripe_subscription_id,
    );

    await updateMembershipAdmin(membership.id, {
      cancel_at_period_end: result.cancelAtPeriodEnd,
      cancelled_at: result.cancelledAt,
      current_period_end: result.currentPeriodEnd,
      ended_at: result.endedAt,
      status: result.status,
    });

    if (membership.member_email) {
      await sendEmailFirstNotification({
        contextId: membership.id,
        contextType: "membership",
        email: membership.member_email,
        emailBody: `${access.venue.name} resumed your membership and it will now continue renewing automatically.`,
        subject: `${access.venue.membership_label} resumed`,
        templateKey: "membership_resumed",
        venueId: access.venue.id,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resume membership.";
    redirect(`/app/${venueSlug}/memberships?error=${encodeURIComponent(message)}`);
  }

  revalidateMembershipPaths(venueSlug);
  redirect(`/app/${venueSlug}/memberships?message=${encodeURIComponent("Membership resumed.")}`);
}

function buildCreatePlanPayload(venueId: string, formData: FormData, canSellMemberships: boolean) {
  const payload = buildCreateMembershipPlanInsert(venueId, formData);
  const blockedFromActivatingPlan = payload.active && !canSellMemberships;

  return {
    payload: {
      ...payload,
      active: blockedFromActivatingPlan ? false : payload.active,
    } satisfies MembershipPlanInsert,
    warning: blockedFromActivatingPlan
      ? `${getMembershipGateCopy()} This plan was saved as a draft.`
      : null,
  };
}

function buildCreateMembershipPlanInsert(venueId: string, formData: FormData): MembershipPlanInsert {
  const name = String(formData.get("name") ?? "").trim();

  return {
    active: String(formData.get("active") ?? "on") === "on",
    billing_interval: String(formData.get("billing_interval") ?? "month") as MembershipPlanInsert["billing_interval"],
    currency: String(formData.get("currency") ?? "USD").trim().toUpperCase() || "USD",
    description: normalizeOptionalString(formData.get("description")),
    name,
    price_cents: parseOptionalInteger(formData.get("price_cents")) ?? 0,
    slug: slugify(String(formData.get("slug") ?? name)),
    venue_id: venueId,
  };
}

function buildPlanPayload(
  formData: FormData,
  canSellMemberships: boolean,
  wasActive: boolean,
  isUpdate = false,
) {
  const name = String(formData.get("name") ?? "").trim();
  const requestedActive = String(formData.get("active") ?? (isUpdate ? "off" : "on")) === "on";
  const blockedFromActivatingPlan = !wasActive && requestedActive && !canSellMemberships;

  return {
    payload: {
      active: blockedFromActivatingPlan ? false : requestedActive,
      billing_interval: String(formData.get("billing_interval") ?? "month") as MembershipPlanInsert["billing_interval"],
      currency: String(formData.get("currency") ?? "USD").trim().toUpperCase() || "USD",
      description: normalizeOptionalString(formData.get("description")),
      name,
      price_cents: parseOptionalInteger(formData.get("price_cents")) ?? 0,
      slug: slugify(String(formData.get("slug") ?? name)),
    } satisfies MembershipPlanUpdate,
    warning: blockedFromActivatingPlan
      ? `${getMembershipGateCopy()} This plan remains in draft until billing is ready.`
      : null,
  };
}

function normalizeOptionalString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function parseOptionalInteger(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function revalidateMembershipPaths(venueSlug: string) {
  revalidatePath(`/app/${venueSlug}/memberships`);
  revalidatePath(`/app/${venueSlug}/billing`);
  revalidatePath(`/v/${venueSlug}/memberships`);
}
