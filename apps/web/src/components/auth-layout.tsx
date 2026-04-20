import type { ReactNode } from "react";

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
    <div className="flex min-h-screen" style={{ background: "var(--c-bg)" }}>
      {/* Dark brand panel */}
      <div
        className="hidden lg:flex w-[440px] flex-shrink-0 flex-col justify-between"
        style={{ background: "var(--c-sidebar)", padding: "48px 40px" }}
      >
        <div>
          <div className="flex items-center gap-2.5 mb-14">
            <div
              className="flex items-center justify-center rounded-[10px] text-white font-black text-lg"
              style={{ width: 36, height: 36, background: "var(--accent)" }}
            >
              T
            </div>
            <span className="text-white text-lg font-bold tracking-[-0.3px]">TaproomOS</span>
          </div>
          <div
            className="text-[28px] font-bold leading-[1.3] tracking-[-0.5px] mb-4"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            The operating system for craft taprooms.
          </div>
          <div className="text-sm leading-[1.7]" style={{ color: "rgba(255,255,255,0.45)" }}>
            Tap lists · Events · Memberships · Digital displays · POS sync
          </div>
        </div>

        <svg fill="none" style={{ opacity: 0.1 }} viewBox="0 0 320 180" width="100%">
          <circle cx="60" cy="90" fill="white" r="60" />
          <circle cx="180" cy="60" fill="white" r="40" />
          <circle cx="260" cy="110" fill="white" r="30" />
          <rect fill="white" height="4" rx="2" width="280" x="20" y="130" />
          <rect fill="white" height="50" rx="2" width="4" x="60" y="120" />
          <rect fill="white" height="80" rx="2" width="4" x="140" y="90" />
          <rect fill="white" height="65" rx="2" width="4" x="220" y="105" />
        </svg>

        <div className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          © 2026 TaproomOS
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h1 className="text-[24px] font-bold tracking-[-0.4px] mb-1.5" style={{ color: "var(--c-text)" }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm" style={{ color: "var(--c-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
