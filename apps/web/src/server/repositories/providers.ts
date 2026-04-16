import type { Database } from "../../../../../supabase/types";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

export type StripeConnectionRow = Database["public"]["Tables"]["stripe_connections"]["Row"];
export type SquareConnectionRow = Database["public"]["Tables"]["square_connections"]["Row"];

type StripeConnectionUpsert = {
  venueId: string;
  stripeAccountId: string;
  accessToken: string;
  refreshToken: string;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  lastError?: string | null;
  status: "active" | "pending" | "error";
};

type SquareConnectionUpsert = {
  venueId: string;
  merchantId: string;
  accessToken: string;
  refreshToken: string;
  lastError?: string | null;
  status: "active" | "pending" | "error";
};

export async function getStripeConnectionForVenue(venueId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("stripe_connections")
    .select("*")
    .eq("venue_id", venueId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getSquareConnectionForVenue(venueId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("square_connections")
    .select("*")
    .eq("venue_id", venueId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getStripeConnectionForVenueAdmin(venueId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("stripe_connections")
    .select("*")
    .eq("venue_id", venueId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getStripeConnectionByAccountIdAdmin(accountId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("stripe_connections")
    .select("*")
    .eq("stripe_account_id", accountId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getSquareConnectionForVenueAdmin(venueId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("square_connections")
    .select("*")
    .eq("venue_id", venueId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getSquareAccessTokenForVenueAdmin(venueId: string): Promise<string> {
  const connection = await getSquareConnectionForVenueAdmin(venueId);

  if (!connection?.access_token_encrypted) {
    throw new Error("Square is not connected for this venue.");
  }

  const token = decryptSecret(connection.access_token_encrypted);

  if (!token) {
    throw new Error("Square access token is unavailable for this venue.");
  }

  return token;
}

export async function upsertStripeConnectionAdmin(input: StripeConnectionUpsert) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("stripe_connections")
    .upsert(
      {
        access_token_encrypted: encryptSecret(input.accessToken),
        charges_enabled: input.chargesEnabled,
        details_submitted: input.detailsSubmitted,
        last_error: input.lastError ?? null,
        last_synced_at: new Date().toISOString(),
        refresh_token_encrypted: encryptSecret(input.refreshToken),
        status: input.status,
        stripe_account_id: input.stripeAccountId,
        venue_id: input.venueId,
      },
      {
        onConflict: "venue_id",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertSquareConnectionAdmin(input: SquareConnectionUpsert) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("square_connections")
    .upsert(
      {
        access_token_encrypted: encryptSecret(input.accessToken),
        last_error: input.lastError ?? null,
        merchant_id: input.merchantId,
        refresh_token_encrypted: encryptSecret(input.refreshToken),
        status: input.status,
        synced_at: new Date().toISOString(),
        venue_id: input.venueId,
      },
      {
        onConflict: "venue_id",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function recordProviderWebhookEventAdmin(input: {
  venueId?: string | null;
  provider: "stripe" | "square" | "twilio" | "resend";
  providerEventId: string;
  eventType: string;
  payload: Database["public"]["Tables"]["provider_webhook_events"]["Insert"]["payload"];
}) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("provider_webhook_events")
    .insert({
      event_type: input.eventType,
      payload: input.payload,
      processed_at: null,
      provider: input.provider,
      provider_event_id: input.providerEventId,
      venue_id: input.venueId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return null;
    }

    throw error;
  }

  return data;
}

export async function markProviderWebhookProcessedAdmin(webhookId: string) {
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase
    .from("provider_webhook_events")
    .update({
      processed_at: new Date().toISOString(),
    })
    .eq("id", webhookId);

  if (error) {
    throw error;
  }
}
