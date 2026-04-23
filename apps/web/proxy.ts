import { NextResponse, type NextRequest } from "next/server";

import { isAuthSensitivePathname } from "@/lib/auth-middleware";
import { updateSession } from "@/lib/supabase/middleware";

export function proxy(request: NextRequest) {
  if (!isAuthSensitivePathname(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/logout",
    "/onboarding",
    "/signup",
    "/app/:path*",
    "/auth/:path*",
    "/internal/:path*",
  ],
};
