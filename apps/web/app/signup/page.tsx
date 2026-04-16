export const dynamic = "force-dynamic";

import Link from "next/link";

import { Button, Card, Input, Label } from "@taproom/ui";

import { signUpWithPasswordAction } from "@/server/actions/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <Card className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Create account</p>
          <h1 className="font-display text-4xl text-ink">Start operator access</h1>
          <p className="max-w-2xl text-sm leading-6 text-ink/65">
            MVP onboarding assumes guided setup, but your venue team can still create an account and claim a new
            venue directly from the dashboard.
          </p>
        </div>

        {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}

        <form action={signUpWithPasswordAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input id="signup-email" name="email" placeholder="operator@demo.com" required type="email" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input id="signup-password" minLength={8} name="password" required type="password" />
          </div>
          <div className="md:col-span-2">
            <Button className="w-full" type="submit">
              Create operator account
            </Button>
          </div>
        </form>

        <p className="text-sm text-ink/65">
          Already set up?{" "}
          <Link className="font-semibold text-pine" href="/login">
            Sign in
          </Link>
          .
        </p>
      </Card>
    </main>
  );
}

