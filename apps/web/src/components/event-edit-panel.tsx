"use client";

import { useState } from "react";

import { Button, Input, Label, Select, Textarea } from "@taproom/ui";

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
                <Label htmlFor={`title-${event.id}`}>Title</Label>
                <Input defaultValue={event.title} id={`title-${event.id}`} name="title" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`status-${event.id}`}>Status</Label>
                  <Select defaultValue={event.status} id={`status-${event.id}`} name="status">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`capacity-${event.id}`}>Capacity</Label>
                  <Input
                    defaultValue={event.capacity ?? ""}
                    id={`capacity-${event.id}`}
                    name="capacity"
                    placeholder="Open"
                    type="number"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor={`price-${event.id}`}>Price (cents)</Label>
                <Input
                  defaultValue={event.price_cents ?? ""}
                  id={`price-${event.id}`}
                  name="price_cents"
                  placeholder="Leave empty for free"
                  type="number"
                />
                {!canSellPaidEvents && (
                  <span className="text-xs text-amber-600">{paidEventGateCopy}</span>
                )}
              </div>

              <DateTimeField
                defaultValue={toDateTimeLocal(event.starts_at)}
                label="Starts at"
                name="starts_at"
                required
              />

              <div className="flex flex-col gap-1">
                <Label htmlFor={`desc-${event.id}`}>Description</Label>
                <Textarea
                  defaultValue={event.description ?? ""}
                  id={`desc-${event.id}`}
                  name="description"
                  rows={2}
                />
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
