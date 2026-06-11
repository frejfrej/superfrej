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
