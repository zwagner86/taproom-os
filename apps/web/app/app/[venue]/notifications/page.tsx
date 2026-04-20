export const dynamic = "force-dynamic";

import { Badge, Button, Card, Input, Label, Select, Textarea } from "@taproom/ui";

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
    <div>
      <div className="flex items-start justify-between mb-7 gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.5px] mb-1" style={{ color: "var(--c-text)" }}>
            Notifications
          </h1>
          <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
            Broadcast announcements to your followers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1.4fr] gap-6 items-start">
        {/* Compose */}
        <Card>
          <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>New broadcast</div>

          {message && (
            <div className="mb-4 rounded-[10px] border border-green-200 bg-green-50 px-4 py-3 text-[13px] text-green-800">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
              {error}
            </div>
          )}

          <form action={action} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="broadcast-channel">Channel</Label>
              <Select defaultValue="email" id="broadcast-channel" name="channel">
                <option value="email">✉️ Email</option>
                <option value="sms">📱 SMS</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="broadcast-subject">Subject (email only)</Label>
              <Input id="broadcast-subject" name="subject" placeholder={`${access.venue.name} update`} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="broadcast-body">Message <span style={{ color: "var(--accent)" }}>*</span></Label>
              <Textarea id="broadcast-body" name="body" placeholder="What should fans know?" required rows={4} />
            </div>
            <div
              className="rounded-lg px-3 py-2.5 text-[12px] leading-relaxed"
              style={{ background: "var(--c-bg2)", color: "var(--c-muted)" }}
            >
              Sending to all active followers for this channel.
            </div>
            <Button className="w-full" type="submit">Send broadcast</Button>
          </form>
        </Card>

        {/* Log */}
        <div>
          <div
            className="text-[13px] font-bold uppercase tracking-[0.8px] mb-3"
            style={{ color: "var(--c-muted)" }}
          >
            Recent sends
          </div>
          {logs.length === 0 ? (
            <Card>
              <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
                No sends yet. Transactional notifications and broadcasts will appear here.
              </p>
            </Card>
          ) : (
            <Card style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid var(--c-border)" }}>
                    {["Recipient", "Via", "Status", "Sent"].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "var(--c-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? "1px solid var(--c-border)" : "none" }}>
                      <td style={{ padding: "11px 12px", fontSize: 13 }}>{log.recipient}</td>
                      <td style={{ padding: "11px 12px" }}>
                        <Badge variant={log.channel === "email" ? "info" : "accent"}>{log.channel}</Badge>
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <div>
                          <Badge variant={log.status === "sent" ? "success" : "error"}>{log.status}</Badge>
                          {log.error_message && (
                            <div className="text-[11px] mt-1" style={{ color: "oklch(45% 0.18 20)" }}>
                              {log.error_message}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "11px 12px", fontSize: 12, color: "var(--c-muted)" }}>
                        {new Date(log.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
