"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  saveRentalAction,
  type RentalFormState,
} from "@/app/rentals/actions";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";
import type { RentalRow } from "@/db/schema";
import { PROPERTY_TYPES } from "@/db/schema";

const TYPE_LABELS: Record<(typeof PROPERTY_TYPES)[number], string> = {
  apartment: "Apartment",
  house: "House",
  studio: "Studio",
  villa: "Villa",
  chalet: "Chalet",
  room: "Private room",
  other: "Other",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-hairline bg-surface-raised p-6">
      <h2 className="font-display mb-4 text-lg font-medium">{title}</h2>
      {children}
    </section>
  );
}

export function RentalForm({ rental }: { rental?: RentalRow }) {
  const action = saveRentalAction.bind(null, rental?.id ?? null);
  const [state, formAction, pending] = useActionState<RentalFormState, FormData>(
    action,
    { errors: {} },
  );
  const e = state.errors;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Section title="Basics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" error={e.name}>
            <TextInput
              id="name"
              name="name"
              defaultValue={rental?.name}
              placeholder="Cosy Chalet Arc 1950"
              autoFocus
            />
          </Field>
          <Field label="Property type" htmlFor="propertyType" error={e.propertyType}>
            <Select
              id="propertyType"
              name="propertyType"
              defaultValue={rental?.propertyType ?? "apartment"}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Description"
            htmlFor="description"
            error={e.description}
            className="sm:col-span-2"
          >
            <TextArea
              id="description"
              name="description"
              defaultValue={rental?.description}
              placeholder="What makes this place special?"
            />
          </Field>
        </div>
      </Section>

      <Section title="Location">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Street" htmlFor="street" error={e.street} className="sm:col-span-2">
            <TextInput id="street" name="street" defaultValue={rental?.street} />
          </Field>
          <Field label="City" htmlFor="city" error={e.city}>
            <TextInput id="city" name="city" defaultValue={rental?.city} />
          </Field>
          <Field label="Postal code" htmlFor="zip" error={e.zip}>
            <TextInput id="zip" name="zip" defaultValue={rental?.zip} />
          </Field>
          <Field label="Country" htmlFor="country" error={e.country}>
            <TextInput id="country" name="country" defaultValue={rental?.country} />
          </Field>
        </div>
      </Section>

      <Section title="Capacity">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Max guests" htmlFor="maxGuests" error={e.maxGuests}>
            <TextInput
              id="maxGuests"
              name="maxGuests"
              type="number"
              min={1}
              defaultValue={rental?.maxGuests ?? 2}
            />
          </Field>
          <Field label="Bedrooms" htmlFor="bedrooms" error={e.bedrooms}>
            <TextInput
              id="bedrooms"
              name="bedrooms"
              type="number"
              min={0}
              defaultValue={rental?.bedrooms ?? 1}
            />
          </Field>
          <Field label="Beds" htmlFor="beds" error={e.beds}>
            <TextInput
              id="beds"
              name="beds"
              type="number"
              min={0}
              defaultValue={rental?.beds ?? 1}
            />
          </Field>
          <Field label="Bathrooms" htmlFor="bathrooms" error={e.bathrooms}>
            <TextInput
              id="bathrooms"
              name="bathrooms"
              type="number"
              min={0}
              defaultValue={rental?.bathrooms ?? 1}
            />
          </Field>
        </div>
      </Section>

      <Section title="Stay rules">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Check-in from" htmlFor="checkInFrom" error={e.checkInFrom}>
            <TextInput
              id="checkInFrom"
              name="checkInFrom"
              type="time"
              defaultValue={rental?.checkInFrom ?? "16:00"}
            />
          </Field>
          <Field label="Check-in until" htmlFor="checkInTo" error={e.checkInTo}>
            <TextInput
              id="checkInTo"
              name="checkInTo"
              type="time"
              defaultValue={rental?.checkInTo ?? "22:00"}
            />
          </Field>
          <Field label="Check-out until" htmlFor="checkOutUntil" error={e.checkOutUntil}>
            <TextInput
              id="checkOutUntil"
              name="checkOutUntil"
              type="time"
              defaultValue={rental?.checkOutUntil ?? "10:00"}
            />
          </Field>
          <Field label="Min nights" htmlFor="minNights" error={e.minNights}>
            <TextInput
              id="minNights"
              name="minNights"
              type="number"
              min={1}
              defaultValue={rental?.minNights ?? 1}
            />
          </Field>
          <Field label="Max nights" htmlFor="maxNights" error={e.maxNights}>
            <TextInput
              id="maxNights"
              name="maxNights"
              type="number"
              min={1}
              defaultValue={rental?.maxNights ?? 365}
            />
          </Field>
        </div>
      </Section>

      {e._form && (
        <p className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {e._form}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : rental ? "Save changes" : "Create rental"}
        </Button>
        <Link href="/rentals" className="text-sm text-ink-soft hover:text-ink">
          Cancel
        </Link>
      </div>
    </form>
  );
}
