"use client";

import { Pencil } from "lucide-react";

import { AdminFormDrawer } from "@/components/admin-create-drawer";
import { EventForm } from "@/components/admin-create-forms";

type EventEditPanelProps = {
  action: (formData: FormData) => void | Promise<void>;
  canSellPaidEvents: boolean;
  closeAfterAction?: boolean;
  disabled?: boolean;
  event: {
    capacity: number | null;
    currency: string;
    description: string | null;
    ends_at: string | null;
    id: string;
    price_cents: number | null;
    starts_at: string;
    status: string;
    title: string;
  };
  paidEventGateCopy: string;
};

export function EventEditPanel({
  action,
  canSellPaidEvents,
  closeAfterAction = false,
  disabled = false,
  event,
  paidEventGateCopy,
}: EventEditPanelProps) {
  return (
    <div className="flex-shrink-0">
      <AdminFormDrawer
        description="Update the public event details, guest capacity, and check-in timing for this listing."
        title="Edit event"
        triggerIcon={<Pencil className="h-3.5 w-3.5" />}
        triggerLabel="Edit"
        triggerSize="sm"
        triggerVariant="secondary"
      >
        {({ close }) => (
          <EventForm
            action={
              closeAfterAction
                ? async (formData) => {
                    await action(formData);
                    close();
                  }
                : action
            }
            canSellPaidEvents={canSellPaidEvents}
            defaultValues={event}
            disabled={disabled}
            mode="edit"
            paidEventGateCopy={paidEventGateCopy}
          />
        )}
      </AdminFormDrawer>
    </div>
  );
}
