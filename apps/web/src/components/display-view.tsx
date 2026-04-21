import type { CSSProperties, ReactNode } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";

import { formatAbv, resolveDisplayedPrice } from "@taproom/domain";
import { Badge, Button, Card, Input, Label } from "@taproom/ui";

import type { Database } from "../../../../supabase/types";
import { type DisplayContent, type DisplaySurface, applyDisplaySurfaceRules, type DisplayViewConfig } from "@/lib/displays";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getMembershipGateCopy } from "@/lib/venue-payment-capability";
import { startMembershipCheckoutAction } from "@/server/actions/memberships";
import { listPublicVenueEvents } from "@/server/repositories/events";
import { listPublicVenueItems } from "@/server/repositories/items";
import { listPublicMembershipPlans } from "@/server/repositories/memberships";
import type { VenueRow } from "@/server/repositories/venues";
import { getVenuePaymentCapability } from "@/server/services/payment-capability";

import { PublicFollowCard } from "./public-follow-card";

type ItemRecord = Database["public"]["Tables"]["items"]["Row"] & {
  item_external_links: Database["public"]["Tables"]["item_external_links"]["Row"][];
};

type EventRecord = Database["public"]["Tables"]["events"]["Row"];
type MembershipPlanRecord = Database["public"]["Tables"]["membership_plans"]["Row"];

const GROUP_LABELS: Record<string, string> = {
  event: "Events",
  food: "Food",
  merch: "Merch",
  pour: "Pours",
};

const TYPE_EMOJI: Record<string, string> = { event: "🎟", food: "🥨", merch: "👕", pour: "🍺" };

export async function DisplayView({
  alerts,
  config,
  venueSlug,
}: {
  alerts?: ReactNode;
  config: DisplayViewConfig;
  venueSlug: string;
}) {
  const resolvedConfig = applyDisplaySurfaceRules(config);

  if (resolvedConfig.content === "events") {
    const { events, venue } = await listPublicVenueEvents(venueSlug);

    if (!venue) {
      notFound();
    }

    return (
      <DisplayShell
        alerts={alerts}
        config={resolvedConfig}
        subtitle={resolvedConfig.showTagline ? venue.tagline : null}
        title={getDisplayTitle(venue, resolvedConfig.content)}
        venue={venue}
      >
        <DisplayEvents config={resolvedConfig} events={events} venueSlug={venueSlug} />
        {resolvedConfig.showFollowCard && (
          <div className="mt-8">
            <PublicFollowCard returnPath={`/v/${venueSlug}/events`} venueSlug={venueSlug} />
          </div>
        )}
      </DisplayShell>
    );
  }

  if (resolvedConfig.content === "memberships") {
    const { plans, venue } = await listPublicMembershipPlans(venueSlug);

    if (!venue) {
      notFound();
    }

    const paymentCapability = resolvedConfig.showMembershipForm
      ? await getVenuePaymentCapability(venue.id)
      : null;

    return (
      <DisplayShell
        alerts={alerts}
        config={resolvedConfig}
        subtitle={resolvedConfig.showTagline ? venue.tagline : null}
        title={getDisplayTitle(venue, resolvedConfig.content)}
        venue={venue}
      >
        <DisplayMemberships
          config={resolvedConfig}
          paymentCapability={paymentCapability}
          plans={plans}
          venue={venue}
          venueSlug={venueSlug}
        />
        {resolvedConfig.showFollowCard && (
          <div className="mt-8">
            <PublicFollowCard returnPath={`/v/${venueSlug}/memberships`} venueSlug={venueSlug} />
          </div>
        )}
      </DisplayShell>
    );
  }

  const { items, venue } = await listPublicVenueItems(venueSlug);

  if (!venue) {
    notFound();
  }

  const filteredItems = filterItemsByContent(items, resolvedConfig.content);

  return (
    <DisplayShell
      alerts={alerts}
      config={resolvedConfig}
      subtitle={resolvedConfig.showTagline ? venue.tagline : null}
      title={getDisplayTitle(venue, resolvedConfig.content)}
      venue={venue}
    >
      <DisplayItems config={resolvedConfig} items={filteredItems} />
      {resolvedConfig.showFollowCard && (
        <div className="mt-8">
          <PublicFollowCard returnPath={getPublicReturnPath(venueSlug, resolvedConfig.content)} venueSlug={venueSlug} />
        </div>
      )}
    </DisplayShell>
  );
}

function DisplayShell({
  alerts,
  children,
  config,
  subtitle,
  title,
  venue,
}: {
  alerts?: ReactNode;
  children: ReactNode;
  config: DisplayViewConfig;
  subtitle: string | null;
  title: string;
  venue: VenueRow;
}) {
  const isTv = config.surface === "tv";
  const isEmbed = config.surface === "embed";
  const wrapperStyle = getShellStyle(venue, config.surface);

  return (
    <main
      className={isTv ? "min-h-screen overflow-hidden px-8 py-7" : isEmbed ? "min-h-screen px-4 py-5" : "mx-auto max-w-6xl px-5 py-10"}
      style={wrapperStyle}
    >
      <div className={isTv ? "mx-auto max-w-[1520px]" : "mx-auto max-w-5xl"}>
        <header className={isTv ? "mb-7 flex items-end justify-between gap-8" : "mb-8"}>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              {config.showLogo && venue.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`${venue.name} logo`}
                  className={isTv ? "h-14 w-14 rounded-2xl border border-white/15 object-cover" : "h-12 w-12 rounded-xl border border-rim object-cover"}
                  src={venue.logo_url}
                />
              )}
              <div>
                {config.showVenueName && (
                  <div
                    className={isTv ? "text-[13px] font-bold uppercase tracking-[0.28em]" : "text-[11px] font-bold uppercase tracking-[0.14em]"}
                    style={{ color: isTv ? "rgba(255,255,255,0.62)" : "var(--accent)" }}
                  >
                    {venue.name}
                  </div>
                )}
                <h1
                  className={isTv ? "text-[54px] font-black leading-none tracking-[-1.4px]" : "text-[36px] font-black tracking-[-0.8px]"}
                  style={{ color: isTv ? "white" : "var(--c-text)", fontFamily: "Lora, serif" }}
                >
                  {title}
                </h1>
              </div>
            </div>
            {subtitle && (
              <p
                className={isTv ? "mt-4 max-w-2xl text-[17px] leading-relaxed" : "mt-3 max-w-3xl text-[15px] leading-relaxed"}
                style={{ color: isTv ? "rgba(255,255,255,0.68)" : "var(--c-muted)" }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {isTv && (
            <div
              className="rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em]"
              style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.72)" }}
            >
              {config.aspect} layout
            </div>
          )}
        </header>

        {alerts && <div className="mb-5">{alerts}</div>}

        {children}
      </div>
    </main>
  );
}

function DisplayItems({
  config,
  items,
}: {
  config: DisplayViewConfig;
  items: ItemRecord[];
}) {
  if (items.length === 0) {
    return <DisplayEmptyState config={config} emoji="🍺" message="Nothing is published for this display yet." />;
  }

  const grouped = groupItems(items, config.content);

  if (config.surface === "tv") {
    return (
      <div className="flex flex-col gap-7">
        {grouped.map((group) => (
          <section key={group.label}>
            <div className="mb-4 text-[13px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.62)" }}>
              {group.label}
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item) => (
                <article
                  className="rounded-[22px] border p-5"
                  key={item.id}
                  style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {TYPE_EMOJI[item.type] ?? "•"} {GROUP_LABELS[item.type] ?? item.type}
                      </div>
                      <h2 className="text-[27px] font-black leading-tight" style={{ fontFamily: "Lora, serif", color: "white" }}>
                        {item.name}
                      </h2>
                    </div>
                    {config.showPrices && resolveItemPrice(item) && (
                      <div className="text-[20px] font-black" style={{ color: "var(--accent)" }}>
                        {resolveItemPrice(item)}
                      </div>
                    )}
                  </div>
                  {buildItemMeta(item, config) && (
                    <div className="text-[14px]" style={{ color: "rgba(255,255,255,0.66)" }}>
                      {buildItemMeta(item, config)}
                    </div>
                  )}
                  {config.showDescriptions && item.description && (
                    <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.74)" }}>
                      {item.description}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border bg-white" style={{ borderColor: "var(--c-border)" }}>
      {grouped.map((group, groupIndex) => (
        <section className={groupIndex > 0 ? "border-t" : ""} key={group.label} style={{ borderColor: "var(--c-border)" }}>
          <div className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--c-muted)" }}>
            {group.label}
          </div>
          <div className="px-5">
            {group.items.map((item, index) => (
              <article
                className={index > 0 ? "border-t py-4" : "py-4"}
                key={item.id}
                style={{ borderColor: "var(--c-border)" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[18px]">{TYPE_EMOJI[item.type] ?? "•"}</span>
                      <h2 className="text-[16px] font-semibold" style={{ color: "var(--c-text)" }}>
                        {item.name}
                      </h2>
                    </div>
                    {buildItemMeta(item, config) && (
                      <div className="mt-1 text-[13px]" style={{ color: "var(--c-muted)" }}>
                        {buildItemMeta(item, config)}
                      </div>
                    )}
                    {config.showDescriptions && item.description && (
                      <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                  {config.showPrices && resolveItemPrice(item) && (
                    <div className="flex-shrink-0 text-[14px] font-semibold" style={{ color: "var(--c-text)" }}>
                      {resolveItemPrice(item)}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DisplayEvents({
  config,
  events,
  venueSlug,
}: {
  config: DisplayViewConfig;
  events: EventRecord[];
  venueSlug: string;
}) {
  if (events.length === 0) {
    return <DisplayEmptyState config={config} emoji="🎟" message="No published events yet." />;
  }

  if (config.surface === "tv") {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <article
            className="rounded-[22px] border p-5"
            key={event.id}
            style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}
          >
            <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>
              {formatDate(event.starts_at)}
            </div>
            <h2 className="text-[27px] font-black leading-tight" style={{ color: "white", fontFamily: "Lora, serif" }}>
              {event.title}
            </h2>
            {config.showDescriptions && event.description && (
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.74)" }}>
                {event.description}
              </p>
            )}
            <div className="mt-4">
              <Badge variant={event.price_cents && event.price_cents > 0 ? "accent" : "success"}>
                {event.price_cents && event.price_cents > 0
                  ? formatCurrency(event.price_cents, event.currency)
                  : "Free RSVP"}
              </Badge>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {events.map((event) => (
        <Card key={event.id} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div
            className="flex-shrink-0 rounded-[10px] py-2.5 text-center"
            style={{ width: 56, background: "var(--accent-light)" }}
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.8px]" style={{ color: "var(--accent-dark)" }}>
              {new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(event.starts_at))}
            </div>
            <div className="text-[22px] font-black leading-tight" style={{ color: "var(--accent-dark)" }}>
              {new Date(event.starts_at).getDate()}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 font-bold text-[17px]" style={{ color: "var(--c-text)" }}>
              {event.title}
            </div>
            <div className="text-[13px]" style={{ color: "var(--c-muted)" }}>
              {formatDate(event.starts_at)}
            </div>
            {config.showDescriptions && event.description && (
              <div className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
                {event.description}
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Badge variant={event.price_cents && event.price_cents > 0 ? "accent" : "success"}>
                {event.price_cents && event.price_cents > 0
                  ? formatCurrency(event.price_cents, event.currency)
                  : "Free RSVP"}
              </Badge>
              {config.showCtas && (
                <Link
                  href={`/v/${venueSlug}/events/${event.slug}`}
                  style={{ color: "var(--accent)" }}
                  target={config.linkTarget === "new-tab" ? "_blank" : undefined}
                >
                  <span className="text-[13px] font-semibold">Open event →</span>
                </Link>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function DisplayMemberships({
  config,
  paymentCapability,
  plans,
  venue,
  venueSlug,
}: {
  config: DisplayViewConfig;
  paymentCapability: Awaited<ReturnType<typeof getVenuePaymentCapability>> | null;
  plans: MembershipPlanRecord[];
  venue: VenueRow;
  venueSlug: string;
}) {
  if (plans.length === 0) {
    return <DisplayEmptyState config={config} emoji="🏷" message="No public membership plans are active yet." />;
  }

  if (config.surface === "tv") {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <article
            className="rounded-[22px] border p-5"
            key={plan.id}
            style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}
          >
            <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>
              {venue.membership_label}
            </div>
            <h2 className="text-[26px] font-black" style={{ color: "white", fontFamily: "Lora, serif" }}>
              {plan.name}
            </h2>
            <div className="mt-2 text-[26px] font-black" style={{ color: "white" }}>
              {formatCurrency(plan.price_cents, plan.currency)}
              <span className="ml-1 text-[13px] font-medium uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.64)" }}>
                / {plan.billing_interval}
              </span>
            </div>
            {config.showDescriptions && plan.description && (
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.74)" }}>
                {plan.description}
              </p>
            )}
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {plans.map((plan) => {
        const action = startMembershipCheckoutAction.bind(null, venueSlug, plan.id);
        const canShowForm = Boolean(config.showMembershipForm && paymentCapability?.canSellMemberships);

        return (
          <Card key={plan.id}>
            <div className="mb-4">
              <div className="mb-1 font-bold text-[18px] tracking-[-0.3px]" style={{ color: "var(--c-text)", fontFamily: "Lora, serif" }}>
                {plan.name}
              </div>
              <div className="mb-2 flex items-baseline gap-1">
                <span className="text-[28px] font-black" style={{ color: "var(--c-text)" }}>
                  {formatCurrency(plan.price_cents, plan.currency)}
                </span>
                <span className="text-[13px]" style={{ color: "var(--c-muted)" }}>/ {plan.billing_interval}</span>
              </div>
              {config.showDescriptions && plan.description && (
                <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
                  {plan.description}
                </p>
              )}
            </div>

            {config.showMembershipForm ? (
              <>
                {paymentCapability && !paymentCapability.canSellMemberships && (
                  <div className="mb-4 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
                    <strong>Membership signup is unavailable right now.</strong> {getMembershipGateCopy()}
                  </div>
                )}
                <form action={action} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`member-name-${plan.id}`}>Your name <span style={{ color: "var(--accent)" }}>*</span></Label>
                    <Input disabled={!canShowForm} id={`member-name-${plan.id}`} name="member_name" required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`member-email-${plan.id}`}>Email</Label>
                    <Input disabled={!canShowForm} id={`member-email-${plan.id}`} name="member_email" type="email" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`member-phone-${plan.id}`}>Phone</Label>
                    <Input disabled={!canShowForm} id={`member-phone-${plan.id}`} name="member_phone" />
                  </div>
                  <Button className="w-full" disabled={!canShowForm} type="submit">
                    Join {plan.name}
                  </Button>
                </form>
              </>
            ) : (
              config.showCtas && (
                <Link
                  href={`/v/${venueSlug}/memberships`}
                  style={{ color: "var(--accent)" }}
                  target={config.linkTarget === "new-tab" ? "_blank" : undefined}
                >
                  <span className="text-[13px] font-semibold">Open {venue.membership_label} page →</span>
                </Link>
              )
            )}
          </Card>
        );
      })}
    </div>
  );
}

function DisplayEmptyState({
  config,
  emoji,
  message,
}: {
  config: DisplayViewConfig;
  emoji: string;
  message: string;
}) {
  return (
    <div
      className="rounded-[22px] border px-6 py-10 text-center"
      style={config.surface === "tv"
        ? {
            background: "rgba(255,255,255,0.06)",
            borderColor: "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.72)",
          }
        : {
            background: "white",
            borderColor: "var(--c-border)",
            color: "var(--c-muted)",
          }}
    >
      <div className="mb-2 text-[34px]">{emoji}</div>
      <p className="text-[14px]">{message}</p>
    </div>
  );
}

function filterItemsByContent(items: ItemRecord[], content: DisplayContent) {
  if (content === "drinks") {
    return items.filter((item) => item.type === "pour");
  }

  if (content === "food") {
    return items.filter((item) => item.type === "food");
  }

  return items;
}

function groupItems(items: ItemRecord[], content: DisplayContent) {
  if (content === "drinks") {
    return [{ label: "On Tap", items }];
  }

  if (content === "food") {
    return [{ label: "Kitchen", items }];
  }

  const order = ["pour", "food", "merch", "event"];
  return order
    .map((type) => ({
      items: items.filter((item) => item.type === type),
      label: GROUP_LABELS[type] ?? type,
    }))
    .filter((group) => group.items.length > 0);
}

function resolveItemPrice(item: ItemRecord) {
  const linkedPrice = item.item_external_links[0];
  return resolveDisplayedPrice(
    { priceSource: item.price_source },
    linkedPrice
      ? {
          priceSnapshotCents: linkedPrice.price_snapshot_cents,
          priceSnapshotCurrency: linkedPrice.price_snapshot_currency,
        }
      : null,
  );
}

function buildItemMeta(item: ItemRecord, config: DisplayViewConfig) {
  return [
    config.showStyleMeta ? item.style_or_category : null,
    config.showAbv ? formatAbv(item.abv) : null,
  ].filter(Boolean).join(" · ");
}

function getDisplayTitle(venue: VenueRow, content: DisplayContent) {
  switch (content) {
    case "drinks":
    case "menu":
      return venue.menu_label;
    case "food":
      return "Food Menu";
    case "events":
      return `${venue.name} happenings`;
    case "memberships":
      return `${venue.membership_label} at ${venue.name}`;
  }
}

function getPublicReturnPath(venueSlug: string, content: DisplayContent) {
  switch (content) {
    case "menu":
      return `/v/${venueSlug}/menu`;
    case "drinks":
      return `/v/${venueSlug}/drinks`;
    case "food":
      return `/v/${venueSlug}/food`;
    case "events":
      return `/v/${venueSlug}/events`;
    case "memberships":
      return `/v/${venueSlug}/memberships`;
  }
}

function getShellStyle(venue: VenueRow, surface: DisplaySurface): CSSProperties {
  const accent = venue.accent_color || "#C96B2C";

  return {
    "--accent": accent,
    "--accent-dark": `color-mix(in srgb, ${accent} 72%, black)`,
    "--accent-light": `color-mix(in srgb, ${accent} 14%, white)`,
    background: surface === "tv"
      ? "radial-gradient(circle at top left, rgba(255,255,255,0.06), transparent 38%), linear-gradient(180deg, oklch(16% 0.02 55), oklch(10% 0.02 55))"
      : "transparent",
    color: surface === "tv" ? "white" : undefined,
  } as CSSProperties;
}
