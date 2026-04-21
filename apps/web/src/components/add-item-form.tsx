"use client";

import { useActionState, useEffect, useState } from "react";

import { Alert } from "@taproom/ui";

import { ItemTypeForm } from "@/components/item-type-form";
import type { ItemFormState } from "@/server/actions/items";

export function AddItemForm({
  action,
}: {
  action: (prevState: ItemFormState, formData: FormData) => Promise<ItemFormState>;
}) {
  const [state, formAction] = useActionState(action, null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (state?.message) setFormKey((k) => k + 1);
  }, [state?.message]);

  return (
    <>
      {state?.message && <Alert variant="success" className="mb-4">{state.message}</Alert>}
      {state?.error && <Alert variant="error" className="mb-4">{state.error}</Alert>}
      <ItemTypeForm key={formKey} action={formAction} />
    </>
  );
}
