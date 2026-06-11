import { randomUUID } from "node:crypto";
import { and, asc, eq, like, or, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { rentals, type RentalRow } from "@/db/schema";
import { slugify } from "@/lib/slug";
import { rentalInputSchema, type RentalInput } from "./validation";

export class RentalNotFoundError extends Error {
  constructor(id: string) {
    super(`Rental not found: ${id}`);
    this.name = "RentalNotFoundError";
  }
}

export type RentalListFilter = {
  /** Case-insensitive match on name or city. */
  q?: string;
  status?: "active" | "archived";
};

export function listRentals(db: Db, filter: RentalListFilter = {}): RentalRow[] {
  const conditions = [];
  if (filter.status) conditions.push(eq(rentals.status, filter.status));
  if (filter.q?.trim()) {
    const pattern = `%${filter.q.trim().toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${rentals.name})`, pattern),
        like(sql`lower(${rentals.city})`, pattern),
      ),
    );
  }
  return db
    .select()
    .from(rentals)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(rentals.name))
    .all();
}

export function getRental(db: Db, id: string): RentalRow {
  const row = db.select().from(rentals).where(eq(rentals.id, id)).get();
  if (!row) throw new RentalNotFoundError(id);
  return row;
}

/** Find a slug that isn't taken yet: base, base-2, base-3, … */
function availableSlug(db: Db, base: string, excludeId?: string): string {
  for (let i = 1; ; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const taken = db
      .select({ id: rentals.id })
      .from(rentals)
      .where(eq(rentals.slug, candidate))
      .get();
    if (!taken || taken.id === excludeId) return candidate;
  }
}

export function createRental(db: Db, input: RentalInput): RentalRow {
  const data = rentalInputSchema.parse(input);
  const now = Date.now();
  const row: RentalRow = {
    id: randomUUID(),
    slug: availableSlug(db, slugify(data.name)),
    status: "active",
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(rentals).values(row).run();
  return row;
}

export function updateRental(db: Db, id: string, input: RentalInput): RentalRow {
  const existing = getRental(db, id);
  const data = rentalInputSchema.parse(input);
  // Renaming refreshes the slug (it only ever appears in admin URLs for now;
  // revisit when slugs become public booking-site URLs).
  const slug =
    data.name === existing.name
      ? existing.slug
      : availableSlug(db, slugify(data.name), id);
  db.update(rentals)
    .set({ ...data, slug, updatedAt: Date.now() })
    .where(eq(rentals.id, id))
    .run();
  return getRental(db, id);
}

export function archiveRental(db: Db, id: string): RentalRow {
  getRental(db, id);
  db.update(rentals)
    .set({ status: "archived", updatedAt: Date.now() })
    .where(eq(rentals.id, id))
    .run();
  return getRental(db, id);
}

export function restoreRental(db: Db, id: string): RentalRow {
  getRental(db, id);
  db.update(rentals)
    .set({ status: "active", updatedAt: Date.now() })
    .where(eq(rentals.id, id))
    .run();
  return getRental(db, id);
}
