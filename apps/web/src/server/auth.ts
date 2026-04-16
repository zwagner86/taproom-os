import { redirect } from "next/navigation";

import { getPlatformAdminEmails } from "@/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getOptionalUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getOptionalUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function isPlatformAdmin() {
  const user = await getOptionalUser();

  if (!user) {
    return false;
  }

  if (user.email && getPlatformAdminEmails().has(user.email.toLowerCase())) {
    return true;
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("platform_admins").select("id").eq("user_id", user.id).maybeSingle();

  return Boolean(data);
}

