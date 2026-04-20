export const dynamic = "force-dynamic";

import { Badge, Card } from "@taproom/ui";

import { listVenueFollowers } from "@/server/repositories/followers";
import { requireVenueAccess } from "@/server/repositories/venues";

export default async function VenueFollowersPage({ params }: { params: Promise<{ venue: string }> }) {
  const { venue } = await params;
  const { venue: venueRecord } = await requireVenueAccess(venue);
  const followers = await listVenueFollowers(venueRecord.id);
  const activeFollowers = followers.filter((f) => f.active);
  const emailCount = activeFollowers.filter(
    (f) => Array.isArray(f.channel_preferences) && f.channel_preferences.includes("email"),
  ).length;
  const smsCount = activeFollowers.filter(
    (f) => Array.isArray(f.channel_preferences) && f.channel_preferences.includes("sms"),
  ).length;

  return (
    <div>
      <div className="flex items-start justify-between mb-7 gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.5px] mb-1" style={{ color: "var(--c-text)" }}>
            Followers
          </h1>
          <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
            Opted-in fans who want to hear from you.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total followers", value: activeFollowers.length, icon: "👥" },
          { label: "Email opt-in", value: emailCount, icon: "✉️" },
          { label: "SMS opt-in", value: smsCount, icon: "📱" },
        ].map((s) => (
          <Card key={s.label} style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div>
              <div className="text-[26px] font-black" style={{ color: "var(--c-text)" }}>{s.value}</div>
              <div className="text-xs" style={{ color: "var(--c-muted)" }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Table */}
      {followers.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div style={{ fontSize: 32 }}>📭</div>
            <div className="font-semibold text-[15px]" style={{ color: "var(--c-text)" }}>No followers yet</div>
            <div className="text-[13.5px] max-w-xs leading-relaxed" style={{ color: "var(--c-muted)" }}>
              Public menu, event, and membership pages include follow capture.
            </div>
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid var(--c-border)" }}>
                  {["Email", "Phone", "Channels", "Opted in", "Status"].map((h) => (
                    <th
                      key={h}
                      style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "var(--c-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {followers.map((follower, i) => (
                  <tr
                    key={follower.id}
                    style={{ borderBottom: i < followers.length - 1 ? "1px solid var(--c-border)" : "none" }}
                  >
                    <td style={{ padding: "11px 12px", fontWeight: 500, color: "var(--c-text)" }}>
                      {follower.email ?? "—"}
                    </td>
                    <td style={{ padding: "11px 12px", color: "var(--c-muted)" }}>
                      {follower.phone ?? "—"}
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      <div className="flex gap-1 flex-wrap">
                        {Array.isArray(follower.channel_preferences) &&
                          follower.channel_preferences.map((c: string) => (
                            <Badge key={c} variant={c === "email" ? "info" : "accent"}>{c}</Badge>
                          ))}
                      </div>
                    </td>
                    <td style={{ padding: "11px 12px", color: "var(--c-muted)", fontSize: 13 }}>
                      {new Date(follower.consented_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      <Badge variant={follower.active ? "success" : "default"}>
                        {follower.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
