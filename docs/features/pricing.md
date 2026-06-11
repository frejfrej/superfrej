# Feature: Pricing & quote engine

> Story [#23](https://github.com/frejfrej/superfrej/issues/23) · Epic E5 [#5](https://github.com/frejfrej/superfrej/issues/5)

## Behavior

- **Pricing page** (`/rentals/{id}/pricing`, linked from the rental header): nightly base price, weekend price (Friday & Saturday *nights*; blank = same as base), cleaning fee per stay, city tax per guest per night, weekly (7+ nights) and monthly (28+ nights) discount percentages.
- **Seasons**: named date ranges (`[start, end)` — the end date is the first night back at regular rates) overriding nightly/weekend prices. Overlapping seasons are rejected; back-to-back is fine. Hard-delete (config, not history).
- **Quote everywhere**: `GET /api/quote?rentalId&checkIn&checkOut&guests` returns the full breakdown. The reservation form's *"Suggest price"* button fills the total from it.

## The engine (`src/server/pricing/engine.ts`)

`computeQuote(config, checkIn, checkOut, guests)` is a **pure function** — no db, no clock, fully unit-tested. Per night: season override (if the night's date falls in one) → weekend price (if the night starts Friday/Saturday) → base. Then:

```
accommodation = Σ nightly prices
discount      = monthly% if nights ≥ 28, else weekly% if nights ≥ 7 — on accommodation only
cityTax       = rate × guests × nights
total         = accommodation − discount + cleaningFee + cityTax
```

**Rule: nothing outside this engine does price math.** The booking engine (E6) and channel sync (E8) must call `quoteStay` / `computeQuote`.

- A "weekend night" is the night *starting* Friday or Saturday (the Fri→Sat and Sat→Sun nights), matching OTA conventions.
- Money is integer cents end-to-end; forms speak euros and convert at the boundary.
- Pricing is created lazily: rentals without a saved row quote at the defaults (€100/night, no fees).

## Code map

| Path | Role |
|------|------|
| `src/db/schema.ts` → `rental_pricing`, `rental_seasons` | config tables |
| `src/server/pricing/engine.ts` | pure quote computation |
| `src/server/pricing/service.ts` | config persistence, season overlap rules, `quoteStay` |
| `src/app/api/quote/route.ts` | quote endpoint (also used by the form button) |
| `src/app/rentals/[id]/pricing/*`, `src/components/pricing/*` | pricing UI |
| `src/components/reservations/quote-suggest.tsx` | suggest-price button |

## Out of scope (follow-ups)

Per-channel markups (E8), promo codes (E6), VAT invoice breakdown (E7), dynamic-pricing adapters (PriceLabs-style), per-night prices in calendar cells, extra-guest pricing.
