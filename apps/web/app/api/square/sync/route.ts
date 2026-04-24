import { NextResponse } from "next/server";

import { DEMO_VENUE_ID } from "@/lib/demo-venue";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEMO_MODE_MESSAGE } from "@/server/demo-venue";
import { getCatalogProvider } from "@/server/providers";
import { listVenueItems } from "@/server/repositories/items";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { venueId?: string };
  const venueId = body.venueId;

  if (!venueId) {
    return NextResponse.json({ error: "venueId is required" }, { status: 400 });
  }

  if (venueId === DEMO_VENUE_ID) {
    return NextResponse.json({ error: DEMO_MODE_MESSAGE }, { status: 403 });
  }

  const { data: membership } = await supabase
    .from("venue_users")
    .select("id")
    .eq("venue_id", venueId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await listVenueItems(venueId);
  const linkedItems = items
    .filter((item) => item.item_external_links[0]?.external_id)
    .map((item) => ({
      externalId: item.item_external_links[0]?.external_id ?? undefined,
      itemId: item.id,
      itemType: item.type,
      priceSource: item.price_source,
    }));

  const result = await getCatalogProvider().syncItems(venueId, linkedItems);

  for (const snapshot of result.snapshots ?? []) {
    await supabase
      .from("item_external_links")
      .update({
        availability_snapshot: snapshot.availabilitySnapshot,
        price_snapshot_cents: snapshot.priceSnapshotCents,
        price_snapshot_currency: snapshot.priceSnapshotCurrency,
        synced_at: new Date().toISOString(),
      })
      .eq("venue_id", venueId)
      .eq("provider", "square")
      .eq("external_id", snapshot.externalId);
  }

  return NextResponse.json(result);
}
