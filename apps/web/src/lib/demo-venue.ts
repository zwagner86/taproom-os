export const DEMO_VENUE_SLUG = "demo-taproom";
export const DEMO_VENUE_ID = "11111111-1111-1111-1111-111111111111";
export const DEMO_MODE_MESSAGE = "Demo mode is active. Changes stay in this tab and are not saved.";
export const DEMO_MODE_DETAIL = "Changes stay in this tab only and reset on refresh.";

type VenueLike =
  | {
      id?: string | null;
      slug?: string | null;
    }
  | null
  | undefined;

export function isDemoVenueSlug(slug: string | null | undefined) {
  return String(slug ?? "").trim().toLowerCase() === DEMO_VENUE_SLUG;
}

export function isDemoVenueId(id: string | null | undefined) {
  return String(id ?? "").trim() === DEMO_VENUE_ID;
}

export function isDemoVenueRecord(venue: VenueLike) {
  return isDemoVenueId(venue?.id) || isDemoVenueSlug(venue?.slug);
}
