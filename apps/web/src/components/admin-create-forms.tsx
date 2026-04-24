"use client";

import { Button, FieldHint, FieldLabel, Input, Select, Textarea } from "@/components/ui";

import { DateTimeField } from "@/components/date-time-field";
import { toDateTimeLocal } from "@/lib/utils";
import { getMembershipGateCopy, getPaidEventGateCopy } from "@/lib/venue-payment-capability";

type EventFormValues = {
  capacity?: number | null;
  currency?: string;
  description?: string | null;
  ends_at?: string | null;
  id?: string;
  price_cents?: number | null;
  starts_at?: string | null;
  status?: string;
  title?: string;
};

export function EventForm({
  action,
  canSellPaidEvents,
  defaultValues,
  disabled = false,
  mode = "create",
  paidEventGateCopy = getPaidEventGateCopy(),
}: {
  action: (formData: FormData) => void | Promise<void>;
  canSellPaidEvents: boolean;
  defaultValues?: EventFormValues;
  disabled?: boolean;
  mode?: "create" | "edit";
  paidEventGateCopy?: string;
}) {
  const isEdit = mode === "edit";
  const idPrefix = isEdit && defaultValues?.id ? `event-${defaultValues.id}` : "create";
  const statusOptions = isEdit
    ? [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
        { label: "Cancelled", value: "cancelled" },
      ]
    : [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ];

  return (
    <form action={action} className="flex flex-col gap-3">
      <fieldset className="contents" disabled={disabled}>
        {isEdit && defaultValues?.id && <input name="event_id" type="hidden" value={defaultValues.id} />}
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor={`${idPrefix}-title`} required>Title</FieldLabel>
          <Input
            aria-describedby={`${idPrefix}-title-hint`}
            defaultValue={defaultValues?.title ?? ""}
            id={`${idPrefix}-title`}
            name="title"
            placeholder="Trivia Night"
            required
          />
          <FieldHint id={`${idPrefix}-title-hint`}>
            {isEdit
              ? "This is the headline shown on the public event page, check-in list, and admin calendar."
              : "This title appears on the public event page, check-in screen, and admin event list."}
          </FieldHint>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="flex flex-col gap-1">
            <FieldLabel
              htmlFor={`${idPrefix}-capacity`}
              info="Capacity limits how many total seats or spots can be booked for the event."
            >
              Capacity
            </FieldLabel>
            <Input
              aria-describedby={`${idPrefix}-capacity-hint`}
              defaultValue={defaultValues?.capacity ?? ""}
              id={`${idPrefix}-capacity`}
              name="capacity"
              placeholder={isEdit ? "Open" : "80"}
              type="number"
            />
            <FieldHint id={`${idPrefix}-capacity-hint`}>
              Leave this blank if the event does not have a booking cap.
            </FieldHint>
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel
              htmlFor={`${idPrefix}-price`}
              info="Prices are stored in cents, so enter 1500 for a $15.00 ticket."
            >
              Price (cents)
            </FieldLabel>
            <Input
              aria-describedby={`${idPrefix}-price-hint${!canSellPaidEvents ? ` ${idPrefix}-price-gate` : ""}`}
              defaultValue={defaultValues?.price_cents ?? ""}
              id={`${idPrefix}-price`}
              name="price_cents"
              placeholder={isEdit ? "Leave empty for free" : "1500"}
              type="number"
            />
            <FieldHint id={`${idPrefix}-price-hint`}>Leave this blank or set it to `0` to make the event free.</FieldHint>
            {!canSellPaidEvents && (
              <span className="text-xs text-amber-600" id={`${idPrefix}-price-gate`}>{paidEventGateCopy}</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel
              htmlFor={`${idPrefix}-status`}
              info="Draft keeps the event hidden until you are ready. Published shows it on public event listings."
            >
              Status
            </FieldLabel>
            <Select
              aria-describedby={`${idPrefix}-status-hint`}
              defaultValue={defaultValues?.status ?? "draft"}
              id={`${idPrefix}-status`}
              name="status"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldHint id={`${idPrefix}-status-hint`}>
              {isEdit
                ? "Choose how this event should behave on public pages and in internal event lists."
                : "Start with Draft if you still need to confirm details before guests can see the event."}
            </FieldHint>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <DateTimeField
            hint="Set the local start date and time that should appear on tickets, listings, and check-in tools."
            info="Use your venue's local time. This field is required for every event."
            label="Starts at"
            name="starts_at"
            required
            defaultValue={defaultValues?.starts_at ? toDateTimeLocal(defaultValues.starts_at) : undefined}
          />
          <DateTimeField
            hint="Optional. Add an end time if you want guests and staff to see when the event wraps up."
            info="Leave this empty for open-ended events or when only the start time matters."
            label="Ends at"
            name="ends_at"
            defaultValue={defaultValues?.ends_at ? toDateTimeLocal(defaultValues.ends_at) : undefined}
          />
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor={`${idPrefix}-desc`}>Description</FieldLabel>
          <Textarea
            aria-describedby={`${idPrefix}-desc-hint`}
            defaultValue={defaultValues?.description ?? ""}
            id={`${idPrefix}-desc`}
            name="description"
            placeholder="Short event copy for the public page"
            rows={isEdit ? 3 : 2}
          />
          <FieldHint id={`${idPrefix}-desc-hint`}>
            Optional copy shown on the public event page and on displays when descriptions are enabled.
          </FieldHint>
        </div>
        <div className="flex gap-2">
          <Button type="submit">{isEdit ? "Save changes" : "Create event"}</Button>
        </div>
      </fieldset>
    </form>
  );
}

export function EventCreateForm(props: Omit<Parameters<typeof EventForm>[0], "mode">) {
  return <EventForm {...props} mode="create" />;
}

type MembershipPlanFormValues = {
  active?: boolean;
  billing_interval?: string;
  description?: string | null;
  id?: string;
  name?: string;
  price_cents?: number | null;
};

export function MembershipPlanForm({
  action,
  canSellMemberships,
  defaultValues,
  disabled = false,
  mode = "create",
}: {
  action: (formData: FormData) => void | Promise<void>;
  canSellMemberships: boolean;
  defaultValues?: MembershipPlanFormValues;
  disabled?: boolean;
  mode?: "create" | "edit";
}) {
  const isEdit = mode === "edit";
  const idPrefix = isEdit && defaultValues?.id ? `plan-${defaultValues.id}` : "create-plan";

  return (
    <form action={action} className="flex flex-col gap-3">
      <fieldset className="contents" disabled={disabled}>
        {isEdit && defaultValues?.id && <input name="plan_id" type="hidden" value={defaultValues.id} />}
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor={`${idPrefix}-name`} required>Plan name</FieldLabel>
          <Input
            aria-describedby={`${idPrefix}-name-hint`}
            defaultValue={defaultValues?.name ?? ""}
            id={`${idPrefix}-name`}
            name="name"
            placeholder="Mug Club Gold"
            required
          />
          <FieldHint id={`${idPrefix}-name-hint`}>
            {isEdit
              ? "This name appears on internal plan lists, Stripe-backed memberships, and your public signup page."
              : "This is the public and internal name for the membership option guests can choose."}
          </FieldHint>
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor={`${idPrefix}-desc`}>Description</FieldLabel>
          <Textarea
            aria-describedby={`${idPrefix}-desc-hint`}
            defaultValue={defaultValues?.description ?? ""}
            id={`${idPrefix}-desc`}
            name="description"
            placeholder="What members get each cycle"
            rows={2}
          />
          <FieldHint id={`${idPrefix}-desc-hint`}>
            Describe the perks, pours, discounts, or pickups members receive each billing cycle.
          </FieldHint>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <FieldLabel
              htmlFor={`${idPrefix}-price`}
              info="Membership prices are stored in cents, so 2500 becomes $25.00 on the public page and checkout."
              required
            >
              Price (cents)
            </FieldLabel>
            <Input
              aria-describedby={`${idPrefix}-price-hint${!canSellMemberships ? ` ${idPrefix}-price-gate` : ""}`}
              defaultValue={defaultValues?.price_cents ?? ""}
              id={`${idPrefix}-price`}
              name="price_cents"
              placeholder="2500"
              type="number"
            />
            <FieldHint id={`${idPrefix}-price-hint`}>Enter the recurring charge amount in cents for each billing interval.</FieldHint>
            {!canSellMemberships && (
              <span className="text-xs text-amber-600" id={`${idPrefix}-price-gate`}>{getMembershipGateCopy()}</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel
              htmlFor={`${idPrefix}-interval`}
              info="Billing interval decides how often members renew and how the plan is labeled publicly."
            >
              Billing interval
            </FieldLabel>
            <Select
              aria-describedby={`${idPrefix}-interval-hint`}
              defaultValue={defaultValues?.billing_interval ?? "month"}
              id={`${idPrefix}-interval`}
              name="billing_interval"
            >
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
              <option value="year">Yearly</option>
            </Select>
            <FieldHint id={`${idPrefix}-interval-hint`}>
              Choose the cadence for billing and benefits, such as monthly pours or yearly mug renewals.
            </FieldHint>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="flex cursor-pointer items-center gap-2 text-[13.5px]" htmlFor={`${idPrefix}-active`} style={{ color: "var(--c-text)" }}>
            <input
              aria-describedby={`${idPrefix}-active-hint`}
              defaultChecked={defaultValues?.active ?? true}
              id={`${idPrefix}-active`}
              name="active"
              type="checkbox"
            />
            Allow public signup
          </label>
          <FieldHint id={`${idPrefix}-active-hint`}>
            Leave this on if guests should be able to join immediately from your public membership page.
          </FieldHint>
        </div>
        <Button type="submit">{isEdit ? "Save plan" : "Create plan"}</Button>
      </fieldset>
    </form>
  );
}

export function MembershipPlanCreateForm(props: Omit<Parameters<typeof MembershipPlanForm>[0], "mode">) {
  return <MembershipPlanForm {...props} mode="create" />;
}

export function BroadcastCreateForm({
  action,
  disabled = false,
  sendContext,
  venueName,
}: {
  action: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
  sendContext: string;
  venueName: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3">
      <fieldset className="contents" disabled={disabled}>
        <div className="flex flex-col gap-1">
          <FieldLabel
            htmlFor="broadcast-channel"
            info="Email sends to followers who opted into email. SMS sends to followers who provided a phone number and opted into text updates."
          >
            Channel
          </FieldLabel>
          <Select aria-describedby="broadcast-channel-hint" defaultValue="email" id="broadcast-channel" name="channel">
            <option value="email">Email</option>
            <option value="sms">SMS</option>
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
            placeholder={`${venueName} update`}
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
          {sendContext}
        </div>
        <Button className="w-full" type="submit">Send broadcast</Button>
      </fieldset>
    </form>
  );
}

export function CheckInSessionCreateForm({
  action,
  disabled = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
}) {
  return (
    <form action={action} className="grid gap-3">
      <fieldset className="contents" disabled={disabled}>
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="session-name">Session name</FieldLabel>
          <Input
            aria-describedby="session-name-hint"
            defaultValue="Shared check-in"
            id="session-name"
            name="session_name"
          />
          <FieldHint id="session-name-hint">
            Give the shared session a clear name so staff know which link to use at the door.
          </FieldHint>
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel
            htmlFor="session-pin"
            info="Add a PIN if you want staff to enter a short code before they can use the shared check-in page."
          >
            PIN (optional)
          </FieldLabel>
          <Input aria-describedby="session-pin-hint" id="session-pin" name="pin" placeholder="Leave blank for no PIN" />
          <FieldHint id="session-pin-hint">
            Leave this blank for faster access, or set a short code if the shared link may circulate beyond your staff.
          </FieldHint>
        </div>
        <Button type="submit">Create shared session</Button>
      </fieldset>
    </form>
  );
}
