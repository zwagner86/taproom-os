import { z } from "zod";

import { BillingIntervalSchema } from "./integrations";

export const membershipStatuses = ["pending", "active", "past_due", "cancelled"] as const;
export const MembershipStatusSchema = z.enum(membershipStatuses);

export const MembershipPlanSchema = z.object({
  id: z.string().uuid(),
  venueId: z.string().uuid(),
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().nullable().default(null),
  billingInterval: BillingIntervalSchema,
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3).default("USD"),
  active: z.boolean().default(true),
});

export const MembershipSchema = z.object({
  id: z.string().uuid(),
  venueId: z.string().uuid(),
  membershipPlanId: z.string().uuid(),
  memberName: z.string().trim().min(1),
  memberEmail: z.string().email().nullable().default(null),
  memberPhone: z.string().trim().nullable().default(null),
  status: MembershipStatusSchema.default("pending"),
  planNameSnapshot: z.string().trim().nullable().default(null),
  billingInterval: BillingIntervalSchema.nullable().default(null),
  priceCents: z.number().int().nonnegative().nullable().default(null),
  currency: z.string().length(3).default("USD"),
  currentPeriodEnd: z.string().datetime().nullable().default(null),
  cancelAtPeriodEnd: z.boolean().default(false),
  cancelledAt: z.string().datetime().nullable().default(null),
  endedAt: z.string().datetime().nullable().default(null),
});

export type MembershipPlan = z.infer<typeof MembershipPlanSchema>;
export type Membership = z.infer<typeof MembershipSchema>;
export type MembershipStatus = z.infer<typeof MembershipStatusSchema>;

export function canResumeMembership(membership: Pick<Membership, "status" | "cancelAtPeriodEnd" | "endedAt">) {
  return membership.status === "active" && membership.cancelAtPeriodEnd && membership.endedAt === null;
}
