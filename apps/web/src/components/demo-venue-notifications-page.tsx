"use client";

import { useEffect, useState } from "react";

import { AdminCreateDrawer } from "@/components/admin-create-drawer";
import { BroadcastCreateForm } from "@/components/admin-create-forms";
import { DemoMutationAlert } from "@/components/demo-mutation-alert";
import { useDemoVenue } from "@/components/demo-venue-provider";
import { Alert, Badge, Card, PageHeader } from "@/components/ui";
import type { DemoNotificationLogRecord } from "@/lib/demo-venue-state";
import type { VenueRow } from "@/server/repositories/venues";

export function DemoVenueNotificationsPage({
  initialError,
  initialLogs,
  initialVenue,
}: {
  initialError?: string;
  initialLogs: DemoNotificationLogRecord[];
  initialVenue: VenueRow;
}) {
  const { dispatchSeedNotifications, sendBroadcast, state } = useDemoVenue();
  const venue = state.venue ?? initialVenue;
  const logs = state.notifications.logs ?? initialLogs;
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [result, setResult] = useState<ReturnType<typeof sendBroadcast> | null>(null);

  useEffect(() => {
    dispatchSeedNotifications(initialLogs);
  }, [dispatchSeedNotifications, initialLogs]);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <AdminCreateDrawer
            description="Compose a broadcast for followers who opted into email or SMS."
            title="New broadcast"
            triggerLabel="New broadcast"
          >
            {({ close }) => (
              <BroadcastCreateForm
                action={async (formData) => {
                  try {
                    setError(null);
                    setResult(sendBroadcast(formData));
                    close();
                  } catch (nextError) {
                    setResult(null);
                    setError(nextError instanceof Error ? nextError.message : "Unable to send the demo broadcast.");
                  }
                }}
                sendContext="Sending to the current demo audience preview only."
                venueName={venue.name}
              />
            )}
          </AdminCreateDrawer>
        }
        subtitle="Broadcast announcements to your followers."
        title="Notifications"
      />

      <div className="space-y-4">
        <DemoMutationAlert onDismiss={() => setResult(null)} result={result} />
        {error && (
          <Alert onDismiss={() => setError(null)} variant="error">
            {error}
          </Alert>
        )}
      </div>

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
                  {["Recipient", "Via", "Status", "Sent"].map((header) => (
                    <th key={header} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "var(--c-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={log.id} style={{ borderBottom: index < logs.length - 1 ? "1px solid var(--c-border)" : "none" }}>
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
