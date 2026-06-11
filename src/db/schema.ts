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
