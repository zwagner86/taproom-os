import { Button, Card, Input, Label } from "@/components/ui";
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
    <Card
      className="overflow-hidden border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,242,234,0.92))] shadow-[0_18px_48px_rgba(80,54,31,0.06)]"
      style={{ padding: 0 }}
    >
      <div className="border-b border-border/70 px-6 py-5">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Follow this venue</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{title}</div>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Get event drops, membership updates, and taproom news. Email is the default; SMS only when you opt in.
        </p>
      </div>

      <div className="px-6 py-6">
        <form action={action} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`follow-email-${venueSlug}`}>Email</Label>
              <Input id={`follow-email-${venueSlug}`} name="email" placeholder="you@example.com" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`follow-phone-${venueSlug}`}>Phone</Label>
              <Input id={`follow-phone-${venueSlug}`} name="phone" placeholder="+1 555 123 4567" />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white/60 px-4 py-3 text-sm leading-6 text-muted-foreground">
            <input className="mt-1 h-4 w-4 accent-[var(--accent)]" name="sms_opt_in" type="checkbox" />
            <span>Send me SMS updates too</span>
          </label>

          <Button type="submit">Follow this venue</Button>
        </form>
      </div>
    </Card>
  );
}
