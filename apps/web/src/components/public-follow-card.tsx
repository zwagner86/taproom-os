import { Button, Card, Input, Label } from "@taproom/ui";

import { createFollowerAction } from "@/server/actions/notifications";

export function PublicFollowCard({
  venueSlug,
  returnPath,
  title = "Stay in the loop",
}: {
  venueSlug: string;
  returnPath: string;
  title?: string;
}) {
  const action = createFollowerAction.bind(null, venueSlug, returnPath);

  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Fan follow</p>
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        <p className="text-sm leading-6 text-ink/65">
          Get event drops, membership updates, and taproom news. Email is the default; SMS is only used when you opt
          in.
        </p>
      </div>

      <form action={action} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`follow-email-${venueSlug}`}>Email</Label>
          <Input id={`follow-email-${venueSlug}`} name="email" placeholder="you@example.com" type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`follow-phone-${venueSlug}`}>Phone</Label>
          <Input id={`follow-phone-${venueSlug}`} name="phone" placeholder="+1 555 123 4567" />
        </div>
        <label className="inline-flex items-center gap-3 text-sm font-semibold text-ink/70 md:col-span-2">
          <input name="sms_opt_in" type="checkbox" />
          I want SMS updates too
        </label>
        <div className="md:col-span-2">
          <Button type="submit">Follow this venue</Button>
        </div>
      </form>
    </Card>
  );
}
