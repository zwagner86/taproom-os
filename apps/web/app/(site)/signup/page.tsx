export const dynamic = "force-dynamic";

import Link from "next/link";

import { Button, Input, Label } from "@taproom/ui";

import { AuthLayout } from "@/components/auth-layout";
import { signUpWithPasswordAction } from "@/server/actions/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthLayout subtitle="Start managing your taproom in minutes." title="Create your account">
      {error && (
        <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {error}
        </div>
      )}

      <form action={signUpWithPasswordAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="signup-email">Email address <span style={{ color: "var(--accent)" }}>*</span></Label>
          <Input id="signup-email" name="email" placeholder="you@yourbrewery.com" required type="email" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="signup-password">Password <span style={{ color: "var(--accent)" }}>*</span></Label>
          <Input id="signup-password" minLength={8} name="password" placeholder="8+ characters" required type="password" />
          <span className="text-xs" style={{ color: "var(--c-muted)" }}>At least 8 characters.</span>
        </div>
        <Button className="w-full" size="lg" type="submit">
          Create account
        </Button>
      </form>

      <div className="mt-4 text-center text-[13.5px]" style={{ color: "var(--c-muted)" }}>
        Already have an account?{" "}
        <Link className="font-semibold" href="/login" style={{ color: "var(--accent)" }}>
          Log in
        </Link>
      </div>
    </AuthLayout>
  );
}
