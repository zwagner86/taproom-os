import Link from "next/link";

import { Badge } from "@taproom/ui";

import { getOptionalUser, isPlatformAdmin } from "@/server/auth";

export async function SiteChrome() {
  const user = await getOptionalUser();
  const admin = user ? await isPlatformAdmin() : false;

  return (
    <header className="border-b border-white/60 bg-parchment/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <Link className="flex items-center gap-3" href="/">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-pine text-sm font-black uppercase tracking-[0.28em] text-parchment">
            TO
          </div>
          <div>
            <p className="font-display text-xl text-ink">TaproomOS</p>
            <p className="text-xs uppercase tracking-[0.2em] text-ink/55">Taproom-first operating system</p>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <Link className="text-sm font-semibold text-ink/70 transition hover:text-ink" href="/v/demo-taproom/menu">
            Demo menu
          </Link>
          {user ? (
            <>
              <Link className="text-sm font-semibold text-ink/70 transition hover:text-ink" href="/">
                Dashboard
              </Link>
              {admin ? <Badge>Platform Admin</Badge> : null}
              <span className="hidden text-sm text-ink/50 sm:inline">{user.email}</span>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/10 bg-white/80 px-5 text-sm font-semibold text-ink transition hover:border-ink/20 hover:bg-white"
                href="/logout"
              >
                Sign out
              </Link>
            </>
          ) : (
            <>
              <Link className="text-sm font-semibold text-ink/70 transition hover:text-ink" href="/login">
                Sign in
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-pine px-5 text-sm font-semibold text-parchment shadow-panel transition hover:bg-pine/90"
                href="/signup"
              >
                Start setup
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

