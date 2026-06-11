# Feature: Reservations & guests

> Story [#19](https://github.com/frejfrej/superfrej/issues/19) · Epic E4 [#4](https://github.com/frejfrej/superfrej/issues/4)

## Behavior

- **Reservations** (`/reservations`): record manual/direct bookings on a rental with stay dates, party size, total price and private notes. Tabs Upcoming / Past / Cancelled / All; search by guest or rental name.
- **Guests** (`/guests`): lightweight CRM. Guests are created automatically when recording a reservation and **deduplicated by email** (lowercased); a returning guest's contact details are refreshed with the latest data. Guests without an email are always created fresh — nothing safe to match on.
- **Cancel / restore** instead of delete: cancelling frees the dates; restoring re-checks them and fails if the gap was rebooked meanwhile.

## Invariants (enforced in the service layer)

| Rule | Notes |
|------|-------|
| **No double-booking**: a confirmed reservation may not overlap another confirmed one on the same rental | Strict interval overlap (`in < otherOut && out > otherIn`) so **back-to-back stays are allowed** (A checks out the morning B checks in). Cancelled stays never block. This is the invariant the channel manager (Epic E8) will rely on. |
| Check-out strictly after check-in; dates are real calendar dates | Dates are ISO `YYYY-MM-DD` **strings** end-to-end — no `Date` objects for stay dates, so timezones can never shift a night. |
| Party size ≤ rental capacity | `CapacityError` |
| Min/max nights are **advisory** | Saving succeeds but returns warnings shown to the host (hosts legitimately override their own rules; OTAs enforce theirs upstream). |

- **Status model**: stored status is only `confirmed` or `cancelled`; *completed* is derived at display time (confirmed + check-out in the past). No nightly job needed.
- **Money**: integer cents + currency code (EUR for now). The form takes euros; conversion happens in the action.
- **Source**: `manual` today; `direct` (booking engine) and OTA sources arrive with later epics.

## Code map

| Path | Role |
|------|------|
| `src/db/schema.ts` → `guests`, `reservations` | tables (FKs to rentals/guests) |
| `src/server/guests/service.ts` | guest CRM + email dedupe |
| `src/server/reservations/service.ts` | create/update/cancel/restore/list, overlap + capacity invariants, status derivation |
| `src/lib/dates.ts` | ISO-date helpers (validated, DST-proof night counting) |
| `src/app/reservations/*`, `src/app/guests/*` | pages + actions |

## Out of scope (follow-ups)

Calendar UI (E3 #3), automatic pricing/quotes (E5 #5), payments & deposits (E7 #7), CSV export, per-guest history page, OTA reservations (E8 #8).
