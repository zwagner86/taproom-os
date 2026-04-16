import { z } from "zod";

import { NotificationChannelSchema } from "./integrations";

export const NotificationLogSchema = z.object({
  id: z.string().uuid(),
  venueId: z.string().uuid(),
  recipient: z.string().min(1),
  channel: NotificationChannelSchema,
  templateKey: z.string().min(1),
  provider: z.string().min(1),
  providerMessageId: z.string().nullable().default(null),
  status: z.string().min(1),
  contextType: z.string().nullable().default(null),
  contextId: z.string().nullable().default(null),
  subject: z.string().nullable().default(null),
  errorMessage: z.string().nullable().default(null),
  sentAt: z.string().datetime().nullable().default(null),
  createdAt: z.string().datetime(),
});

export type NotificationLog = z.infer<typeof NotificationLogSchema>;
