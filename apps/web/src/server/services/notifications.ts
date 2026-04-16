import type { NotificationChannel } from "@taproom/domain";

import { getEmailNotificationProvider, getSmsNotificationProvider } from "@/server/providers";
import { listVenueFollowersAdmin } from "@/server/repositories/followers";
import { insertNotificationLogAdmin } from "@/server/repositories/notifications";

const BROADCAST_CAP = 100;

type NotificationContext = {
  venueId: string;
  recipient: string;
  channel: NotificationChannel;
  templateKey: string;
  subject?: string | null;
  body: string;
  contextType?: string | null;
  contextId?: string | null;
};

export async function sendNotification(input: NotificationContext) {
  const provider = input.channel === "email" ? getEmailNotificationProvider() : getSmsNotificationProvider();

  try {
    const receipt = await provider.send({
      body: input.body,
      channel: input.channel,
      recipient: input.recipient,
      subject: input.subject ?? undefined,
      templateKey: input.templateKey,
      venueId: input.venueId,
    });

    await insertNotificationLogAdmin({
      channel: input.channel,
      context_id: input.contextId ?? null,
      context_type: input.contextType ?? null,
      error_message: null,
      provider: receipt.provider,
      provider_message_id: receipt.providerMessageId,
      recipient: input.recipient,
      sent_at: new Date().toISOString(),
      status: receipt.status,
      subject: input.subject ?? null,
      template_key: input.templateKey,
      venue_id: input.venueId,
    });

    return receipt;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send notification.";
    await insertNotificationLogAdmin({
      channel: input.channel,
      context_id: input.contextId ?? null,
      context_type: input.contextType ?? null,
      error_message: message,
      provider: provider.channel === "email" ? "email-provider" : "sms-provider",
      provider_message_id: null,
      recipient: input.recipient,
      sent_at: null,
      status: "failed",
      subject: input.subject ?? null,
      template_key: input.templateKey,
      venue_id: input.venueId,
    });
    throw error;
  }
}

export async function sendEmailFirstNotification(input: {
  venueId: string;
  email?: string | null;
  phone?: string | null;
  smsOptIn?: boolean;
  templateKey: string;
  subject: string;
  emailBody: string;
  smsBody?: string;
  contextType?: string | null;
  contextId?: string | null;
}) {
  if (input.email) {
    await sendNotification({
      body: input.emailBody,
      channel: "email",
      contextId: input.contextId,
      contextType: input.contextType,
      recipient: input.email,
      subject: input.subject,
      templateKey: input.templateKey,
      venueId: input.venueId,
    });
  }

  if (input.smsOptIn && input.phone) {
    await sendNotification({
      body: input.smsBody ?? input.emailBody,
      channel: "sms",
      contextId: input.contextId,
      contextType: input.contextType,
      recipient: input.phone,
      subject: null,
      templateKey: input.templateKey,
      venueId: input.venueId,
    });
  }
}

export async function sendBroadcast(input: {
  venueId: string;
  channel: NotificationChannel;
  subject?: string | null;
  body: string;
}) {
  const followers = await listVenueFollowersAdmin(input.venueId);
  const recipients = new Map<string, { email: string | null; phone: string | null }>();

  for (const follower of followers) {
    const preferences = Array.isArray(follower.channel_preferences)
      ? follower.channel_preferences.filter(
          (value: unknown): value is NotificationChannel => value === "email" || value === "sms",
        )
      : [];

    if (!preferences.includes(input.channel)) {
      continue;
    }

    const recipient = input.channel === "email" ? follower.email : follower.phone;

    if (!recipient) {
      continue;
    }

    recipients.set(recipient, {
      email: follower.email,
      phone: follower.phone,
    });
  }

  if (recipients.size > BROADCAST_CAP) {
    throw new Error(
      `Broadcast size exceeds the MVP cap of ${BROADCAST_CAP} recipients. Narrow the audience or send in smaller batches.`,
    );
  }

  let sentCount = 0;

  for (const recipient of recipients.keys()) {
    await sendNotification({
      body: input.body,
      channel: input.channel,
      contextType: "broadcast",
      recipient,
      subject: input.channel === "email" ? input.subject ?? "TaproomOS update" : null,
      templateKey: "broadcast",
      venueId: input.venueId,
    });
    sentCount += 1;
  }

  return {
    cap: BROADCAST_CAP,
    recipientCount: recipients.size,
    sentCount,
  };
}
