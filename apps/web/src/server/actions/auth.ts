"use server";

import { redirect } from "next/navigation";

import { getEnv } from "@/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getUserPlatformAdminStatus,
  normalizePostAuthNext,
  resolvePostAuthRedirect,
  syncPlatformAdminBootstrap,
} from "@/server/auth";

export async function signInWithPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = normalizePostAuthNext(formData.get("next")?.toString());
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(buildLoginRedirect({ error: error.message, next }));
  }

  const user = data.user;

  if (!user) {
    redirect(buildLoginRedirect({ error: "Unable to complete sign in.", next }));
  }

  let destination = "/";

  try {
    await syncPlatformAdminBootstrap(user);
    const admin = await getUserPlatformAdminStatus(user, supabase);
    destination = resolvePostAuthRedirect({ isPlatformAdmin: admin, next });
  } catch (authError) {
    const message = authError instanceof Error ? authError.message : "Unable to complete sign in.";
    redirect(buildLoginRedirect({ error: message, next }));
  }

  redirect(destination);
}

export async function signInWithMagicLinkAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const next = normalizePostAuthNext(formData.get("next")?.toString());
  const env = getEnv();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(env.NEXT_PUBLIC_APP_URL, next),
      shouldCreateUser: true,
    },
  });

  if (error) {
    redirect(buildLoginRedirect({ error: error.message, next }));
  }

  redirect(buildLoginRedirect({
    message: "Magic link sent. Check your inbox.",
    mode: "magic",
    next,
  }));
}

export async function signUpWithPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = normalizePostAuthNext(formData.get("next")?.toString());
  const env = getEnv();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(env.NEXT_PUBLIC_APP_URL, next),
    },
  });

  if (error) {
    redirect(buildSignupRedirect({ error: error.message, next }));
  }

  redirect(buildLoginRedirect({
    message: "Account created. Check your email to confirm access.",
    next,
  }));
}

function buildAuthCallbackUrl(appUrl: string, next: string) {
  const url = new URL("/auth/callback", appUrl);

  if (next !== "/") {
    url.searchParams.set("next", next);
  }

  return url.toString();
}

function buildLoginRedirect({
  error,
  message,
  mode,
  next,
}: {
  error?: string;
  message?: string;
  mode?: "magic";
  next: string;
}) {
  const params = new URLSearchParams();

  if (error) {
    params.set("error", error);
  }

  if (message) {
    params.set("message", message);
  }

  if (mode) {
    params.set("mode", mode);
  }

  if (next !== "/") {
    params.set("next", next);
  }

  const query = params.toString();
  return `/login${query ? `?${query}` : ""}`;
}

function buildSignupRedirect({
  error,
  next,
}: {
  error: string;
  next: string;
}) {
  const params = new URLSearchParams({ error });

  if (next !== "/") {
    params.set("next", next);
  }

  return `/signup?${params.toString()}`;
}
