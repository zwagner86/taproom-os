import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getUserPlatformAdminStatus,
  normalizePostAuthNext,
  resolvePostAuthRedirect,
  syncPlatformAdminBootstrap,
} from "@/server/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = normalizePostAuthNext(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  const supabase = await createServerSupabaseClient();

  try {
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    if (!user) {
      throw new Error("Unable to complete sign in.");
    }

    await syncPlatformAdminBootstrap(user);
    const admin = await getUserPlatformAdminStatus(user, supabase);
    const destination = resolvePostAuthRedirect({ isPlatformAdmin: admin, next });

    return NextResponse.redirect(new URL(destination, request.url));
  } catch (authError) {
    const message = authError instanceof Error ? authError.message : "Unable to complete sign in.";
    const redirectUrl = new URL("/login", request.url);

    redirectUrl.searchParams.set("error", message);
    if (next !== "/") {
      redirectUrl.searchParams.set("next", next);
    }

    return NextResponse.redirect(redirectUrl);
  }
}
