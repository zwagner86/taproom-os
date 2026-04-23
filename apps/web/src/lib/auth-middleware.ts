const AUTH_SENSITIVE_PREFIXES = [
  "/app",
  "/auth",
  "/internal",
] as const;

const AUTH_SENSITIVE_EXACT_PATHS = [
  "/",
  "/login",
  "/logout",
  "/onboarding",
  "/signup",
] as const;

const authSensitiveExactPaths = new Set<string>(AUTH_SENSITIVE_EXACT_PATHS);

export const AUTH_SENSITIVE_PROXY_MATCHERS = [
  ...AUTH_SENSITIVE_EXACT_PATHS,
  "/app/:path*",
  "/auth/:path*",
  "/internal/:path*",
] as const;

export function isAuthSensitivePathname(pathname: string) {
  if (authSensitiveExactPaths.has(pathname)) {
    return true;
  }

  return AUTH_SENSITIVE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
