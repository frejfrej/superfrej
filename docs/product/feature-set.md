# Superfrej — Settled Feature Set & Roadmap

**Status:** settled (2026-06-11) · **Sources:** hands-on SuperHote V2 walkthrough + competitive research (Guesty, Lodgify, Hospitable, Smoobu, Beds24, Hostaway, Uplisting, OwnerRez, Tokeet).

Superfrej is a full-featured **vacation-rental PMS + Channel Manager**: everything a host or conciergerie needs to run short-term rentals — reservations, calendar, guest communication, payments, operations — plus synchronization of rates, availability and bookings across OTA channels (Airbnb, Booking.com, Vrbo, …) and a zero-commission direct-booking site.

## Product principles

1. **Simple UX over feature sprawl.** Every screen must be usable without training. Empty states teach.
2. **Unique, modern UI.** A distinctive design system ("Maison") — not a generic SaaS template.
3. **Workable end-to-end, always.** Every external dependency (OTA APIs, Stripe, SMS) lives behind an adapter interface with a fully functional local implementation (simulator or file-based), so the whole product runs locally with zero external accounts. Real adapters plug in later without touching domain code.
4. **File-backed persistence, real-DB ready.** SQLite file via Drizzle ORM; switching to Postgres is a driver/dialect swap, not a rewrite.

## Feature classification

`[TS]` table stakes (every serious competitor has it) · `[D]` differentiator · `[A]` advanced/deferred

### PMS core
- [TS] Rentals (properties): details, capacity, rooms, amenities, photos, check-in/out windows, booking rules (min/max nights, lead time, preparation time, availability window), multi-unit parent/child dependencies
- [TS] Reservations: create/modify/cancel, statuses, sources (direct/OTA/manual), payment & cleaning status, export
- [TS] Multi-property calendar: month/week/list views, per-night prices, drag-to-book, blocked periods
- [TS] Guest CRM: profiles, history, language, ratings, total spent, notes, export
- [TS] Pricing: base/weekend price, seasonal rates, cleaning fee, city tax, VAT, per-channel markup, LOS/early-bird/last-minute discounts, gap-fill
- [TS] Payments: payment schedules (full/installments), deposits (pre-auth hold / refundable charge), refunds, payment links, multiple collection accounts — behind a `PaymentProvider` interface (local provider + Stripe adapter later)
- [TS] Invoicing & receipts with VAT (EU-grade)
- [TS] Tasks & teams: auto-generated cleaning/check-in/checkout tasks from reservation events, assignment rules, checklists, roles (manager/cleaning/check-in/owner), contractor scoping, incidents
- [TS] Reporting: occupancy, ADR, RevPAR, gross→net revenue, per-rental & per-channel breakdown, monthly tables, CSV export
- [D] Owner portal & statements: read-only owner view, automated statements, commission rules (top competitive gap vs SuperHote)
- [A] Trust accounting, QuickBooks/Xero sync

### Channel manager
- [TS] Channel abstraction: per-rental channel connections, listing mapping, sync state & health dashboard, error queue
- [TS] Rates/availability/restrictions push + reservation pull, double-booking prevention; **local OTA simulator** plays the role of Airbnb/Booking sandbox
- [TS] iCal import/export (universal fallback, works with real OTAs today)
- [TS] Channel-specific markup and per-channel content overrides
- [D] Listing content sync (photos/descriptions/amenities)
- [A] Rate plans/occupancy-based pricing, long-tail channels, Google Vacation Rentals

### Guest experience
- [TS] Unified inbox: one thread per reservation, multi-channel (OTA chat / email / SMS simulated), templates, auto-translation hooks
- [TS] Automated messaging: trigger+offset rules (booking, pre-arrival, check-in, checkout, review request), per-source channel selection, last-minute variants, **shortcodes** (dynamic fields)
- [TS] Digital guidebook / arrival & departure instructions
- [D] Guest portal (no-login web page per reservation): online check-in form, document upload, contract e-sign, door codes reveal, Wi-Fi, **extras/upsells shop**, messaging tab
- [D] Review management: requests, auto-post host reviews
- [D] Smart-lock code automation (adapter interface; local simulator)
- [A] ID verification/screening, tourist-tax authority reporting

### Direct booking
- [TS] Hosted booking site per account: rental pages, live availability & quote (fees, taxes, discounts), instant book / request-to-book, promo codes, multi-language (FR/EN first)
- [TS] Embeddable widget / iframe per rental
- [A] Full website builder with templates

### Pricing / revenue
- [TS] Manual rate tools (seasons, weekends, LOS)
- [D] Dynamic-pricing integration interface (PriceLabs-style adapter + local rule-based engine)

### Platform
- [TS] Multi-user with role-based permissions; settings; FR/EN UI (i18n-ready, EN first)
- [TS] Open REST API + webhooks (the same API the UI uses)
- [TS] Audit-friendly: every sync/payment/message logged

## Epics (GitHub issues, label `epic`)

| # | Epic | Phase |
|---|------|-------|
| E1 | Foundation: scaffold, DB layer, tests, CI, design system shell | P0 |
| E2 | Rentals (property management) | P1 |
| E3 | Calendar & availability | P1 |
| E4 | Reservations & guest CRM | P1 |
| E5 | Pricing & quotes engine | P2 |
| E6 | Direct booking site & engine | P2 |
| E7 | Payments, deposits & invoicing | P2 |
| E8 | Channel manager (iCal + simulator-backed OTA sync) | P3 |
| E9 | Unified inbox & messaging | P3 |
| E10 | Automated messages & shortcodes | P3 |
| E11 | Guest portal & extras shop | P4 |
| E12 | Operations: tasks, teams, checklists, incidents | P4 |
| E13 | Analytics & reporting | P5 |
| E14 | Owner portal & statements | P5 |
| E15 | Platform: users/roles, settings, public API, i18n | P5 |

Phases are sequential targets, but each epic ships as independent, fully-tested, documented increments (one PR per story).

## Out of scope (for now)

Native mobile apps, real OTA API certification, live Stripe processing (adapter ships with simulator), trust accounting, AI assistants, website template builder, long-tail channels.
