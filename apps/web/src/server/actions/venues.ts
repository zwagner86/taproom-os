"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Database } from "../../../../../supabase/types";
import { normalizeHexColor } from "@/lib/colors";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { isPlatformAdmin, requireUser } from "@/server/auth";
import { getVenueBySlug } from "@/server/repositories/venues";

type VenueInsert = Database["public"]["Tables"]["venues"]["Insert"];

export async function createVenueForCurrentUserAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const venueType = String(formData.get("venue_type") ?? "brewery") as VenueInsert["venue_type"];

  const { data: venue, error } = await supabase
    .from("venues")
    .insert({
      name,
      slug,
      venue_type: venueType,
    })
    .select("*")
    .single();

  if (error || !venue) {
    redirect(`/onboarding?error=${encodeURIComponent(error?.message ?? "Unable to create venue.")}`);
  }

  const { error: membershipError } = await supabase.from("venue_users").insert({
    role: "owner",
    user_id: user.id,
    venue_id: venue.id,
  });

  if (membershipError) {
    redirect(`/onboarding?error=${encodeURIComponent(membershipError.message)}`);
  }

  revalidatePath("/");
  redirect(`/app/${venue.slug}/setup`);
}

export async function createVenueAsPlatformAction(formData: FormData) {
  const user = await requireUser();
  const admin = await isPlatformAdmin();

  if (!admin) {
    redirect("/");
  }

  const supabase = await createServerSupabaseClient();
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const venueType = String(formData.get("venue_type") ?? "brewery") as VenueInsert["venue_type"];

  const { data: venue, error } = await supabase
    .from("venues")
    .insert({
      name,
      slug,
      venue_type: venueType,
    })
    .select("*")
    .single();

  if (error || !venue) {
    redirect(`/internal/venues?error=${encodeURIComponent(error?.message ?? "Unable to create venue.")}`);
  }

  const ownerEmail = String(formData.get("owner_email") ?? "").trim().toLowerCase();

  if (!ownerEmail || ownerEmail === user.email?.toLowerCase()) {
    const { error: membershipError } = await supabase.from("venue_users").upsert(
      {
        role: "owner",
        user_id: user.id,
        venue_id: venue.id,
      },
      {
        onConflict: "venue_id,user_id",
      },
    );

    if (membershipError) {
      redirect(`/internal/venues?error=${encodeURIComponent(membershipError.message)}`);
    }
  } else {
    try {
      const adminClient = await createAdminSupabaseClient();
      const inviteResponse = await adminClient.auth.admin.inviteUserByEmail(ownerEmail);

      if (inviteResponse.error || !inviteResponse.data.user) {
        redirect(
          `/internal/venues?message=${encodeURIComponent(
            `Venue created, but ${ownerEmail} still needs manual assignment.`,
          )}`,
        );
      }

      const { error: membershipError } = await adminClient.from("venue_users").upsert(
        {
          role: "owner",
          user_id: inviteResponse.data.user.id,
          venue_id: venue.id,
        },
        {
          onConflict: "venue_id,user_id",
        },
      );

      if (membershipError) {
        redirect(`/internal/venues?error=${encodeURIComponent(membershipError.message)}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to invite the owner automatically.";
      redirect(`/internal/venues?message=${encodeURIComponent(`Venue created. ${message}`)}`);
    }
  }

  revalidatePath("/");
  redirect(`/internal/venues/${venue.slug}/impersonate`);
}

export type VenueSettingsState = { message?: string; error?: string } | null;

export async function updateVenueSettingsAction(
  venueSlug: string,
  _prevState: VenueSettingsState,
  formData: FormData,
): Promise<VenueSettingsState> {
  const access = await getVenueAccessOrRedirect(venueSlug);
  const supabase = await createServerSupabaseClient();
  const accentColor = normalizeHexColor(String(formData.get("accent_color") ?? access.venue.accent_color));

  if (!accentColor) {
    return { error: "Accent color must be a 3- or 6-digit hex value like #C96B2C." };
  }

  const updates: Database["public"]["Tables"]["venues"]["Update"] = {
    accent_color: accentColor,
    logo_url: normalizeOptionalString(formData.get("logo_url")),
    membership_label: String(formData.get("membership_label") ?? access.venue.membership_label).trim() || "Club",
    menu_label: String(formData.get("menu_label") ?? access.venue.menu_label).trim() || "Tap List",
    name: String(formData.get("name") ?? access.venue.name).trim(),
    tagline: normalizeOptionalString(formData.get("tagline")),
  };

  const { error } = await supabase.from("venues").update(updates).eq("id", access.venue.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/app/${venueSlug}/setup`);
  revalidatePath(`/v/${venueSlug}/menu`);
  revalidatePath(`/embed/${venueSlug}/menu`);
  revalidatePath(`/tv/${venueSlug}`);
  return { message: "Venue settings saved." };
}

function normalizeOptionalString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

async function getVenueAccessOrRedirect(slug: string) {
  try {
    const { requireVenueAccess } = await import("@/server/repositories/venues");
    return await requireVenueAccess(slug);
  } catch {
    redirect("/");
  }
}
