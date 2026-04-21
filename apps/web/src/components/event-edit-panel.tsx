"use client";

import { useState } from "react";

import { Button, FieldHint, FieldLabel, Input, Select, Textarea } from "@taproom/ui";

import { DateTimeField } from "./date-time-field";
import { toDateTimeLocal } from "@/lib/utils";

type EventEditPanelProps = {
  action: (formData: FormData) => Promise<void>;
  event: {
    id: string;
    title: string;
    status: string;
    capacity: number | null;
    price_cents: number | null;
    currency: string;
    starts_at: string;
    description: string | null;
  };
  canSellPaidEvents: boolean;
  paidEventGateCopy: string;
};

export function EventEditPanel({ action, canSellPaidEvents, event, paidEventGateCopy }: EventEditPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex-shrink-0" style={{ position: "relative" }}>
      <Button onClick={() => setOpen(true)} size="sm" type="button" variant="secondary">
        Edit
      </Button>

      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
            }}
          />
          <div
            className="rounded-xl border border-rim bg-white shadow-modal p-4"
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              zIndex: 50,
              width: 480,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>
                Edit event
              </span>
              <Button
                onClick={() => setOpen(false)}
                size="sm"
                type="button"
                variant="ghost"
                style={{ color: "var(--c-muted)", padding: "2px 6px" }}
              >
                ✕
              </Button>
            </div>

            <form action={action} className="flex flex-col gap-3" onSubmit={() => setOpen(false)}>
              <input name="event_id" type="hidden" value={event.id} />

              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor={`title-${event.id}`} required>Title</FieldLabel>
                <Input
                  aria-describedby={`title-${event.id}-hint`}
                  defaultValue={event.title}
                  id={`title-${event.id}`}
                  name="title"
                  required
                />
                <FieldHint id={`title-${event.id}-hint`}>
                  This is the headline shown on the public event page, check-in list, and admin calendar.
                </FieldHint>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <FieldLabel
                    htmlFor={`status-${event.id}`}
                    info="Draft keeps the event hidden, Published makes it visible on public surfaces, Archived removes it from active lists, and Cancelled keeps the record while marking the event as no longer happening."
                  >
                    Status
                  </FieldLabel>
                  <Select aria-describedby={`status-${event.id}-hint`} defaultValue={event.status} id={`status-${event.id}`} name="status">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                  <FieldHint id={`status-${event.id}-hint`}>
                    Choose how this event should behave on public pages and in internal event lists.
                  </FieldHint>
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel
                    htmlFor={`capacity-${event.id}`}
                    info="Capacity limits the total number of seats or spots that can be booked. Leave it empty for an open-ended event."
                  >
                    Capacity
                  </FieldLabel>
                  <Input
                    aria-describedby={`capacity-${event.id}-hint`}
                    defaultValue={event.capacity ?? ""}
                    id={`capacity-${event.id}`}
                    name="capacity"
                    placeholder="Open"
                    type="number"
                  />
                  <FieldHint id={`capacity-${event.id}-hint`}>
                    Enter the total number of seats available, or leave blank if there is no cap.
                  </FieldHint>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <FieldLabel
                  htmlFor={`price-${event.id}`}
                  info="Prices are stored in cents. For example, enter 1500 for a $15.00 ticket."
                >
                  Price (cents)
                </FieldLabel>
                <Input
                  aria-describedby={`price-${event.id}-hint${!canSellPaidEvents ? ` price-gate-${event.id}` : ""}`}
                  defaultValue={event.price_cents ?? ""}
                  id={`price-${event.id}`}
                  name="price_cents"
                  placeholder="Leave empty for free"
                  type="number"
                />
                <FieldHint id={`price-${event.id}-hint`}>
                  Leave this blank or set it to `0` to make the event free.
                </FieldHint>
                {!canSellPaidEvents && (
                  <span className="text-xs text-amber-600" id={`price-gate-${event.id}`}>{paidEventGateCopy}</span>
                )}
              </div>

              <DateTimeField
                defaultValue={toDateTimeLocal(event.starts_at)}
                hint="Choose when guests should see the event start on public listings, tickets, and check-in tools."
                info="Use the venue's local time for the start of the event."
                label="Starts at"
                name="starts_at"
                required
              />

              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor={`desc-${event.id}`}>Description</FieldLabel>
                <Textarea
                  aria-describedby={`desc-${event.id}-hint`}
                  defaultValue={event.description ?? ""}
                  id={`desc-${event.id}`}
                  name="description"
                  rows={2}
                />
                <FieldHint id={`desc-${event.id}-hint`}>
                  Optional public-facing copy shown on the event page and any displays with descriptions enabled.
                </FieldHint>
              </div>

              <div className="flex gap-2 justify-end">
                <Button onClick={() => setOpen(false)} size="sm" type="button" variant="secondary">
                  Cancel
                </Button>
                <Button size="sm" type="submit">
                  Save changes
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
