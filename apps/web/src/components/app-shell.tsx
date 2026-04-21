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
    <div className="flex h-screen overflow-hidden bg-parchment">
      {/* Sidebar */}
      <aside
        className="flex flex-shrink-0 flex-col overflow-hidden transition-[width] duration-200 bg-sidebar h-screen sticky top-0"
        style={{ width: collapsed ? 52 : 220 }}
      >
        {/* Header */}
        <div
          className="flex items-center border-b border-white/[0.07] shrink-0"
          style={{
            padding: collapsed ? "18px 0" : "18px 16px",
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-lg text-white font-black text-sm flex-shrink-0 w-7 h-7"
                  style={{ background: "var(--accent)" }}
                >
                  T
                </div>
                <div>
                  <div className="text-white text-[13px] font-bold leading-tight">TaproomOS</div>
                  <div className="text-[10.5px] mt-px text-white/40">{venueName}</div>
                </div>
              </div>
              <button
                className="border-none bg-transparent cursor-pointer text-lg leading-none p-0 text-white/[0.35]"
                onClick={() => setCollapsed(true)}
                type="button"
              >
                ‹
              </button>
            </>
          ) : (
            <div
              className="flex items-center justify-center rounded-lg text-white font-black text-sm w-7 h-7"
              style={{ background: "var(--accent)" }}
            >
              T
            </div>
          )}
        </div>

        {collapsed && (
          <button
            className="border-none bg-transparent cursor-pointer text-lg leading-none text-center py-2.5 text-white/[0.35]"
            onClick={() => setCollapsed(false)}
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
                  className="w-full flex items-center justify-between border-none bg-transparent cursor-pointer font-[inherit] uppercase tracking-[1px] px-4 pt-2 pb-1 text-[10px] font-bold text-white/[0.35]"
                  onClick={() => toggleGroup(group.id)}
                  type="button"
                >
                  {group.label}
                  <span className="text-[10px]">{expanded[group.id] ? "▾" : "▸"}</span>
                </button>
              )}
              {(collapsed || expanded[group.id]) &&
                group.items.map((item) => {
                  const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      className="flex items-center gap-2 no-underline transition-all duration-100"
                      href={item.href as `/${string}`}
                      key={item.href}
                      style={{
                        background: active ? "rgba(255,255,255,0.1)" : "transparent",
                        padding: collapsed ? "9px 0" : "8px 16px",
                        justifyContent: collapsed ? "center" : "flex-start",
                        borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
                      }}
                      title={collapsed ? item.label : undefined}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: active ? "var(--accent)" : "rgba(255,255,255,0.25)" }}
                      />
                      {!collapsed && (
                        <span
                          className="text-[13px] leading-[1.3]"
                          style={{
                            color: active ? "#fff" : "rgba(255,255,255,0.6)",
                            fontWeight: active ? 500 : 400,
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
          <div className="shrink-0 border-t border-white/[0.07] px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0 w-7 h-7"
                style={{ background: "var(--accent)" }}
              >
                {userInitials}
              </div>
              <div>
                <div className="text-xs font-medium text-white/75">{userLabel}</div>
                <div className="text-[10.5px] text-white/[0.35]">Venue Admin</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center flex-shrink-0 border-b border-rim bg-white gap-3 h-[52px] px-6">
          <div className="flex-1">
            <span className="text-[13.5px] font-semibold text-ink">{screenLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs bg-mist border border-rim rounded-full px-2.5 py-1 text-muted">
              {venueSlug}.taproomos.com
            </div>
            <div
              className="flex items-center justify-center rounded-full text-white text-sm font-bold cursor-pointer w-8 h-8"
              style={{ background: "var(--accent)" }}
            >
              {userInitials}
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
