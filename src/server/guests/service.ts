import { randomUUID } from "node:crypto";
import { asc, eq, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/client";
import { guests, type GuestRow } from "@/db/schema";

export const guestInputSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z
    .union([z.literal(""), z.string().trim().toLowerCase().email("Invalid email")])
    .default(""),
  phone: z.string().trim().max(30).default(""),
  language: z.string().trim().toLowerCase().length(2).default("en"),
  notes: z.string().trim().max(10_000).default(""),
});

export type GuestInput = z.infer<typeof guestInputSchema>;

export class GuestNotFoundError extends Error {
  constructor(id: string) {
    super(`Guest not found: ${id}`);
    this.name = "GuestNotFoundError";
  }
}

export function getGuest(db: Db, id: string): GuestRow {
  const row = db.select().from(guests).where(eq(guests.id, id)).get();
  if (!row) throw new GuestNotFoundError(id);
  return row;
}

export function listGuests(db: Db, filter: { q?: string } = {}): GuestRow[] {
  const q = filter.q?.trim().toLowerCase();
  return db
    .select()
    .from(guests)
    .where(
      q
        ? or(
            like(sql`lower(${guests.firstName})`, `%${q}%`),
            like(sql`lower(${guests.lastName})`, `%${q}%`),
            like(sql`lower(${guests.email})`, `%${q}%`),
          )
        : undefined,
    )
    .orderBy(asc(guests.lastName), asc(guests.firstName))
    .all();
}

/**
 * Reuse an existing guest when the email matches (emails are stored
 * lowercased); otherwise create one. Guests without email are always created
 * fresh — there is nothing safe to match on.
 */
export function findOrCreateGuest(db: Db, input: GuestInput): GuestRow {
  const data = guestInputSchema.parse(input);
  if (data.email) {
    const existing = db
      .select()
      .from(guests)
      .where(eq(guests.email, data.email))
      .get();
    if (existing) {
      // Refresh contact details with the latest information provided.
      db.update(guests)
        .set({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || existing.phone,
          language: data.language,
          updatedAt: Date.now(),
        })
        .where(eq(guests.id, existing.id))
        .run();
      return getGuest(db, existing.id);
    }
  }
  const now = Date.now();
  const row: GuestRow = { id: randomUUID(), ...data, createdAt: now, updatedAt: now };
  db.insert(guests).values(row).run();
  return row;
}
