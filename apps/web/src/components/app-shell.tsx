"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Store,
  X,
} from "lucide-react";

import { Alert, Badge, Button, cn } from "@/components/ui";

type NavItem = { href: string; label: string };
type NavGroup = { id: string; label: string; items: NavItem[] };

type AppShellProps = {
  children: ReactNode;
  venueName: string;
  venueSlug: string;
  venueType: string;
  userInitials: string;
  userLabel: string;
  groups: NavGroup[];
  currentScreenLabel?: string;
  demoMode?: boolean;
  internalHref?: string;
  platformAdminMode?: boolean;
};

export function AppShell({
  children,
  venueName,
  venueSlug,
  venueType,
  userInitials,
  userLabel,
  groups,
  currentScreenLabel,
  demoMode = false,
  internalHref,
  platformAdminMode = false,
}: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map((group) => [group.id, true])),
  );

  const screenLabel = useMemo(
    () =>
      currentScreenLabel ??
      groups
        .flatMap((group) => group.items)
        .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ??
      venueName,
    [currentScreenLabel, groups, pathname, venueName],
  );

  function toggleGroup(id: string) {
    setExpanded((current) => ({ ...current, [id]: !current[id] }));
  }

  function handleNavigate() {
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,107,44,0.08),transparent_28%),linear-gradient(180deg,#f8f4ee_0%,#fbfaf8_45%,#f5f1ea_100%)]">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "hidden border-r border-border/80 bg-sidebar text-white lg:flex lg:flex-col",
            collapsed ? "lg:w-[104px]" : "lg:w-[312px]",
          )}
        >
          <ShellNav
            collapsed={collapsed}
            expanded={expanded}
            groups={groups}
            internalHref={internalHref}
            onNavigate={handleNavigate}
            onToggleGroup={toggleGroup}
            pathname={pathname}
            platformAdminMode={platformAdminMode}
            userInitials={userInitials}
            userLabel={userLabel}
            venueName={venueName}
            venueSlug={venueSlug}
            venueType={venueType}
          />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close navigation"
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
              onClick={() => setMobileOpen(false)}
              type="button"
            />
            <aside className="relative z-10 flex h-full w-[min(88vw,22rem)] flex-col border-r border-border/80 bg-sidebar text-white shadow-2xl">
              <ShellNav
                collapsed={false}
                expanded={expanded}
                groups={groups}
                internalHref={internalHref}
                onNavigate={handleNavigate}
                onToggleGroup={toggleGroup}
                pathname={pathname}
                platformAdminMode={platformAdminMode}
                userInitials={userInitials}
                userLabel={userLabel}
                venueName={venueName}
                venueSlug={venueSlug}
                venueType={venueType}
              />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/80 bg-background/92 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 md:px-6 lg:px-8">
              <Button
                aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
                className="lg:hidden"
                onClick={() => setMobileOpen((current) => !current)}
                size="sm"
                type="button"
                variant="secondary"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              <Button
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="hidden lg:inline-flex"
                onClick={() => setCollapsed((current) => !current)}
                size="sm"
                type="button"
                variant="ghost"
              >
                {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Venue Admin
                </div>
                <div className="truncate text-lg font-semibold text-foreground">{screenLabel}</div>
              </div>

              <Badge className="hidden sm:inline-flex capitalize" variant="accent">
                {venueType}
              </Badge>
              {platformAdminMode && (
                <Badge className="hidden sm:inline-flex" variant="info">
                  Platform admin
                </Badge>
              )}
              {demoMode && (
                <Badge className="hidden sm:inline-flex" variant="warning">
                  Demo mode
                </Badge>
              )}
              {platformAdminMode && internalHref && (
                <Button asChild className="hidden md:inline-flex" size="sm" variant="ghost">
                  <Link href={internalHref as `/${string}`}>Back to internal</Link>
                </Button>
              )}
              <div className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground md:block">
                {venueSlug}.taproomos.com
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: "var(--accent)" }}
              >
                {userInitials}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
            {demoMode && (
              <Alert className="mb-5" variant="warning">
                <strong>Demo venue.</strong> Changes stay in this tab only and reset on refresh.
              </Alert>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function ShellNav({
  collapsed,
  expanded,
  groups,
  internalHref,
  onNavigate,
  onToggleGroup,
  pathname,
  platformAdminMode,
  userInitials,
  userLabel,
  venueName,
  venueSlug,
  venueType,
}: {
  collapsed: boolean;
  expanded: Record<string, boolean>;
  groups: NavGroup[];
  internalHref?: string;
  onNavigate: () => void;
  onToggleGroup: (id: string) => void;
  pathname: string;
  platformAdminMode: boolean;
  userInitials: string;
  userLabel: string;
  venueName: string;
  venueSlug: string;
  venueType: string;
}) {
  return (
    <>
      <div className="border-b border-white/10 px-4 py-4">
        <div className={cn("flex items-start gap-3", collapsed && "justify-center")}>
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--accent), rgba(255,255,255,0.12))" }}
          >
            T
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-white">TaproomOS</span>
                <Badge className="border-white/10 bg-white/10 capitalize text-white" variant="default">
                  {venueType}
                </Badge>
              </div>
              <div className="mt-1 truncate text-base font-medium text-white/90">{venueName}</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-white/55">
                <Store className="h-3.5 w-3.5" />
                <span className="truncate">{venueSlug}.taproomos.com</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div className="mb-4" key={group.id}>
            {!collapsed && (
              <button
                className="mb-2 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45 transition-colors hover:bg-white/5 hover:text-white/70"
                onClick={() => onToggleGroup(group.id)}
                type="button"
              >
                <span>{group.label}</span>
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", !expanded[group.id] && "-rotate-90")}
                />
              </button>
            )}

            {(collapsed || expanded[group.id]) && (
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition-all",
                        active
                          ? "border-white/10 bg-white/12 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
                          : "border-transparent text-white/65 hover:border-white/10 hover:bg-white/7 hover:text-white",
                        collapsed && "justify-center px-0",
                      )}
                      href={item.href as `/${string}`}
                      key={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full transition-colors",
                          active ? "bg-[var(--accent)]" : "bg-white/25 group-hover:bg-white/55",
                        )}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div
          className={cn(
            "rounded-2xl border border-white/10 bg-white/5 p-3",
            collapsed && "flex justify-center border-none bg-transparent p-0",
          )}
        >
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: "var(--accent)" }}
            >
              {userInitials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white/90">{userLabel}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-white/50">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>{platformAdminMode ? "Platform admin access" : "Venue admin access"}</span>
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="mt-3 flex flex-col gap-2">
              {platformAdminMode && internalHref && (
                <Link
                  className="flex items-center gap-2 text-xs font-medium text-white/55 transition-colors hover:text-white"
                  href={internalHref as `/${string}`}
                  onClick={onNavigate}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to internal</span>
                </Link>
              )}
              <Link
                className="flex items-center gap-2 text-xs font-medium text-white/55 transition-colors hover:text-white"
                href={`/v/${venueSlug}/menu` as `/${string}`}
                onClick={onNavigate}
              >
                <span>Open public venue</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
