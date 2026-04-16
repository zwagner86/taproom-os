import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

export async function listVenueNotificationLogs(venueId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("notification_logs")
    .select("*")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return data;
}

export async function insertNotificationLogAdmin(
  input: Parameters<Awaited<ReturnType<typeof createAdminSupabaseClient>>["from"]>[0] extends never
    ? never
    : {
        venue_id: string;
        recipient: string;
        channel: "email" | "sms";
        template_key: string;
        provider: string;
        provider_message_id?: string | null;
        status: string;
        context_type?: string | null;
        context_id?: string | null;
        subject?: string | null;
        error_message?: string | null;
        sent_at?: string | null;
      },
) {
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase.from("notification_logs").insert(input);

  if (error) {
    throw error;
  }
}
