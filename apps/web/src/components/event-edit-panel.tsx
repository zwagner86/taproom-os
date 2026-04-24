"use client";

import { useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FieldHint,
  FieldLabel,
  Input,
  Select,
  Textarea,
} from "@/components/ui";

import { DateTimeField } from "./date-time-field";
import { toDateTimeLocal } from "@/lib/utils";

type EventEditPanelProps = {
  action: (formData: FormData) => Promise<void>;
  disabled?: boolean;
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

export function EventEditPanel({
  action,
  canSellPaidEvents,
  disabled = false,
  event,
  paidEventGateCopy,
}: EventEditPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <div className="flex-shrink-0">
        <Button disabled={disabled} onClick={() => setOpen(true)} size="sm" type="button" variant="secondary">
          Edit
        </Button>
      </div>

      <DialogContent className="w-[min(94vw,44rem)]">
        <DialogHeader>
          <DialogTitle>Edit event</DialogTitle>
          <DialogDescription>
            Update the public event details, guest capacity, and check-in timing for this listing.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="grid gap-4" onSubmit={() => setOpen(false)}>
          <fieldset className="contents" disabled={disabled}>
            <input name="event_id" type="hidden" value={event.id} />

            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor={`title-${event.id}`} required>
                Title
              </FieldLabel>
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <FieldLabel
                  htmlFor={`status-${event.id}`}
                  info="Draft keeps the event hidden, Published makes it visible on public surfaces, Archived removes it from active lists, and Cancelled keeps the record while marking the event as no longer happening."
                >
                  Status
                </FieldLabel>
                <Select
                  aria-describedby={`status-${event.id}-hint`}
                  defaultValue={event.status}
                  id={`status-${event.id}`}
                  name="status"
                >
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
                <span className="text-xs text-amber-600" id={`price-gate-${event.id}`}>
                  {paidEventGateCopy}
                </span>
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
                rows={3}
              />
              <FieldHint id={`desc-${event.id}-hint`}>
                Optional public-facing copy shown on the event page and any displays with descriptions enabled.
              </FieldHint>
            </div>

          </fieldset>
          <DialogFooter>
            <Button onClick={() => setOpen(false)} size="sm" type="button" variant="secondary">
              Cancel
            </Button>
            <Button disabled={disabled} size="sm" type="submit">
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
