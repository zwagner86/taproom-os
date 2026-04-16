export const dynamic = "force-dynamic";

import Link from "next/link";

import { Button, Card, Input, Label } from "@taproom/ui";

import { signInWithMagicLinkAction, signInWithPasswordAction } from "@/server/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { error, message, next } = await searchParams;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Sign in</p>
            <h1 className="font-display text-4xl text-ink">Taproom operators stay mobile.</h1>
            <p className="text-sm leading-6 text-ink/65">
              Use password auth for everyday admin access or send a magic link when you need the fastest path in.
            </p>
          </div>

          {message ? <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">{message}</p> : null}
          {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}

          <form action={signInWithPasswordAction} className="space-y-4">
            <input name="next" type="hidden" value={next ?? "/"} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" placeholder="operator@demo.com" required type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" required type="password" />
            </div>
            <Button className="w-full" type="submit">
              Sign in with password
            </Button>
          </form>
        </Card>

        <Card className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Magic link</p>
            <h2 className="font-display text-3xl text-ink">Need a lighter lift?</h2>
            <p className="text-sm leading-6 text-ink/65">
              Send a one-click link to the same email you use for your venue or platform-admin account.
            </p>
          </div>

          <form action={signInWithMagicLinkAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="magic-email">Email</Label>
              <Input id="magic-email" name="email" placeholder="operator@demo.com" required type="email" />
            </div>
            <Button className="w-full" type="submit" variant="secondary">
              Email me a magic link
            </Button>
          </form>

          <p className="text-sm text-ink/65">
            Need an account first?{" "}
            <Link className="font-semibold text-pine" href="/signup">
              Create one here
            </Link>
            .
          </p>
        </Card>
      </section>
    </main>
  );
}

