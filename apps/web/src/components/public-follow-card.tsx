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
    <Card>
      <div className="mb-4">
        <div
          className="text-[11px] font-bold uppercase tracking-[0.8px] mb-1"
          style={{ color: "var(--accent)" }}
        >
          Follow this venue
        </div>
        <div className="font-bold text-[18px] tracking-[-0.3px] mb-1" style={{ color: "var(--c-text)" }}>
          {title}
        </div>
        <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
          Get event drops, membership updates, and taproom news. Email is the default; SMS only when you opt in.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`follow-email-${venueSlug}`}>Email</Label>
            <Input id={`follow-email-${venueSlug}`} name="email" placeholder="you@example.com" type="email" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`follow-phone-${venueSlug}`}>Phone</Label>
            <Input id={`follow-phone-${venueSlug}`} name="phone" placeholder="+1 555 123 4567" />
          </div>
        </div>
        <label
          className="flex items-center gap-2 text-[13px] cursor-pointer"
          style={{ color: "var(--c-muted)" }}
        >
          <input name="sms_opt_in" type="checkbox" />
          Send me SMS updates too
        </label>
        <Button type="submit">Follow this venue</Button>
      </form>
    </Card>
  );
}
