import { z } from "zod";

export const financeEntryTypes = ["event_booking", "membership", "refund"] as const;
export const FinanceEntryTypeSchema = z.enum(financeEntryTypes);

export const FinanceLedgerEntrySchema = z.object({
  id: z.string().min(1),
  venueId: z.string().uuid(),
  type: FinanceEntryTypeSchema,
  occurredAt: z.string().datetime(),
  title: z.string().min(1),
  amountCents: z.number().int(),
  currency: z.string().length(3).default("USD"),
  feeCents: z.number().int().nonnegative().default(0),
  status: z.string().min(1),
  contextId: z.string().uuid().nullable().default(null),
  contextType: z.string().min(1),
});

export type FinanceLedgerEntry = z.infer<typeof FinanceLedgerEntrySchema>;
export type FinanceEntryType = z.infer<typeof FinanceEntryTypeSchema>;
