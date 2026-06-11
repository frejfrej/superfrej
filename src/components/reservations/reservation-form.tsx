"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  saveReservationAction,
  type ReservationFormState,
} from "@/app/reservations/actions";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";
import type { GuestRow, RentalRow, ReservationRow } from "@/db/schema";

const LANGUAGES = [
  ["en", "English"],
  ["fr", "Français"],
  ["es", "Español"],
  ["de", "Deutsch"],
  ["it", "Italiano"],
  ["pt", "Português"],
] as const;

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

export function ReservationForm({
  rentals,
  reservation,
  guest,
  defaults,
}: {
  /** Active rentals to choose from (plus the current one when editing). */
  rentals: RentalRow[];
  reservation?: ReservationRow;
  guest?: GuestRow;
  /** Prefill for the create form (e.g. from a calendar day click). */
  defaults?: { rentalId?: string; checkIn?: string };
}) {
  const action = saveReservationAction.bind(null, reservation?.id ?? null);
  const [state, formAction, pending] = useActionState<
    ReservationFormState,
    FormData
  >(action, { errors: {} });
  const e = state.errors;

  if (state.savedId && state.warnings?.length) {
    return (
      <div className="rounded-card border border-gold/40 bg-gold-soft p-6">
        <h2 className="font-display text-lg font-medium">
          Reservation saved — with notes
        </h2>
        <ul className="mt-3 list-disc pl-5 text-sm leading-relaxed text-ink">
          {state.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        <div className="mt-5 flex gap-3">
          <Link
            href={`/reservations/${state.savedId}`}
            className="inline-flex h-9 items-center rounded-lg bg-terracotta px-4 text-sm font-medium text-white hover:bg-terracotta-deep"
          >
            Open reservation
          </Link>
          <Link
            href="/reservations"
            className="inline-flex h-9 items-center px-2 text-sm text-ink-soft hover:text-ink"
          >
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Section title="Stay">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Rental"
            htmlFor="rentalId"
            error={e.rentalId}
            className="sm:col-span-2"
          >
            <Select
              id="rentalId"
              name="rentalId"
              defaultValue={
                reservation?.rentalId ?? defaults?.rentalId ?? rentals[0]?.id
              }
            >
              {rentals.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Check-in" htmlFor="checkIn" error={e.checkIn}>
            <TextInput
              id="checkIn"
              name="checkIn"
              type="date"
              defaultValue={reservation?.checkIn ?? defaults?.checkIn}
            />
          </Field>
          <Field label="Check-out" htmlFor="checkOut" error={e.checkOut}>
            <TextInput
              id="checkOut"
              name="checkOut"
              type="date"
              defaultValue={reservation?.checkOut}
            />
          </Field>
          <Field label="Adults" htmlFor="adults" error={e.adults}>
            <TextInput
              id="adults"
              name="adults"
              type="number"
              min={1}
              defaultValue={reservation?.adults ?? 2}
            />
          </Field>
          <Field label="Children" htmlFor="children" error={e.children}>
            <TextInput
              id="children"
              name="children"
              type="number"
              min={0}
              defaultValue={reservation?.children ?? 0}
            />
          </Field>
        </div>
      </Section>

      <Section title="Guest">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="First name"
            htmlFor="guest.firstName"
            error={e["guest.firstName"]}
          >
            <TextInput
              id="guest.firstName"
              name="guest.firstName"
              defaultValue={guest?.firstName}
            />
          </Field>
          <Field
            label="Last name"
            htmlFor="guest.lastName"
            error={e["guest.lastName"]}
          >
            <TextInput
              id="guest.lastName"
              name="guest.lastName"
              defaultValue={guest?.lastName}
            />
          </Field>
          <Field label="Email" htmlFor="guest.email" error={e["guest.email"]}>
            <TextInput
              id="guest.email"
              name="guest.email"
              type="email"
              placeholder="Used to recognize returning guests"
              defaultValue={guest?.email}
            />
          </Field>
          <Field label="Phone" htmlFor="guest.phone" error={e["guest.phone"]}>
            <TextInput
              id="guest.phone"
              name="guest.phone"
              defaultValue={guest?.phone}
            />
          </Field>
          <Field
            label="Language"
            htmlFor="guest.language"
            error={e["guest.language"]}
          >
            <Select
              id="guest.language"
              name="guest.language"
              defaultValue={guest?.language ?? "en"}
            >
              {LANGUAGES.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Money & notes">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Total price (€)" htmlFor="totalEuros" error={e.totalEuros}>
            <TextInput
              id="totalEuros"
              name="totalEuros"
              type="number"
              min={0}
              step="0.01"
              defaultValue={
                reservation ? (reservation.totalCents / 100).toString() : "0"
              }
            />
          </Field>
          <Field
            label="Private notes"
            htmlFor="notes"
            error={e.notes}
            className="sm:col-span-2"
          >
            <TextArea
              id="notes"
              name="notes"
              defaultValue={reservation?.notes}
              placeholder="Only you and your team see this"
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
          {pending
            ? "Saving…"
            : reservation
              ? "Save changes"
              : "Create reservation"}
        </Button>
        <Link
          href="/reservations"
          className="text-sm text-ink-soft hover:text-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
