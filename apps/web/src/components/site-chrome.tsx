import Link from "next/link";

import { Badge, Button } from "@/components/ui";
import { getOptionalUser, isPlatformAdmin } from "@/server/auth";

export async function SiteChrome() {
  const user = await getOptionalUser();
  const admin = user ? await isPlatformAdmin() : false;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-5">
        <Link className="flex min-w-0 items-center gap-3" href="/">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black tracking-wide text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--c-sidebar), var(--accent))" }}
          >
            T
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">TaproomOS</div>
            <div className="hidden text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
              Craft Venue Operations
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Button asChild size="sm" variant="ghost">
            <Link href="/v/demo-taproom/menu">Demo venue</Link>
          </Button>

          {user ? (
            <>
              {admin && (
                <Button asChild size="sm" variant="ghost">
                  <Link href="/internal">Internal</Link>
                </Button>
              )}
              <Button asChild className="hidden sm:inline-flex" size="sm" variant="ghost">
                <Link href="/">Dashboard</Link>
              </Button>
              {admin && <Badge variant="accent">Platform admin</Badge>}
              <span className="hidden max-w-52 truncate text-sm text-muted-foreground lg:inline">
                {user.email}
              </span>
              <Button asChild size="sm" variant="secondary">
                <Link href="/logout">Sign out</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="hidden sm:inline-flex" size="sm" variant="ghost">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
