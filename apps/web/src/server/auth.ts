import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getPlatformAdminEmails } from "@/env";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

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
    const supabase = await getCachedAuthSupabaseClient();
    return getUserPlatformAdminStatus(user, supabase);
  });
}

function hasPlatformAdminEmail(email: string | null | undefined) {
  return Boolean(email && getPlatformAdminEmails().has(email.toLowerCase()));
}

export function normalizePostAuthNext(next: string | null | undefined) {
  const normalized = String(next ?? "").trim();

  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return "/";
  }

  try {
    const url = new URL(normalized, "http://localhost");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

function getVenueSlugFromAppPath(path: string) {
  const { pathname } = new URL(path, "http://localhost");
  const parts = pathname.split("/");

  return parts[1] === "app" && parts[2] ? parts[2] : null;
}

export function resolveImpersonationTarget(venueSlug: string, next: string | null | undefined) {
  const safeNext = normalizePostAuthNext(next);
  const nextVenueSlug = getVenueSlugFromAppPath(safeNext);

  if (nextVenueSlug === venueSlug) {
    return safeNext;
  }

  return `/app/${venueSlug}/setup`;
}

export function resolvePostAuthRedirect({
  isPlatformAdmin,
  next,
}: {
  isPlatformAdmin: boolean;
  next: string | null | undefined;
}) {
  const safeNext = normalizePostAuthNext(next);

  if (!isPlatformAdmin) {
    return safeNext;
  }

  const venueSlug = getVenueSlugFromAppPath(safeNext);

  if (venueSlug) {
    return `/internal/venues/${venueSlug}/impersonate?next=${encodeURIComponent(safeNext)}`;
  }

  return safeNext === "/" ? "/internal" : safeNext;
}

export async function getUserPlatformAdminStatus(
  user: OptionalUser | User | null,
  client?: AuthSupabaseClient,
) {
  if (!user) {
    return false;
  }

  if (hasPlatformAdminEmail(user.email)) {
    return true;
  }

  const supabase = client ?? await createServerSupabaseClient();
  const { data } = await supabase.from("platform_admins").select("id").eq("user_id", user.id).maybeSingle();

  return Boolean(data);
}

export async function syncPlatformAdminBootstrap(user: OptionalUser | User | null) {
  if (!user?.id || !hasPlatformAdminEmail(user.email)) {
    return false;
  }

  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase.from("platform_admins").upsert(
    { user_id: user.id },
    { onConflict: "user_id" },
  );

  if (error) {
    throw error;
  }

  return true;
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

export async function requirePlatformAdmin() {
  const user = await requireUser();
  const admin = await isPlatformAdmin();

  if (!admin) {
    redirect("/");
  }

  return user;
}
