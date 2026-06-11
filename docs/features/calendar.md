# Feature: Calendar & availability

> Story [#21](https://github.com/frejfrej/superfrej/issues/21) · Epic E3 [#3](https://github.com/frejfrej/superfrej/issues/3)

## Behavior

- **Calendar** (`/calendar?month=YYYY-MM`): month grid, one lane per active rental. Reservation bars (pine, guest name) link to the reservation; blocked periods render hatched. Weekend shading, today highlight, month navigation + Today shortcut.
- **Click a free day** → new-reservation form prefilled with that rental and check-in date.
- **Blocked periods**: host-blocked dates (maintenance, personal use) with optional reason. Click a block once to arm ("Remove block?"), again to delete — inline confirm, no browser dialog. Blocks are hard-deleted (no history value, unlike reservations).

## Availability model

`src/server/availability/service.ts` is now the **single source of truth** for "is this range free?":

- A rental's nights are taken by **confirmed reservations** and by **blocks**; both use `[start, end)` semantics, so back-to-back is always allowed and the end date itself is free again.
- Mutual exclusion is enforced both ways: a block cannot cover a confirmed reservation, and a reservation cannot land on a block (`DatesUnavailableError`). Cancelled reservations never take nights.
- The reservations service now delegates its conflict checks here (`findReservationConflict` / `findBlockConflict`). The booking engine (E6) and channel sync (E8) must use the same checks — never reimplement overlap logic.

## Code map

| Path | Role |
|------|------|
| `src/db/schema.ts` → `rental_blocks` | blocked periods table |
| `src/server/availability/service.ts` | conflict checks, blocks CRUD, `getCalendar` aggregation |
| `src/lib/month.ts` | pure month math (boundaries, leap years, Monday-based weekdays) |
| `src/app/calendar/*` | page, block form, actions |
| `src/components/calendar/*` | block bar (two-click delete), block form |

## Out of scope (follow-ups)

Per-night prices in cells (needs pricing, E5), week/list views, drag-to-create, channel-sourced busy ranges (E8).
