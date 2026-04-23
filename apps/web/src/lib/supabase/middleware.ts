import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getEnv } from "@/env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const env = getEnv();

  const supabase = createServerClient<any>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch (error) {
    if (!isSupabaseAuthRateLimitError(error)) {
      console.error("Supabase auth refresh failed in middleware", error);
    }
  }

  return response;
}

function isSupabaseAuthRateLimitError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: unknown; status?: unknown };
  return maybeError.status === 429 || maybeError.code === "over_request_rate_limit";
}
