import { z } from "zod";

import { VenueRoleSchema, VenueTypeSchema } from "./integrations";

export const TerminologyPreferencesSchema = z.object({
  menuLabel: z.string().trim().min(1).default("Tap List"),
  membershipLabel: z.string().trim().min(1).default("Club"),
});

export const VenueBrandingSchema = z.object({
  accentColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Use a hex color like #C96B2C")
    .default("#C96B2C"),
  secondaryAccentColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Use a hex color like #2E9F9A")
    .default("#2E9F9A"),
  displayTheme: z.enum(["light", "dark"]).default("light"),
  logoUrl: z.string().url().nullable().default(null),
  tagline: z.string().trim().nullable().default(null),
});

export const VenueSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  venueType: VenueTypeSchema,
  terminology: TerminologyPreferencesSchema,
  branding: VenueBrandingSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const VenueUserSchema = z.object({
  id: z.string().uuid(),
  venueId: z.string().uuid(),
  userId: z.string().uuid(),
  role: VenueRoleSchema,
});

export type TerminologyPreferences = z.infer<typeof TerminologyPreferencesSchema>;
export type Venue = z.infer<typeof VenueSchema>;
export type VenueBranding = z.infer<typeof VenueBrandingSchema>;
export type VenueUser = z.infer<typeof VenueUserSchema>;

export function resolveTerminology(
  overrides?: Partial<Pick<TerminologyPreferences, "menuLabel" | "membershipLabel">> | null,
) {
  return {
    menuLabel: overrides?.menuLabel?.trim() || "Tap List",
    membershipLabel: overrides?.membershipLabel?.trim() || "Club",
  };
}
