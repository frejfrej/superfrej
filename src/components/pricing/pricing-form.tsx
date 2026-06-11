"use client";

import { useActionState } from "react";
import {
  savePricingAction,
  type PricingFormState,
} from "@/app/(admin)/rentals/[id]/pricing/actions";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import type { RentalPricingRow } from "@/db/schema";

const toEuros = (cents: number | null) =>
  cents == null ? "" : (cents / 100).toString();

export function PricingForm({
  rentalId,
  pricing,
}: {
  rentalId: string;
  pricing: RentalPricingRow;
}) {
  const action = savePricingAction.bind(null, rentalId);
  const [state, formAction, pending] = useActionState<PricingFormState, FormData>(
    action,
    { errors: {} },
  );
  const e = state.errors;

  return (
    <form
      action={formAction}
      className="rounded-card border border-hairline bg-surface-raised p-6"
    >
      <h2 className="font-display mb-4 text-lg font-medium">Rates & fees</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Nightly price (€)" htmlFor="baseEuros" error={e.baseEuros}>
          <TextInput
            id="baseEuros"
            name="baseEuros"
            type="number"
            min={0}
            step="0.01"
            defaultValue={toEuros(pricing.baseCents)}
          />
        </Field>
        <Field
          label="Weekend price (€, Fri & Sat)"
          htmlFor="weekendEuros"
          error={e.weekendEuros}
        >
          <TextInput
            id="weekendEuros"
            name="weekendEuros"
            type="number"
            min={0}
            step="0.01"
            placeholder="Same as nightly"
            defaultValue={toEuros(pricing.weekendCents)}
          />
        </Field>
        <Field
          label="Cleaning fee (€/stay)"
          htmlFor="cleaningFeeEuros"
          error={e.cleaningFeeEuros}
        >
          <TextInput
            id="cleaningFeeEuros"
            name="cleaningFeeEuros"
            type="number"
            min={0}
            step="0.01"
            defaultValue={toEuros(pricing.cleaningFeeCents)}
          />
        </Field>
        <Field
          label="City tax (€/guest/night)"
          htmlFor="cityTaxEuros"
          error={e.cityTaxEuros}
        >
          <TextInput
            id="cityTaxEuros"
            name="cityTaxEuros"
            type="number"
            min={0}
            step="0.01"
            defaultValue={toEuros(pricing.cityTaxCents)}
          />
        </Field>
        <Field
          label="Weekly discount (%, 7+ nights)"
          htmlFor="weeklyDiscountPct"
          error={e.weeklyDiscountPct}
        >
          <TextInput
            id="weeklyDiscountPct"
            name="weeklyDiscountPct"
            type="number"
            min={0}
            max={90}
            defaultValue={pricing.weeklyDiscountPct}
          />
        </Field>
        <Field
          label="Monthly discount (%, 28+ nights)"
          htmlFor="monthlyDiscountPct"
          error={e.monthlyDiscountPct}
        >
          <TextInput
            id="monthlyDiscountPct"
            name="monthlyDiscountPct"
            type="number"
            min={0}
            max={90}
            defaultValue={pricing.monthlyDiscountPct}
          />
        </Field>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save pricing"}
        </Button>
        {state.saved && !pending && (
          <span className="text-sm text-ok">Saved.</span>
        )}
      </div>
    </form>
  );
}
