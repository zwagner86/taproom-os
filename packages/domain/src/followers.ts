import { z } from "zod";

import { NotificationChannelSchema } from "./integrations";

export const FollowerSchema = z.object({
  id: z.string().uuid(),
  venueId: z.string().uuid(),
  email: z.string().email().nullable().default(null),
  phone: z.string().trim().nullable().default(null),
  channelPreferences: z.array(NotificationChannelSchema).default([]),
  active: z.boolean().default(true),
  consentedAt: z.string().datetime(),
});

export const BroadcastSendSchema = z.object({
  venueId: z.string().uuid(),
  channel: NotificationChannelSchema,
  subject: z.string().trim().nullable().default(null),
  body: z.string().trim().min(1),
});

export type Follower = z.infer<typeof FollowerSchema>;
export type BroadcastSend = z.infer<typeof BroadcastSendSchema>;

export function followerPrefersChannel(
  follower: Pick<Follower, "active" | "channelPreferences">,
  channel: "email" | "sms",
) {
  return follower.active && follower.channelPreferences.includes(channel);
}
