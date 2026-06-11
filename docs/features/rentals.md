# Feature: Rentals

> Story [#16](https://github.com/frejfrej/superfrej/issues/16) · Epic E2 [#2](https://github.com/frejfrej/superfrej/issues/2)

A **rental** is one bookable property (apartment, chalet, room…). It is the root entity of Superfrej: calendar, pricing, reservations and channel connections all hang off a rental.

## Behavior

- **Create / edit** (`/rentals/new`, `/rentals/{id}`): name, property type, description, address, capacity (max guests, bedrooms, beds, bathrooms), check-in window, check-out time, min/max nights.
- **List** (`/rentals`): search on name or city, status filter (Active / Archived / All), capacity and check-in/out summary per row.
- **Archive instead of delete**: rentals are never hard-deleted from the UI because future reservations and statistics will reference them. Archiving hides a rental from active lists; it can be restored at any time.
- **Slugs**: generated from the name (diacritics stripped), unique via numeric suffix (`cosy-chalet`, `cosy-chalet-2`). Renaming refreshes the slug. Slugs will become the public booking-site URLs later (decision: revisit slug stability when the booking site ships).

## Validation rules

| Rule | Why |
|------|-----|
| Name required, ≤120 chars | display + slug source |
| Times must be `HH:MM`; check-in window must not be inverted | downstream messaging & calendar logic rely on it |
| `maxNights ≥ minNights`, both ≥1 | quote/availability engine invariant |
| `maxGuests ≥ 1` | a rental that sleeps no one is a configuration error |

Validation is one zod schema (`src/server/rentals/validation.ts`) used by both the server action (form errors) and the service (last line of defense — the service re-parses every input).

## Code map

| Path | Role |
|------|------|
| `src/db/schema.ts` → `rentals` | table definition |
| `src/server/rentals/service.ts` | create/list/get/update/archive/restore (unit-tested) |
| `src/server/rentals/validation.ts` | zod input schema + form-error helper |
| `src/app/rentals/*` | pages + server actions (thin) |
| `src/components/rentals/*` | form + status button |

## Deliberately out of scope (follow-up stories under Epic #2)

Rooms, amenities, photos, booking rules (lead/preparation time, availability window, gap-fill), parent/child dependencies, per-rental contacts, pricing (Epic #5).
