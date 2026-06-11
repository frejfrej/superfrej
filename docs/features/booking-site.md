# Feature: Direct booking site

> Story [#25](https://github.com/frejfrej/superfrej/issues/25) · Epic E6 [#6](https://github.com/frejfrej/superfrej/issues/6)

## Behavior

- **Public site** (`/book`): cards for every active rental with capacity facts and the cheapest configured nightly rate ("from €X / night" = min of base and season prices).
- **Rental page** (`/book/{slug}`): description, key facts, and the **booking widget**: dates + party → live availability check + full price breakdown (`GET /api/booking/check`) → guest details → **instant booking** → confirmation page with stay summary.
- **Admin page** (`/booking-site`): share links to the site and each rental page.
- The admin shell now lives in the `(admin)` route group; `/book/*` has its own guest-facing layout (workspace name as the brand, no admin navigation).

## Rules (`src/server/booking/service.ts`)

Guest bookings are stricter than the host's manual flow:

| Rule | Host (manual) | Guest (direct) |
|------|--------------|----------------|
| Min/max nights | warning, can override | **blocking**, guest-readable reason |
| Past check-in | allowed (back-dating real stays) | blocked |
| Party ≤ capacity | blocking | blocking |
| Double-booking / blocks | blocking | blocking (same availability service) |
| Price | host types the total | **always** the server-side quote — the client's total is never read |
| Email | optional | required (it's the only guest handle) |

Bookings are created through the existing reservation service with `source: "direct"` — same overlap protection, same guest dedupe. Payment is out of scope until Epic E7 (the confirmation says payment settles with the host).

The confirmation page only resolves `direct` reservations whose rental slug matches the URL; reservation ids are UUIDs (unguessable). Proper guest auth arrives with the guest portal (E11).

## Code map

| Path | Role |
|------|------|
| `src/server/booking/service.ts` | public listing, `checkStay`, `bookDirect` |
| `src/app/book/*` | public layout + pages + booking action |
| `src/app/api/booking/check/route.ts` | live availability + quote for the widget |
| `src/components/booking/booking-widget.tsx` | check → breakdown → details → book |
| `src/app/(admin)/booking-site/page.tsx` | share-links admin page |

## Out of scope (follow-ups)

Request-to-book, photos, promo codes, multi-language, payments (E7), embeddable widget, custom domains, SEO/meta polish.
