import { z } from "zod";

export const notificationChannels = ["email", "sms"] as const;
export const billingIntervals = ["month", "quarter", "year"] as const;
export const venueRoles = ["owner", "admin", "staff"] as const;
export const venueTypes = ["brewery", "cidery", "meadery", "distillery", "taproom"] as const;

export const NotificationChannelSchema = z.enum(notificationChannels);
export const BillingIntervalSchema = z.enum(billingIntervals);
export const VenueRoleSchema = z.enum(venueRoles);
export const VenueTypeSchema = z.enum(venueTypes);

export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;
export type BillingInterval = z.infer<typeof BillingIntervalSchema>;
export type VenueRole = z.infer<typeof VenueRoleSchema>;
export type VenueType = z.infer<typeof VenueTypeSchema>;

