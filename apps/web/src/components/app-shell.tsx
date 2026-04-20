"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
};

export function AppShell({
  children,
  venueName,
  venueSlug,
  venueType: _venueType,
  userInitials,
  userLabel,
  groups,
  currentScreenLabel,
}: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map((g) => [g.id, true])),
  );

  const toggleGroup = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const screenLabel =
    currentScreenLabel ??
    groups.flatMap((g) => g.items).find((i) => pathname.endsWith(i.href) || pathname.includes(i.href + "/"))?.label ??
    venueName;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--c-bg)" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-shrink-0 flex-col overflow-hidden transition-[width] duration-200"
        style={{
          width: collapsed ? 52 : 220,
          background: "var(--c-sidebar)",
          height: "100vh",
          position: "sticky",
          top: 0,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center border-b shrink-0"
          style={{
            padding: collapsed ? "18px 0" : "18px 16px",
            borderColor: "rgba(255,255,255,0.07)",
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-lg text-white font-black text-sm flex-shrink-0"
                  style={{ width: 28, height: 28, background: "var(--accent)" }}
                >
                  T
                </div>
                <div>
                  <div className="text-white text-[13px] font-bold leading-tight">TaproomOS</div>
                  <div className="text-[10.5px] mt-px" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {venueName}
                  </div>
                </div>
              </div>
              <button
                className="border-none bg-transparent cursor-pointer text-lg leading-none p-0"
                onClick={() => setCollapsed(true)}
                style={{ color: "rgba(255,255,255,0.35)" }}
                type="button"
              >
                ‹
              </button>
            </>
          ) : (
            <div
              className="flex items-center justify-center rounded-lg text-white font-black text-sm"
              style={{ width: 28, height: 28, background: "var(--accent)" }}
            >
              T
            </div>
          )}
        </div>

        {collapsed && (
          <button
            className="border-none bg-transparent cursor-pointer text-lg leading-none text-center py-2.5"
            onClick={() => setCollapsed(false)}
            style={{ color: "rgba(255,255,255,0.35)" }}
            type="button"
          >
            ›
          </button>
        )}

        {/* Nav */}
        <nav
          className="flex-1 py-2 overflow-y-auto"
          style={{ overflowX: "hidden", scrollbarWidth: "none" } as React.CSSProperties}
        >
          {groups.map((group) => (
            <div className="mb-1" key={group.id}>
              {!collapsed && (
                <button
                  className="w-full flex items-center justify-between border-none bg-transparent cursor-pointer font-[inherit] uppercase tracking-[1px]"
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    padding: "8px 16px 4px",
                    color: "rgba(255,255,255,0.35)",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                  type="button"
                >
                  {group.label}
                  <span style={{ fontSize: 10 }}>{expanded[group.id] ? "▾" : "▸"}</span>
                </button>
              )}
              {(collapsed || expanded[group.id]) &&
                group.items.map((item) => {
                  const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      href={item.href as `/${string}`}
                      key={item.href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: active ? "rgba(255,255,255,0.1)" : "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: collapsed ? "9px 0" : "8px 16px",
                        justifyContent: collapsed ? "center" : "flex-start",
                        borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
                        transition: "all 0.1s",
                        textDecoration: "none",
                      }}
                      title={collapsed ? item.label : undefined}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          background: active ? "var(--accent)" : "rgba(255,255,255,0.25)",
                          flexShrink: 0,
                        }}
                      />
                      {!collapsed && (
                        <span
                          style={{
                            fontSize: 13,
                            color: active ? "#fff" : "rgba(255,255,255,0.6)",
                            fontWeight: active ? 500 : 400,
                            lineHeight: 1.3,
                          }}
                        >
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        {!collapsed && (
          <div
            className="shrink-0 border-t"
            style={{ padding: "12px 16px", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0"
                style={{ width: 28, height: 28, background: "var(--accent)" }}
              >
                {userInitials}
              </div>
              <div>
                <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
                  {userLabel}
                </div>
                <div className="text-[10.5px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Venue Admin
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center flex-shrink-0 border-b bg-white gap-3"
          style={{ height: 52, padding: "0 24px", borderColor: "var(--c-border)" }}
        >
          <div className="flex-1">
            <span className="text-[13.5px] font-semibold text-ink">{screenLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="text-xs bg-mist border border-rim rounded-full px-2.5 py-1 text-muted"
            >
              {venueSlug}.taproomos.com
            </div>
            <div
              className="flex items-center justify-center rounded-full text-white text-sm font-bold cursor-pointer"
              style={{ width: 32, height: 32, background: "var(--accent)" }}
            >
              {userInitials}
            </div>
          </div>
        </div>

        {/* Content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: 28 }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
