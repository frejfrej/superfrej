"use client";

import { useActionState, useState } from "react";
import {
  bookDirectAction,
  type BookingFormState,
} from "@/app/book/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import type { AvailabilityResult } from "@/server/booking/service";

const fmt = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );

export function BookingWidget({ slug }: { slug: string }) {
  const [check, setCheck] = useState<AvailabilityResult>();
  const [checking, setChecking] = useState(false);
  const action = bookDirectAction.bind(null, slug);
  const [state, formAction, pending] = useActionState<BookingFormState, FormData>(
    action,
    { errors: {} },
  );
  const e = state.errors;

  async function runCheck(form: HTMLFormElement) {
    const get = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "";
    const guests = (Number(get("adults")) || 0) + (Number(get("children")) || 0);
    if (!get("checkIn") || !get("checkOut") || guests < 1) {
      setCheck({
        available: false,
        reasons: ["Pick your dates and party size first."],
        quote: null,
      });
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(
        `/api/booking/check?slug=${slug}&checkIn=${get("checkIn")}&checkOut=${get("checkOut")}&guests=${guests}`,
      );
      setCheck(
        res.ok
          ? await res.json()
          : { available: false, reasons: ["Could not check these dates."], quote: null },
      );
    } catch {
      setCheck({
        available: false,
        reasons: ["Could not check these dates."],
        quote: null,
      });
    } finally {
      setChecking(false);
    }
  }

  const quote = check?.available ? check.quote : null;

  return (
    <form
      action={formAction}
      className="rounded-card border border-hairline bg-surface-raised p-6"
    >
      <h2 className="font-display text-lg font-medium">Your stay</h2>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Field label="Check-in" htmlFor="checkIn" error={e.checkIn}>
          <TextInput id="checkIn" name="checkIn" type="date" />
        </Field>
        <Field label="Check-out" htmlFor="checkOut" error={e.checkOut}>
          <TextInput id="checkOut" name="checkOut" type="date" />
        </Field>
        <Field label="Adults" htmlFor="adults" error={e.adults}>
          <TextInput id="adults" name="adults" type="number" min={1} defaultValue={2} />
        </Field>
        <Field label="Children" htmlFor="children" error={e.children}>
          <TextInput id="children" name="children" type="number" min={0} defaultValue={0} />
        </Field>
      </div>

      <button
        type="button"
        disabled={checking}
        onClick={(ev) => ev.currentTarget.form && runCheck(ev.currentTarget.form)}
        className="mt-4 text-sm font-medium text-terracotta hover:text-terracotta-deep disabled:opacity-50"
      >
        {checking ? "Checking…" : "Check availability & price"}
      </button>

      {check && !check.available && (
        <ul className="mt-3 rounded-lg border border-gold/40 bg-gold-soft px-4 py-3 text-sm">
          {check.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}

      {quote && (
        <div className="mt-4 rounded-lg border border-sage/30 bg-sage-soft/60 px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span>
              {quote.nights.length} night{quote.nights.length > 1 ? "s" : ""}
            </span>
            <span>{fmt(quote.accommodationCents)}</span>
          </div>
          {quote.discountCents > 0 && (
            <div className="flex justify-between text-ok">
              <span>{quote.discountLabel} discount −{quote.discountPct}%</span>
              <span>−{fmt(quote.discountCents)}</span>
            </div>
          )}
          {quote.cleaningFeeCents > 0 && (
            <div className="flex justify-between">
              <span>Cleaning</span>
              <span>{fmt(quote.cleaningFeeCents)}</span>
            </div>
          )}
          {quote.cityTaxCents > 0 && (
            <div className="flex justify-between">
              <span>City tax</span>
              <span>{fmt(quote.cityTaxCents)}</span>
            </div>
          )}
          <div className="mt-1.5 flex justify-between border-t border-sage/30 pt-1.5 font-semibold">
            <span>Total</span>
            <span>{fmt(quote.totalCents)}</span>
          </div>
        </div>
      )}

      {quote && (
        <div className="mt-5 border-t border-hairline pt-5">
          <h3 className="font-display text-lg font-medium">Your details</h3>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <Field label="First name" htmlFor="firstName" error={e.firstName}>
              <TextInput id="firstName" name="firstName" />
            </Field>
            <Field label="Last name" htmlFor="lastName" error={e.lastName}>
              <TextInput id="lastName" name="lastName" />
            </Field>
            <Field label="Email" htmlFor="email" error={e.email} className="col-span-2">
              <TextInput id="email" name="email" type="email" />
            </Field>
            <Field label="Phone (optional)" htmlFor="phone" error={e.phone} className="col-span-2">
              <TextInput id="phone" name="phone" />
            </Field>
          </div>

          {e._form && (
            <p className="mt-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              {e._form}
            </p>
          )}

          <Button type="submit" disabled={pending} className="mt-4 w-full">
            {pending ? "Booking…" : `Book now · ${fmt(quote.totalCents)}`}
          </Button>
          <p className="mt-2 text-center text-xs text-ink-faint">
            Instant confirmation. The exact total is computed by the host&apos;s
            pricing — no hidden fees.
          </p>
        </div>
      )}
    </form>
  );
}
