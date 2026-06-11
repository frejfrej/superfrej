import { randomUUID } from "node:crypto";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/client";
import {
  guests,
  rentalBlocks,
  rentals,
  reservations,
  type RentalBlockRow,
  type RentalRow,
  type ReservationRow,
} from "@/db/schema";
import { isIsoDate } from "@/lib/dates";

/**
 * Availability — the single source of truth for "is this range free?".
 * A rental's nights are taken by confirmed reservations and by host blocks;
 * both use [start, end) semantics so back-to-back is always allowed.
 * The booking engine (E6) and channel sync (E8) must use these checks too.
 */

export function findReservationConflict(
  db: Db,
  rentalId: string,
  start: string,
  end: string,
  excludeReservationId?: string,
): ReservationRow | undefined {
  const conditions = [
    eq(reservations.rentalId, rentalId),
    eq(reservations.status, "confirmed"),
    sql`${reservations.checkIn} < ${end}`,
    sql`${reservations.checkOut} > ${start}`,
  ];
  if (excludeReservationId) {
    conditions.push(ne(reservations.id, excludeReservationId));
  }
  return db
    .select()
    .from(reservations)
    .where(and(...conditions))
    .get();
}

export function findBlockConflict(
  db: Db,
  rentalId: string,
  start: string,
  end: string,
  excludeBlockId?: string,
): RentalBlockRow | undefined {
  const conditions = [
    eq(rentalBlocks.rentalId, rentalId),
    sql`${rentalBlocks.startDate} < ${end}`,
    sql`${rentalBlocks.endDate} > ${start}`,
  ];
  if (excludeBlockId) conditions.push(ne(rentalBlocks.id, excludeBlockId));
  return db
    .select()
    .from(rentalBlocks)
    .where(and(...conditions))
    .get();
}

export class DatesUnavailableError extends Error {
  constructor(public cause_: "reservation" | "block") {
    super(
      cause_ === "reservation"
        ? "These dates overlap a confirmed reservation"
        : "These dates overlap a blocked period",
    );
    this.name = "DatesUnavailableError";
  }
}

export const blockInputSchema = z
  .object({
    rentalId: z.string().min(1, "Pick a rental"),
    startDate: z.string().refine(isIsoDate, "First blocked day must be a date"),
    endDate: z.string().refine(isIsoDate, "First free day must be a date"),
    reason: z.string().trim().max(200).default(""),
  })
  .refine((v) => v.endDate > v.startDate, {
    message: "End must be after start",
    path: ["endDate"],
  });

export type BlockInput = z.infer<typeof blockInputSchema>;

export class BlockNotFoundError extends Error {
  constructor(id: string) {
    super(`Block not found: ${id}`);
    this.name = "BlockNotFoundError";
  }
}

export function createBlock(db: Db, raw: BlockInput): RentalBlockRow {
  const input = blockInputSchema.parse(raw);
  if (findReservationConflict(db, input.rentalId, input.startDate, input.endDate)) {
    throw new DatesUnavailableError("reservation");
  }
  if (findBlockConflict(db, input.rentalId, input.startDate, input.endDate)) {
    throw new DatesUnavailableError("block");
  }
  const now = Date.now();
  const row: RentalBlockRow = {
    id: randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(rentalBlocks).values(row).run();
  return row;
}

/** Blocks carry no history worth keeping — hard delete is fine. */
export function deleteBlock(db: Db, id: string): void {
  const row = db.select().from(rentalBlocks).where(eq(rentalBlocks.id, id)).get();
  if (!row) throw new BlockNotFoundError(id);
  db.delete(rentalBlocks).where(eq(rentalBlocks.id, id)).run();
}

export type CalendarReservation = {
  reservation: ReservationRow;
  guestName: string;
};

export type CalendarRow = {
  rental: RentalRow;
  reservations: CalendarReservation[];
  blocks: RentalBlockRow[];
};

/** Everything the calendar grid needs for [from, to): every active rental
 * with its confirmed reservations and blocks intersecting the range. */
export function getCalendar(db: Db, from: string, to: string): CalendarRow[] {
  const activeRentals = db
    .select()
    .from(rentals)
    .where(eq(rentals.status, "active"))
    .orderBy(asc(rentals.name))
    .all();

  const resRows = db
    .select()
    .from(reservations)
    .innerJoin(guests, eq(reservations.guestId, guests.id))
    .where(
      and(
        eq(reservations.status, "confirmed"),
        sql`${reservations.checkIn} < ${to}`,
        sql`${reservations.checkOut} > ${from}`,
      ),
    )
    .all();

  const blockRows = db
    .select()
    .from(rentalBlocks)
    .where(
      and(
        sql`${rentalBlocks.startDate} < ${to}`,
        sql`${rentalBlocks.endDate} > ${from}`,
      ),
    )
    .all();

  return activeRentals.map((rental) => ({
    rental,
    reservations: resRows
      .filter((r) => r.reservations.rentalId === rental.id)
      .map((r) => ({
        reservation: r.reservations,
        guestName: `${r.guests.firstName} ${r.guests.lastName}`,
      })),
    blocks: blockRows.filter((b) => b.rentalId === rental.id),
  }));
}
