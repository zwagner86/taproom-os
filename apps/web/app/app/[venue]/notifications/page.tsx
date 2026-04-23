export const dynamic = "force-dynamic";

import { Alert, Badge, Button, Card, FieldHint, FieldLabel, Input, PageHeader, Select, Textarea } from "@/components/ui";

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
      <PageHeader subtitle="Broadcast announcements to your followers." title="Notifications" />

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.4fr]">
        {/* Compose */}
        <Card>
          <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>New broadcast</div>

          <form action={action} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <FieldLabel
                htmlFor="broadcast-channel"
                info="Email sends to followers who opted into email. SMS sends to followers who provided a phone number and opted into text updates."
              >
                Channel
              </FieldLabel>
              <Select aria-describedby="broadcast-channel-hint" defaultValue="email" id="broadcast-channel" name="channel">
                <option value="email">✉️ Email</option>
                <option value="sms">📱 SMS</option>
              </Select>
              <FieldHint id="broadcast-channel-hint">
                Choose which group of opted-in followers should receive this broadcast.
              </FieldHint>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel
                htmlFor="broadcast-subject"
                info="Subject lines are only used for email sends. SMS broadcasts ignore this field."
              >
                Subject (email only)
              </FieldLabel>
              <Input
                aria-describedby="broadcast-subject-hint"
                id="broadcast-subject"
                name="subject"
                placeholder={`${access.venue.name} update`}
              />
              <FieldHint id="broadcast-subject-hint">
                Keep it short so email recipients can understand the update at a glance.
              </FieldHint>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel
                htmlFor="broadcast-body"
                info="Write the full message you want followers to receive. Keep SMS sends shorter, because long text messages may be split by carriers."
                required
              >
                Message
              </FieldLabel>
              <Textarea
                aria-describedby="broadcast-body-hint"
                id="broadcast-body"
                name="body"
                placeholder="What should fans know?"
                required
                rows={4}
              />
              <FieldHint id="broadcast-body-hint">
                This message is sent as-is to all active followers for the selected channel.
              </FieldHint>
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
