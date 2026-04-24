"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Database } from "../../../../../supabase/types";
import { normalizeHexColor } from "@/lib/colors";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { isPlatformAdmin, requireUser } from "@/server/auth";
import { getDemoVenueFormState } from "@/server/demo-venue";
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

  if (access.isDemoVenue) {
    return getDemoVenueFormState<VenueSettingsState>();
  }

  const supabase = await createServerSupabaseClient();
  const accentColor = normalizeHexColor(String(formData.get("accent_color") ?? access.venue.accent_color));
  const secondaryAccentColor = normalizeHexColor(String(
    formData.get("secondary_accent_color") ?? access.venue.secondary_accent_color ?? "#2E9F9A",
  ));
  const displayTheme = String(formData.get("display_theme") ?? access.venue.display_theme ?? "light");

  if (!accentColor) {
    return { error: "Primary accent color must be a 3- or 6-digit hex value like #C96B2C." };
  }

  if (!secondaryAccentColor) {
    return { error: "Secondary accent color must be a 3- or 6-digit hex value like #2E9F9A." };
  }

  if (displayTheme !== "light" && displayTheme !== "dark") {
    return { error: "Display theme must be light or dark." };
  }

  let uploadedLogoUrl: string | null;

  try {
    uploadedLogoUrl = await uploadVenueLogo(access.venue.id, formData.get("logo_file"));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to upload logo." };
  }

  const updates: Database["public"]["Tables"]["venues"]["Update"] = {
    accent_color: accentColor,
    display_theme: displayTheme,
    logo_url: uploadedLogoUrl ?? normalizeOptionalString(formData.get("logo_url")),
    name: String(formData.get("name") ?? access.venue.name).trim(),
    secondary_accent_color: secondaryAccentColor,
    tagline: normalizeOptionalString(formData.get("tagline")),
    venue_type: String(formData.get("venue_type") ?? access.venue.venue_type) as VenueInsert["venue_type"],
  };

  const { error } = await supabase.from("venues").update(updates).eq("id", access.venue.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/app/${venueSlug}/setup`);
  revalidatePath(`/v/${venueSlug}/menu`);
  revalidatePath(`/embed/${venueSlug}/menu`);
  revalidatePath(`/embed/${venueSlug}/display`);
  revalidatePath(`/tv/${venueSlug}`);
  revalidatePath(`/tv/${venueSlug}/display`);
  return { message: "Venue settings saved." };
}

async function uploadVenueLogo(venueId: string, value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);

  if (!allowedTypes.has(value.type)) {
    throw new Error("Logo must be a JPG, PNG, WebP, GIF, or SVG image.");
  }

  if (value.size > 2 * 1024 * 1024) {
    throw new Error("Logo must be smaller than 2 MB.");
  }

  const supabase = await createServerSupabaseClient();
  const extension = getLogoFileExtension(value);
  const path = `${venueId}/logo-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from("venue-logos").upload(path, value, {
    cacheControl: "31536000",
    contentType: value.type,
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("venue-logos").getPublicUrl(path);
  return data.publicUrl;
}

function getLogoFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension;
  }

  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/svg+xml":
      return "svg";
    default:
      return "img";
  }
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
