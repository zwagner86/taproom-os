import Link from "next/link";

import { Badge } from "@taproom/ui";

import { getOptionalUser, isPlatformAdmin } from "@/server/auth";

export async function SiteChrome() {
  const user = await getOptionalUser();
  const admin = user ? await isPlatformAdmin() : false;

  return (
    <header
      className="border-b backdrop-blur sticky top-0 z-50"
      style={{ borderColor: "var(--c-border)", background: "oklch(97% 0.008 75 / 0.92)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Link className="flex items-center gap-3" href="/">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[13px] font-black tracking-wide text-white"
            style={{ background: "var(--c-sidebar)" }}
          >
            T
          </div>
          <span className="font-bold text-[16px] tracking-[-0.3px]" style={{ color: "var(--c-text)" }}>
            TaproomOS
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            className="text-[13.5px] font-medium transition"
            href="/v/demo-taproom/menu"
            style={{ color: "var(--c-muted)" }}
          >
            Demo venue
          </Link>
          {user ? (
            <>
              <Link
                className="text-[13.5px] font-medium transition"
                href="/"
                style={{ color: "var(--c-muted)" }}
              >
                Dashboard
              </Link>
              {admin && <Badge variant="accent">Admin</Badge>}
              <span className="hidden text-[13px] sm:inline" style={{ color: "var(--c-muted)" }}>
                {user.email}
              </span>
              <Link
                className="inline-flex items-center rounded-lg border px-3.5 py-1.5 text-[13px] font-semibold transition"
                href="/logout"
                style={{ borderColor: "var(--c-border)", color: "var(--c-text)" }}
              >
                Sign out
              </Link>
            </>
          ) : (
            <>
              <Link
                className="text-[13.5px] font-medium transition"
                href="/login"
                style={{ color: "var(--c-muted)" }}
              >
                Sign in
              </Link>
              <Link
                className="inline-flex items-center rounded-lg px-4 py-1.5 text-[13px] font-semibold text-white transition"
                href="/signup"
                style={{ background: "var(--c-sidebar)" }}
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
