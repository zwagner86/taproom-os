import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getPlatformAdminEmails } from "@/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AuthSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;
type RequestKey = object;
type OptionalUser = Awaited<ReturnType<AuthSupabaseClient["auth"]["getUser"]>>["data"]["user"];

// Next returns a request-scoped cookie store object we can safely use as the memoization key.
const authSupabaseClientCache = new WeakMap<RequestKey, Promise<AuthSupabaseClient>>();
const optionalUserCache = new WeakMap<RequestKey, Promise<OptionalUser>>();
const platformAdminCache = new WeakMap<RequestKey, Promise<boolean>>();

async function getRequestKey() {
  return (await cookies()) as RequestKey;
}

async function getRequestScopedValue<T>(cache: WeakMap<RequestKey, Promise<T>>, load: () => Promise<T>) {
  const requestKey = await getRequestKey();
  const cached = cache.get(requestKey);

  if (cached) {
    return cached;
  }

  const pending = load();
  cache.set(requestKey, pending);

  void pending.catch(() => {
    if (cache.get(requestKey) === pending) {
      cache.delete(requestKey);
    }
  });

  return pending;
}

async function getCachedAuthSupabaseClient() {
  return getRequestScopedValue(authSupabaseClientCache, () => createServerSupabaseClient());
}

async function getCachedOptionalUser() {
  return getRequestScopedValue(optionalUserCache, async () => {
    const supabase = await getCachedAuthSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  });
}

async function getCachedPlatformAdmin() {
  return getRequestScopedValue(platformAdminCache, async () => {
    const user = await getCachedOptionalUser();

    if (!user) {
      return false;
    }

    if (user.email && getPlatformAdminEmails().has(user.email.toLowerCase())) {
      return true;
    }

    const supabase = await getCachedAuthSupabaseClient();
    const { data } = await supabase.from("platform_admins").select("id").eq("user_id", user.id).maybeSingle();

    return Boolean(data);
  });
}

export async function getOptionalUser() {
  return getCachedOptionalUser();
}

export async function requireUser() {
  const user = await getOptionalUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function isPlatformAdmin() {
  return getCachedPlatformAdmin();
}
