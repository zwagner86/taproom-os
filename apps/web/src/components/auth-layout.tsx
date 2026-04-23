import type { ReactNode } from "react";
import Link from "next/link";

import { Badge, Card } from "@/components/ui";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,107,44,0.12),transparent_26%),linear-gradient(180deg,#faf7f2_0%,#f5efe5_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <div
          className="relative hidden overflow-hidden border-r border-white/10 lg:flex lg:flex-col lg:justify-between"
          style={{ background: "linear-gradient(180deg, var(--c-sidebar), color-mix(in srgb, var(--c-sidebar) 82%, black))" }}
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute left-[-6rem] top-[-4rem] h-56 w-56 rounded-full bg-[var(--accent)] blur-3xl" />
            <div className="absolute bottom-[-7rem] right-[-4rem] h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col gap-12 px-10 py-12 xl:px-14">
            <Link className="flex items-center gap-3" href="/">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-base font-black text-white shadow-lg"
                style={{ background: "linear-gradient(135deg, var(--accent), rgba(255,255,255,0.18))" }}
              >
                T
              </div>
              <div>
                <div className="text-lg font-semibold tracking-[-0.03em] text-white">TaproomOS</div>
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">Craft venue ops</div>
              </div>
            </Link>

            <div className="max-w-md space-y-5">
              <Badge className="border-white/10 bg-white/10 text-white" variant="default">
                Menus, events, memberships, displays
              </Badge>
              <h2 className="font-display text-4xl leading-tight tracking-tight text-white">
                The operating layer for taprooms that change fast.
              </h2>
              <p className="text-base leading-7 text-white/65">
                Publish rotating pours, free events, memberships, and signage from one venue record without dragging in
                restaurant or POS sprawl.
              </p>
            </div>

            <div className="grid gap-4">
              {[
                "Public, embed, and TV surfaces stay in sync from one config.",
                "Operator workflows stay lightweight for real taproom teams.",
                "Stripe and Square expand the product without taking over the core model.",
              ].map((item) => (
                <div
                  className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm leading-6 text-white/70 backdrop-blur-sm"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 px-10 pb-10 text-xs text-white/30 xl:px-14">© 2026 TaproomOS</div>
        </div>

        <div className="flex items-center justify-center px-4 py-10 md:px-8 lg:px-12">
          <Card
            className="w-full max-w-[34rem] border-border/80 bg-white/92 shadow-[0_28px_80px_rgba(80,54,31,0.12)] backdrop-blur"
            style={{ padding: 0 }}
          >
            <div className="border-b border-border/70 px-6 py-6 md:px-8">
              <h1 className="font-display text-3xl tracking-tight text-foreground">{title}</h1>
              {subtitle && <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="px-6 py-6 md:px-8">{children}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
