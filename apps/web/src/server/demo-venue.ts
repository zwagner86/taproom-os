import { redirect } from "next/navigation";

import {
  DEMO_MODE_DETAIL,
  DEMO_MODE_MESSAGE,
  isDemoVenueId,
  isDemoVenueRecord,
  isDemoVenueSlug,
} from "@/lib/demo-venue";

export { DEMO_MODE_DETAIL, DEMO_MODE_MESSAGE } from "@/lib/demo-venue";

export function getDemoVenueFormState<T extends { error?: string; message?: string } | null>(
  param: "error" | "message" = "error",
) {
  return { [param]: DEMO_MODE_MESSAGE } as T;
}

export function redirectForDemoVenue(pathname: string, param: "error" | "message" = "error"): never {
  redirect(withDemoVenueNotice(pathname, param));
}

export function withDemoVenueNotice(pathname: string, param: "error" | "message" = "error") {
  const safePathname = String(pathname ?? "");
  const [pathPart = "", hash = ""] = safePathname.split("#", 2);
  const [basePath = "", query = ""] = pathPart.split("?", 2);
  const searchParams = new URLSearchParams(query);
  searchParams.set(param, DEMO_MODE_MESSAGE);

  const resolvedQuery = searchParams.toString();
  return `${basePath}${resolvedQuery ? `?${resolvedQuery}` : ""}${hash ? `#${hash}` : ""}`;
}

export function isDemoVenue(value: {
  id?: string | null;
  slug?: string | null;
}) {
  return isDemoVenueRecord(value);
}

export function isDemoVenueKey(params: { venueId?: string | null; venueSlug?: string | null }) {
  return isDemoVenueId(params.venueId) || isDemoVenueSlug(params.venueSlug);
}
