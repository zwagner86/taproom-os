"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirectForDemoVenue } from "@/server/demo-venue";
import { getCatalogProvider, getPaymentsProvider } from "@/server/providers";
import { listVenueItems } from "@/server/repositories/items";
import { requireVenueAccess } from "@/server/repositories/venues";

export async function startStripeConnectAction(venueSlug: string) {
  const access = await requireVenueAccess(venueSlug);

  if (access.isDemoVenue) {
    redirectForDemoVenue(`/app/${venueSlug}/billing`);
  }

  const response = await getPaymentsProvider().getConnectUrl({
    returnUrl: `/app/${venueSlug}/billing`,
    venueId: access.venue.id,
    venueName: access.venue.name,
  });

  redirect(response.url);
}

export async function startSquareConnectAction(venueSlug: string) {
  const access = await requireVenueAccess(venueSlug);

  if (access.isDemoVenue) {
    redirectForDemoVenue(`/app/${venueSlug}/integrations/square`);
  }

  const response = await getCatalogProvider().getConnectUrl({
    returnUrl: `/app/${venueSlug}/integrations/square`,
    venueId: access.venue.id,
    venueName: access.venue.name,
  });

  redirect(response.url);
}

export async function linkSquareItemAction(venueSlug: string, formData: FormData) {
  const access = await requireVenueAccess(venueSlug);

  if (access.isDemoVenue) {
    redirectForDemoVenue(`/app/${venueSlug}/integrations/square`);
  }

  const supabase = await createServerSupabaseClient();
  const itemId = String(formData.get("item_id") ?? "");
  const externalId = String(formData.get("external_id") ?? "").trim();

  if (!externalId) {
    redirect(`/app/${venueSlug}/integrations/square?error=${encodeURIComponent("Pick a Square item to link.")}`);
  }

  const { error } = await supabase.from("item_external_links").upsert(
    {
      external_id: externalId,
      item_id: itemId,
      provider: "square",
      venue_id: access.venue.id,
    },
    {
      onConflict: "item_id,provider",
    },
  );

  if (error) {
    redirect(`/app/${venueSlug}/integrations/square?error=${encodeURIComponent(error.message)}`);
  }

  const { error: itemError } = await supabase
    .from("items")
    .update({
      price_source: "square",
    })
    .eq("id", itemId)
    .eq("venue_id", access.venue.id);

  if (itemError) {
    redirect(`/app/${venueSlug}/integrations/square?error=${encodeURIComponent(itemError.message)}`);
  }

  revalidatePath(`/app/${venueSlug}/integrations/square`);
  revalidatePath(`/app/${venueSlug}/items`);
  revalidatePath(`/v/${venueSlug}/menu`);
  revalidatePath(`/embed/${venueSlug}/menu`);
  revalidatePath(`/tv/${venueSlug}`);
  redirect(`/app/${venueSlug}/integrations/square?message=${encodeURIComponent("Square item linked.")}`);
}

export async function syncSquareItemsAction(venueSlug: string) {
  const access = await requireVenueAccess(venueSlug);

  if (access.isDemoVenue) {
    redirectForDemoVenue(`/app/${venueSlug}/integrations/square`);
  }

  const supabase = await createServerSupabaseClient();
  const items = await listVenueItems(access.venue.id);
  const linkedItems = items
    .filter((item) => item.item_external_links[0]?.external_id)
    .map((item) => ({
      externalId: item.item_external_links[0]?.external_id ?? undefined,
      itemId: item.id,
      itemType: item.type,
      priceSource: item.price_source,
    }));

  try {
    const result = await getCatalogProvider().syncItems(access.venue.id, linkedItems);

    for (const snapshot of result.snapshots ?? []) {
      await supabase
        .from("item_external_links")
        .update({
          availability_snapshot: snapshot.availabilitySnapshot,
          price_snapshot_cents: snapshot.priceSnapshotCents,
          price_snapshot_currency: snapshot.priceSnapshotCurrency,
          synced_at: new Date().toISOString(),
        })
        .eq("venue_id", access.venue.id)
        .eq("provider", "square")
        .eq("external_id", snapshot.externalId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync linked Square items.";
    redirect(`/app/${venueSlug}/integrations/square?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/app/${venueSlug}/integrations/square`);
  revalidatePath(`/app/${venueSlug}/items`);
  revalidatePath(`/v/${venueSlug}/menu`);
  revalidatePath(`/embed/${venueSlug}/menu`);
  revalidatePath(`/tv/${venueSlug}`);
  redirect(`/app/${venueSlug}/integrations/square?message=${encodeURIComponent("Linked Square items synced.")}`);
}
