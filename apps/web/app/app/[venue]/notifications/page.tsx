export const dynamic = "force-dynamic";

import { Alert, Badge, Card, PageHeader } from "@/components/ui";

import { AdminCreateDrawer } from "@/components/admin-create-drawer";
import { BroadcastCreateForm } from "@/components/admin-create-forms";
import { DemoVenueNotificationsPage } from "@/components/demo-venue-notifications-page";
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

  if (access.isDemoVenue) {
    return (
      <DemoVenueNotificationsPage
        initialError={error}
        initialLogs={logs}
        initialVenue={access.venue}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <AdminCreateDrawer
            description="Compose a broadcast for followers who opted into email or SMS."
            title="New broadcast"
            triggerLabel="New broadcast"
          >
            <BroadcastCreateForm
              action={action}
              disabled={access.isDemoVenue}
              sendContext="Sending to all active followers for this channel."
              venueName={access.venue.name}
            />
          </AdminCreateDrawer>
        }
        subtitle="Broadcast announcements to your followers."
        title="Notifications"
      />

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

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
  );
}
