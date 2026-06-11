import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Single source of truth for the database schema.
 *
 * Conventions (keep these — they make the later Postgres switch mechanical):
 * - ids: text UUIDs generated in the service layer, never autoincrement
 * - timestamps: integer epoch milliseconds, named `createdAt` / `updatedAt`
 * - money: integer minor units (cents) + a currency column where relevant
 * - JSON blobs: text columns with `{ mode: "json" }`, validated by zod in services
 */

/** Typed key-value store for workspace-level settings. */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const PROPERTY_TYPES = [
  "apartment",
  "house",
  "studio",
  "villa",
  "chalet",
  "room",
  "other",
] as const;

export const RENTAL_STATUSES = ["active", "archived"] as const;

/** A bookable property. Times are "HH:MM" local to the property. */
export const rentals = sqliteTable("rentals", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: RENTAL_STATUSES }).notNull().default("active"),
  propertyType: text("property_type", { enum: PROPERTY_TYPES })
    .notNull()
    .default("apartment"),
  description: text("description").notNull().default(""),
  street: text("street").notNull().default(""),
  city: text("city").notNull().default(""),
  zip: text("zip").notNull().default(""),
  country: text("country").notNull().default(""),
  maxGuests: integer("max_guests").notNull(),
  bedrooms: integer("bedrooms").notNull().default(1),
  beds: integer("beds").notNull().default(1),
  bathrooms: integer("bathrooms").notNull().default(1),
  checkInFrom: text("check_in_from").notNull().default("16:00"),
  checkInTo: text("check_in_to").notNull().default("22:00"),
  checkOutUntil: text("check_out_until").notNull().default("10:00"),
  minNights: integer("min_nights").notNull().default(1),
  maxNights: integer("max_nights").notNull().default(365),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export type RentalRow = typeof rentals.$inferSelect;

/** A person who stays (or stayed) in one of the rentals. */
export const guests = sqliteTable("guests", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  /** Empty string = unknown. Unique when present (case-insensitive, app-enforced). */
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  /** BCP47-ish two-letter code for guest communication. */
  language: text("language").notNull().default("en"),
  notes: text("notes").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export type GuestRow = typeof guests.$inferSelect;

export const RESERVATION_STATUSES = ["confirmed", "cancelled"] as const;
export const RESERVATION_SOURCES = ["direct", "manual"] as const;

/**
 * A stay. Dates are ISO "YYYY-MM-DD" (nights = checkOut - checkIn);
 * money in integer cents. "completed" is derived (confirmed + checkOut in
 * the past), never stored.
 */
export const reservations = sqliteTable("reservations", {
  id: text("id").primaryKey(),
  rentalId: text("rental_id")
    .notNull()
    .references(() => rentals.id),
  guestId: text("guest_id")
    .notNull()
    .references(() => guests.id),
  status: text("status", { enum: RESERVATION_STATUSES })
    .notNull()
    .default("confirmed"),
  source: text("source", { enum: RESERVATION_SOURCES })
    .notNull()
    .default("manual"),
  checkIn: text("check_in").notNull(),
  checkOut: text("check_out").notNull(),
  adults: integer("adults").notNull().default(1),
  children: integer("children").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  currency: text("currency").notNull().default("EUR"),
  notes: text("notes").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export type ReservationRow = typeof reservations.$inferSelect;

/** Host-blocked dates (maintenance, personal use). Same date semantics as
 * reservations: [start, end) — the end date itself is free again. */
export const rentalBlocks = sqliteTable("rental_blocks", {
  id: text("id").primaryKey(),
  rentalId: text("rental_id")
    .notNull()
    .references(() => rentals.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  reason: text("reason").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export type RentalBlockRow = typeof rentalBlocks.$inferSelect;

/** Pricing configuration, one row per rental (created lazily with defaults).
 * All money in integer cents; discount percentages as integers (0–90). */
export const rentalPricing = sqliteTable("rental_pricing", {
  rentalId: text("rental_id")
    .primaryKey()
    .references(() => rentals.id),
  /** Nightly base price. */
  baseCents: integer("base_cents").notNull().default(100_00),
  /** Friday & Saturday nights; null = same as base. */
  weekendCents: integer("weekend_cents"),
  cleaningFeeCents: integer("cleaning_fee_cents").notNull().default(0),
  /** Per guest per night. */
  cityTaxCents: integer("city_tax_cents").notNull().default(0),
  /** Applied when nights ≥ 7. */
  weeklyDiscountPct: integer("weekly_discount_pct").notNull().default(0),
  /** Applied when nights ≥ 28 (wins over weekly). */
  monthlyDiscountPct: integer("monthly_discount_pct").notNull().default(0),
  currency: text("currency").notNull().default("EUR"),
  updatedAt: integer("updated_at").notNull(),
});

export type RentalPricingRow = typeof rentalPricing.$inferSelect;

/** Named seasonal rate overriding nightly prices for [startDate, endDate). */
export const rentalSeasons = sqliteTable("rental_seasons", {
  id: text("id").primaryKey(),
  rentalId: text("rental_id")
    .notNull()
    .references(() => rentals.id),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  nightlyCents: integer("nightly_cents").notNull(),
  /** null = use the season's nightly price on weekends too. */
  weekendCents: integer("weekend_cents"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export type RentalSeasonRow = typeof rentalSeasons.$inferSelect;
