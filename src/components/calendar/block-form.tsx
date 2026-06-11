"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createBlockAction, type BlockFormState } from "@/app/(admin)/calendar/actions";
import { Button } from "@/components/ui/button";
import { Field, Select, TextInput } from "@/components/ui/field";
import type { RentalRow } from "@/db/schema";

export function BlockForm({
  rentals,
  defaultRentalId,
}: {
  rentals: RentalRow[];
  defaultRentalId?: string;
}) {
  const [state, formAction, pending] = useActionState<BlockFormState, FormData>(
    createBlockAction,
    { errors: {} },
  );
  const e = state.errors;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-card border border-hairline bg-surface-raised p-6"
    >
      <Field label="Rental" htmlFor="rentalId" error={e.rentalId}>
        <Select
          id="rentalId"
          name="rentalId"
          defaultValue={defaultRentalId ?? rentals[0]?.id}
        >
          {rentals.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First blocked day" htmlFor="startDate" error={e.startDate}>
          <TextInput id="startDate" name="startDate" type="date" />
        </Field>
        <Field label="First free day" htmlFor="endDate" error={e.endDate}>
          <TextInput id="endDate" name="endDate" type="date" />
        </Field>
      </div>
      <Field label="Reason (optional)" htmlFor="reason" error={e.reason}>
        <TextInput
          id="reason"
          name="reason"
          placeholder="Maintenance, personal stay…"
        />
      </Field>

      {e._form && <p className="text-sm text-danger">{e._form}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Blocking…" : "Block dates"}
        </Button>
        <Link href="/calendar" className="text-sm text-ink-soft hover:text-ink">
          Cancel
        </Link>
      </div>
    </form>
  );
}
