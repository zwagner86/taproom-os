"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { sendBroadcast, sendEmailFirstNotification } from "@/server/services/notifications";
import { upsertFollowerAdmin } from "@/server/repositories/followers";
import { getVenueBySlug, requireVenueAccess } from "@/server/repositories/venues";

export async function createFollowerAction(venueSlug: string, returnPath: string, formData: FormData) {
  const venue = await getVenueBySlug(venueSlug);

  if (!venue) {
    redirect(`${returnPath}?error=${encodeURIComponent("Venue not found.")}`);
  }

  const email = normalizeOptionalString(formData.get("email"));
  const phone = normalizeOptionalString(formData.get("phone"));
  const channelPreferences = [
    email ? "email" : null,
    String(formData.get("sms_opt_in") ?? "off") === "on" && phone ? "sms" : null,
  ].filter((value): value is "email" | "sms" => value === "email" || value === "sms");

  if (!email && !phone) {
    redirect(`${returnPath}?error=${encodeURIComponent("Add an email or phone number to follow this venue.")}`);
  }

  try {
    const follower = await upsertFollowerAdmin({
      channel_preferences: channelPreferences,
      email,
      phone,
      venue_id: venue.id,
    });

    await sendEmailFirstNotification({
      contextId: follower.id,
      contextType: "follower",
      email,
      emailBody: `You’re subscribed to updates from ${venue.name}. TaproomOS will keep confirmations simple and only use SMS when you explicitly opted in.`,
      phone,
      smsBody: `${venue.name}: you're subscribed to updates.`,
      smsOptIn: channelPreferences.includes("sms"),
      subject: `${venue.name} follow confirmed`,
      templateKey: "follow_confirmation",
      venueId: venue.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save your follow.";
    redirect(`${returnPath}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/app/${venueSlug}/followers`);
  revalidatePath(`/app/${venueSlug}/notifications`);
  redirect(`${returnPath}?message=${encodeURIComponent("You’re subscribed to venue updates.")}`);
}

export async function sendBroadcastAction(venueSlug: string, formData: FormData) {
  const access = await requireVenueAccess(venueSlug);
  const channel = String(formData.get("channel") ?? "email") as "email" | "sms";
  const subject = normalizeOptionalString(formData.get("subject"));
  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    redirect(`/app/${venueSlug}/notifications?error=${encodeURIComponent("Add a message before sending.")}`);
  }

  try {
    const result = await sendBroadcast({
      body,
      channel,
      subject,
      venueId: access.venue.id,
    });

    revalidatePath(`/app/${venueSlug}/notifications`);
    redirect(
      `/app/${venueSlug}/notifications?message=${encodeURIComponent(`Broadcast sent to ${result.sentCount} recipients.`)}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send broadcast.";
    redirect(`/app/${venueSlug}/notifications?error=${encodeURIComponent(message)}`);
  }
}

function normalizeOptionalString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}
