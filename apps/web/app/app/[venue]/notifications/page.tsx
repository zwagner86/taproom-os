export const dynamic = "force-dynamic";

import { Button, Card, Input, Label, Select, Textarea } from "@taproom/ui";

import { sendBroadcastAction } from "@/server/actions/notifications";
import { listVenueNotificationLogs } from "@/server/repositories/notifications";
import { requireVenueAccess } from "@/server/repositories/venues";

export default async function VenueNotificationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { venue } = await params;
  const access = await requireVenueAccess(venue);
  const [{ error, message }, logs] = await Promise.all([searchParams, listVenueNotificationLogs(access.venue.id)]);
  const action = sendBroadcastAction.bind(null, venue);

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Notifications</p>
          <h1 className="font-display text-4xl text-ink">Broadcasts and delivery logs</h1>
          <p className="max-w-3xl text-sm leading-6 text-ink/65">
            Transactional sends happen automatically. This page is for small, manual venue announcements to the active
            audience by channel.
          </p>
        </div>
        {message ? <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">{message}</p> : null}
        {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
      </Card>

      <Card>
        <form action={action} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="broadcast-channel">Channel</Label>
              <Select defaultValue="email" id="broadcast-channel" name="channel">
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="broadcast-subject">Subject</Label>
              <Input id="broadcast-subject" name="subject" placeholder={`${access.venue.name} update`} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="broadcast-body">Message</Label>
            <Textarea id="broadcast-body" name="body" placeholder="What should fans know?" required />
          </div>
          <div>
            <Button type="submit">Send broadcast</Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-ink">Recent delivery log</h2>
          <p className="text-sm text-ink/55">{logs.length} entries</p>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm leading-6 text-ink/65">No sends yet. Event, membership, and follow confirmations will begin filling this list automatically.</p>
        ) : (
          <div className="grid gap-3">
            {logs.map((log) => (
              <div className="rounded-3xl border border-ink/10 bg-mist/35 p-4" key={log.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{log.recipient}</p>
                    <p className="text-sm text-ink/60">
                      {log.channel} · {log.template_key} · {log.status}
                    </p>
                  </div>
                  <p className="text-sm text-ink/55">{new Date(log.created_at).toLocaleString()}</p>
                </div>
                {log.error_message ? <p className="mt-2 text-sm text-ember">{log.error_message}</p> : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
