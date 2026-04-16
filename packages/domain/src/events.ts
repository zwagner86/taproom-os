import { z } from "zod";

export const bookingStatuses = ["pending", "confirmed", "cancelled"] as const;
export const paymentStatuses = ["unpaid", "paid", "refunded"] as const;
export const eventStatuses = ["draft", "published", "archived", "cancelled"] as const;

export const BookingStatusSchema = z.enum(bookingStatuses);
export const PaymentStatusSchema = z.enum(paymentStatuses);
export const EventStatusSchema = z.enum(eventStatuses);

export const EventSchema = z.object({
  id: z.string().uuid(),
  venueId: z.string().uuid(),
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().nullable().default(null),
  imageUrl: z.string().url().nullable().default(null),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().nullable().default(null),
  capacity: z.number().int().positive().nullable().default(null),
  priceCents: z.number().int().nonnegative().nullable().default(null),
  currency: z.string().length(3).default("USD"),
  status: EventStatusSchema.default("draft"),
  published: z.boolean().default(false),
});

export const EventBookingSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  venueId: z.string().uuid(),
  purchaserName: z.string().trim().min(1),
  purchaserEmail: z.string().email().nullable().default(null),
  purchaserPhone: z.string().trim().nullable().default(null),
  partySize: z.number().int().positive(),
  checkedInCount: z.number().int().nonnegative().default(0),
  unitPriceCents: z.number().int().nonnegative().default(0),
  totalPriceCents: z.number().int().nonnegative().default(0),
  currency: z.string().length(3).default("USD"),
  paymentStatus: PaymentStatusSchema.default("unpaid"),
  bookingStatus: BookingStatusSchema.default("pending"),
  stripeChargeId: z.string().trim().nullable().default(null),
  refundedAmountCents: z.number().int().nonnegative().default(0),
  confirmedAt: z.string().datetime().nullable().default(null),
  cancelledAt: z.string().datetime().nullable().default(null),
});

export type Event = z.infer<typeof EventSchema>;
export type EventBooking = z.infer<typeof EventBookingSchema>;
export type BookingStatus = z.infer<typeof BookingStatusSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type EventStatus = z.infer<typeof EventStatusSchema>;

export function hasCapacityRemaining(capacity: number | null, booked: number, requested: number) {
  if (capacity === null) {
    return true;
  }

  return booked + requested <= capacity;
}

export function calculateEventBookingTotal(unitPriceCents: number, partySize: number) {
  return unitPriceCents * partySize;
}

export function getPublicEventState(status: EventStatus, published: boolean) {
  if (status === "published" && published) {
    return "public";
  }

  return "private";
}
