import { describe, expect, it } from "vitest";

import { AUTH_SENSITIVE_PROXY_MATCHERS, isAuthSensitivePathname } from "./auth-middleware";

describe("auth middleware route matching", () => {
  it("includes the auth-sensitive routes in the proxy matcher list", () => {
    expect(AUTH_SENSITIVE_PROXY_MATCHERS).toEqual([
      "/",
      "/login",
      "/logout",
      "/onboarding",
      "/signup",
      "/app/:path*",
      "/auth/:path*",
      "/internal/:path*",
    ]);
  });

  it("matches auth-sensitive paths", () => {
    expect(isAuthSensitivePathname("/")).toBe(true);
    expect(isAuthSensitivePathname("/login")).toBe(true);
    expect(isAuthSensitivePathname("/signup")).toBe(true);
    expect(isAuthSensitivePathname("/onboarding")).toBe(true);
    expect(isAuthSensitivePathname("/logout")).toBe(true);
    expect(isAuthSensitivePathname("/app/demo-taproom/displays")).toBe(true);
    expect(isAuthSensitivePathname("/auth/callback")).toBe(true);
    expect(isAuthSensitivePathname("/internal/venues")).toBe(true);
  });

  it("excludes public display and check-in routes", () => {
    expect(isAuthSensitivePathname("/v/demo-taproom/menu")).toBe(false);
    expect(isAuthSensitivePathname("/v/demo-taproom/display")).toBe(false);
    expect(isAuthSensitivePathname("/embed/demo-taproom/display/main-board")).toBe(false);
    expect(isAuthSensitivePathname("/tv/demo-taproom/display/main-board")).toBe(false);
    expect(isAuthSensitivePathname("/check-in/token-123")).toBe(false);
  });
});
