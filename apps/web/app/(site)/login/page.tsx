export const dynamic = "force-dynamic";

import Link from "next/link";

import { Alert, Button, Input, Label } from "@/components/ui";
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
      <div className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}
        {message && <Alert variant="success">{message}</Alert>}

        <div className="rounded-2xl border border-border bg-secondary/60 p-1">
          <div className="grid grid-cols-2 gap-1">
            {(["password", "magic"] as const).map((value) => {
              const selected = isMagic ? value === "magic" : value === "password";

              return (
                <Link
                  className={`rounded-xl px-3 py-2 text-center text-sm transition ${
                    selected
                      ? "bg-background font-semibold text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  href={value === "magic" ? "/login?mode=magic" : "/login"}
                  key={value}
                >
                  {value === "password" ? "Password" : "Magic link"}
                </Link>
              );
            })}
          </div>
        </div>

        {!isMagic ? (
          <form action={signInWithPasswordAction} className="space-y-4">
            <input name="next" type="hidden" value={next ?? "/"} />
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" name="email" placeholder="you@yourbrewery.com" required type="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" placeholder="Your password" required type="password" />
            </div>
            <Button className="w-full" size="lg" type="submit">
              Log in
            </Button>
          </form>
        ) : (
          <form action={signInWithMagicLinkAction} className="space-y-4">
            <input name="next" type="hidden" value={next ?? "/"} />
            <div className="space-y-1.5">
              <Label htmlFor="magic-email">Email address</Label>
              <Input id="magic-email" name="email" placeholder="you@yourbrewery.com" required type="email" />
            </div>
            <div className="rounded-2xl border border-border bg-secondary/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
              We’ll email you a secure one-click link so you can sign in without a password.
            </div>
            <Button className="w-full" size="lg" type="submit">
              Send magic link
            </Button>
          </form>
        )}

        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link className="font-semibold text-primary" href="/signup">
            Sign up
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
