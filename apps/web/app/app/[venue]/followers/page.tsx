export const dynamic = "force-dynamic";

import { Card } from "@taproom/ui";

import { listVenueFollowers } from "@/server/repositories/followers";
import { requireVenueAccess } from "@/server/repositories/venues";

export default async function VenueFollowersPage({ params }: { params: Promise<{ venue: string }> }) {
  const { venue } = await params;
  const { venue: venueRecord } = await requireVenueAccess(venue);
  const followers = await listVenueFollowers(venueRecord.id);
  const emailCount = followers.filter(
    (follower) => Array.isArray(follower.channel_preferences) && follower.channel_preferences.includes("email"),
  ).length;
  const smsCount = followers.filter(
    (follower) => Array.isArray(follower.channel_preferences) && follower.channel_preferences.includes("sms"),
  ).length;

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Followers</p>
          <h1 className="font-display text-4xl text-ink">Audience list</h1>
          <p className="max-w-3xl text-sm leading-6 text-ink/65">
            Public follow forms feed this lightweight audience list. It stays deliberately simple in MVP: email, SMS,
            consent time, and active state.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-2">
          <p className="text-sm font-semibold text-ink">Total followers</p>
          <p className="font-display text-4xl text-ink">{followers.length}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-semibold text-ink">Email opted in</p>
          <p className="font-display text-4xl text-ink">{emailCount}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-semibold text-ink">SMS opted in</p>
          <p className="font-display text-4xl text-ink">{smsCount}</p>
        </Card>
      </div>

      <Card className="space-y-4">
        {followers.length === 0 ? (
          <p className="text-sm leading-6 text-ink/65">No followers yet. Public menu, event, and membership pages now include follow capture.</p>
        ) : (
          <div className="grid gap-3">
            {followers.map((follower) => (
              <div className="rounded-3xl border border-ink/10 bg-mist/35 p-4" key={follower.id}>
                <p className="font-semibold text-ink">{follower.email ?? follower.phone ?? "Unknown contact"}</p>
                <p className="text-sm text-ink/60">
                  Channels:{" "}
                  {Array.isArray(follower.channel_preferences) ? follower.channel_preferences.join(", ") || "none" : "none"}
                </p>
                <p className="text-sm text-ink/55">Consented {new Date(follower.consented_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
