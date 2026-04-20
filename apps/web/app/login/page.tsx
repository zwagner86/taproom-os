export const dynamic = "force-dynamic";

import Link from "next/link";

import { Button, Input, Label } from "@taproom/ui";

import { AuthLayout } from "@/components/auth-layout";
import { signInWithMagicLinkAction, signInWithPasswordAction } from "@/server/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string; mode?: string }>;
}) {
  const { error, message, next, mode } = await searchParams;
  const isMagic = mode === "magic";

  return (
    <AuthLayout subtitle="Log in to your TaproomOS account." title="Welcome back">
      {error && (
        <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-[10px] border border-green-200 bg-green-50 px-4 py-3 text-[13px] text-green-800">
          {message}
        </div>
      )}

      {/* Mode switcher */}
      <div
        className="flex gap-0 rounded-lg border border-rim p-[3px] mb-4"
        style={{ background: "var(--c-bg2)" }}
      >
        {(["password", "magic"] as const).map((m) => (
          <Link
            className="flex-1 rounded-md py-[7px] text-center text-[13px] transition-all no-underline"
            href={m === "magic" ? "/login?mode=magic" : "/login"}
            key={m}
            style={{
              background: (isMagic ? m === "magic" : m === "password") ? "#fff" : "transparent",
              fontWeight: (isMagic ? m === "magic" : m === "password") ? 600 : 400,
              color: (isMagic ? m === "magic" : m === "password") ? "var(--c-text)" : "var(--c-muted)",
              boxShadow: (isMagic ? m === "magic" : m === "password")
                ? "0 1px 3px rgba(0,0,0,0.08)"
                : "none",
            }}
          >
            {m === "password" ? "Password" : "Magic link"}
          </Link>
        ))}
      </div>

      {!isMagic ? (
        <form action={signInWithPasswordAction} className="flex flex-col gap-4">
          <input name="next" type="hidden" value={next ?? "/"} />
          <div className="flex flex-col gap-1">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" name="email" placeholder="you@yourbrewery.com" required type="email" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" placeholder="Your password" required type="password" />
          </div>
          <Button className="w-full" size="lg" type="submit">
            Log in
          </Button>
        </form>
      ) : (
        <form action={signInWithMagicLinkAction} className="flex flex-col gap-4">
          <input name="next" type="hidden" value={next ?? "/"} />
          <div className="flex flex-col gap-1">
            <Label htmlFor="magic-email">Email address</Label>
            <Input id="magic-email" name="email" placeholder="you@yourbrewery.com" required type="email" />
          </div>
          <div
            className="rounded-lg px-3 py-2.5 text-[12.5px] leading-relaxed"
            style={{ background: "var(--c-bg2)", color: "var(--c-muted)" }}
          >
            We'll email you a secure one-click link — no password needed.
          </div>
          <Button className="w-full" size="lg" type="submit">
            Send magic link
          </Button>
        </form>
      )}

      <div className="mt-4 text-center text-[13.5px]" style={{ color: "var(--c-muted)" }}>
        Don't have an account?{" "}
        <Link className="font-semibold" href="/signup" style={{ color: "var(--accent)" }}>
          Sign up
        </Link>
      </div>
    </AuthLayout>
  );
}
