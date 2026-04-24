export const dynamic = "force-dynamic";

import Link from "next/link";

import { Alert, Button, Input, Label } from "@/components/ui";
import { AuthLayout } from "@/components/auth-layout";
import { signUpWithPasswordAction } from "@/server/actions/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const nextParams = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <AuthLayout subtitle="Start managing your taproom in minutes." title="Create your account">
      <div className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}

        <form action={signUpWithPasswordAction} className="space-y-4">
          <input name="next" type="hidden" value={next ?? "/"} />
          <div className="space-y-1.5">
            <Label htmlFor="signup-email">
              Email address <span className="text-primary">*</span>
            </Label>
            <Input id="signup-email" name="email" placeholder="you@yourbrewery.com" required type="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signup-password">
              Password <span className="text-primary">*</span>
            </Label>
            <Input
              id="signup-password"
              minLength={8}
              name="password"
              placeholder="8+ characters"
              required
              type="password"
            />
            <div className="text-xs leading-5 text-muted-foreground">Use at least 8 characters.</div>
          </div>
          <Button className="w-full" size="lg" type="submit">
            Create account
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-semibold text-primary" href={`/login${nextParams}`}>
            Log in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
