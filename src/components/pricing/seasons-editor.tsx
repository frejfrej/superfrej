"use client";

import { useActionState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import {
  createSeasonAction,
  deleteSeasonAction,
  type SeasonFormState,
} from "@/app/rentals/[id]/pricing/actions";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import type { RentalSeasonRow } from "@/db/schema";
import { formatStayDates } from "@/lib/dates";

function SeasonRowItem({
  rentalId,
  season,
}: {
  rentalId: string;
  season: RentalSeasonRow;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface px-4 py-2.5 text-sm">
      <div className="min-w-0">
        <span className="font-medium">{season.name}</span>{" "}
        <span className="text-xs text-ink-soft">
          {formatStayDates(season.startDate, season.endDate)} ·{" "}
          {(season.nightlyCents / 100).toFixed(0)} €/night
          {season.weekendCents != null &&
            ` · ${(season.weekendCents / 100).toFixed(0)} € weekends`}
        </span>
      </div>
      <button
        type="button"
        aria-label={`Delete season ${season.name}`}
        disabled={pending}
        onClick={() =>
          startTransition(() => deleteSeasonAction(rentalId, season.id))
        }
        className="text-ink-faint transition-colors hover:text-danger disabled:opacity-50"
      >
        <Trash2 size={15} />
      </button>
    </li>
  );
}

export function SeasonsEditor({
  rentalId,
  seasons,
}: {
  rentalId: string;
  seasons: RentalSeasonRow[];
}) {
  const [state, formAction, pending] = useActionState<SeasonFormState, FormData>(
    createSeasonAction,
    { errors: {} },
  );
  const e = state.errors;

  return (
    <section className="rounded-card border border-hairline bg-surface-raised p-6">
      <h2 className="font-display mb-1 text-lg font-medium">Seasons</h2>
      <p className="mb-4 text-sm text-ink-soft">
        Seasonal rates override the nightly price for a date range — the end
        date is the first night back at the regular rate. Seasons can&apos;t
        overlap.
      </p>

      {seasons.length > 0 && (
        <ul className="mb-5 flex flex-col gap-2">
          {seasons.map((s) => (
            <SeasonRowItem key={s.id} rentalId={rentalId} season={s} />
          ))}
        </ul>
      )}

      <form action={formAction} className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <input type="hidden" name="rentalId" value={rentalId} />
        <Field label="Name" htmlFor="name" error={e.name}>
          <TextInput id="name" name="name" placeholder="High season" />
        </Field>
        <Field label="First night" htmlFor="startDate" error={e.startDate}>
          <TextInput id="startDate" name="startDate" type="date" />
        </Field>
        <Field label="End (first regular night)" htmlFor="endDate" error={e.endDate}>
          <TextInput id="endDate" name="endDate" type="date" />
        </Field>
        <Field label="Nightly price (€)" htmlFor="nightlyEuros" error={e.nightlyEuros}>
          <TextInput
            id="nightlyEuros"
            name="nightlyEuros"
            type="number"
            min={0}
            step="0.01"
          />
        </Field>
        <Field label="Weekend price (€)" htmlFor="weekendEuros" error={e.weekendEuros}>
          <TextInput
            id="weekendEuros"
            name="weekendEuros"
            type="number"
            min={0}
            step="0.01"
            placeholder="Same as nightly"
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Adding…" : "Add season"}
          </Button>
        </div>
      </form>
    </section>
  );
}
