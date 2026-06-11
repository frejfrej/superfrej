"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { Quote } from "@/server/pricing/engine";

const fmt = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );

/**
 * "Suggest price" — asks /api/quote for the rental's configured pricing and
 * fills the total field. Reads its sibling fields straight off the form so
 * the form can stay uncontrolled.
 */
export function QuoteSuggest() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>();

  async function suggest(form: HTMLFormElement) {
    const get = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "";
    const rentalId = get("rentalId");
    const checkIn = get("checkIn");
    const checkOut = get("checkOut");
    const guests =
      (Number(get("adults")) || 0) + (Number(get("children")) || 0);
    if (!rentalId || !checkIn || !checkOut || guests < 1) {
      setResult("Pick a rental, dates and guests first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/quote?rentalId=${rentalId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`,
      );
      if (!res.ok) {
        setResult("No quote for these dates.");
        return;
      }
      const quote: Quote = await res.json();
      const totalInput = form.elements.namedItem("totalEuros") as HTMLInputElement;
      totalInput.value = (quote.totalCents / 100).toFixed(2);
      const parts = [
        `${quote.nights.length} nights ${fmt(quote.accommodationCents)}`,
        quote.discountCents > 0 &&
          `−${fmt(quote.discountCents)} ${quote.discountLabel} discount`,
        quote.cleaningFeeCents > 0 && `cleaning ${fmt(quote.cleaningFeeCents)}`,
        quote.cityTaxCents > 0 && `city tax ${fmt(quote.cityTaxCents)}`,
      ].filter(Boolean);
      setResult(`${parts.join(" + ")} = ${fmt(quote.totalCents)}`);
    } catch {
      setResult("Could not compute a quote.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sm:col-span-2">
      <button
        type="button"
        disabled={busy}
        onClick={(e) => e.currentTarget.form && suggest(e.currentTarget.form)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-terracotta hover:text-terracotta-deep disabled:opacity-50"
      >
        <Sparkles size={14} />
        {busy ? "Computing…" : "Suggest price from this rental's pricing"}
      </button>
      {result && <p className="mt-1 text-xs text-ink-soft">{result}</p>}
    </div>
  );
}
