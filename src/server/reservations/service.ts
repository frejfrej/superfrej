import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import {
  guests,
  rentals,
  reservations,
  type GuestRow,
  type RentalRow,
  type ReservationRow,
} from "@/db/schema";
import { nightsBetween, todayIso } from "@/lib/dates";
import {
  DatesUnavailableError,
  findBlockConflict,
  findReservationConflict,
} from "@/server/availability/service";
import { findOrCreateGuest } from "@/server/guests/service";
import { getRental } from "@/server/rentals/service";
import { reservationInputSchema, type ReservationInput } from "./validation";

export class ReservationNotFoundError extends Error {
  constructor(id: string) {
    super(`Reservation not found: ${id}`);
    this.name = "ReservationNotFoundError";
  }
}

/** Thrown when a stay would double-book a rental — the invariant the whole
 * channel-manager side of the product relies on. */
export class OverlapError extends Error {
  constructor(public conflictId: string) {
    super("These dates overlap another confirmed reservation on this rental");
    this.name = "OverlapError";
  }
}

export class CapacityError extends Error {
  constructor(max: number) {
    super(`This rental sleeps at most ${max} guests`);
    this.name = "CapacityError";
  }
}

/** confirmed + checkOut in the past ⇒ shown as "completed" (never stored). */
export type DisplayStatus = "confirmed" | "completed" | "cancelled";

export function displayStatus(
  row: Pick<ReservationRow, "status" | "checkOut">,
  today = todayIso(),
): DisplayStatus {
  if (row.status === "cancelled") return "cancelled";
  return row.checkOut <= today ? "completed" : "confirmed";
}

/** Throws if [checkIn, checkOut) collides with a confirmed reservation or a
 * host block on this rental. Overlap is strict (back-to-back allowed). */
function assertDatesFree(
  db: Db,
  rentalId: string,
  checkIn: string,
  checkOut: string,
  excludeId?: string,
): void {
  const conflict = findReservationConflict(db, rentalId, checkIn, checkOut, excludeId);
  if (conflict) throw new OverlapError(conflict.id);
  if (findBlockConflict(db, rentalId, checkIn, checkOut)) {
    throw new DatesUnavailableError("block");
  }
}

export type ReservationWithRelations = {
  reservation: ReservationRow;
  rental: RentalRow;
  guest: GuestRow;
};

export type SaveResult = ReservationWithRelations & {
  /** Non-blocking advisories (e.g. stay shorter than the rental's minimum). */
  warnings: string[];
};

function stayWarnings(rental: RentalRow, input: ReservationInput): string[] {
  const warnings: string[] = [];
  const nights = nightsBetween(input.checkIn, input.checkOut);
  if (nights < rental.minNights) {
    warnings.push(
      `Stay is ${nights} night${nights > 1 ? "s" : ""}, below this rental's minimum of ${rental.minNights}.`,
    );
  }
  if (nights > rental.maxNights) {
    warnings.push(
      `Stay is ${nights} nights, above this rental's maximum of ${rental.maxNights}.`,
    );
  }
  return warnings;
}

function validateAgainstRental(db: Db, input: ReservationInput): RentalRow {
  const rental = getRental(db, input.rentalId);
  if (input.adults + input.children > rental.maxGuests) {
    throw new CapacityError(rental.maxGuests);
  }
  return rental;
}

export function createReservation(
  db: Db,
  raw: ReservationInput,
  opts: { source?: ReservationRow["source"] } = {},
): SaveResult {
  const input = reservationInputSchema.parse(raw);
  const rental = validateAgainstRental(db, input);
  assertDatesFree(db, input.rentalId, input.checkIn, input.checkOut);

  const guest = findOrCreateGuest(db, input.guest);
  const now = Date.now();
  const row: ReservationRow = {
    id: randomUUID(),
    rentalId: input.rentalId,
    guestId: guest.id,
    status: "confirmed",
    source: opts.source ?? "manual",
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: input.adults,
    children: input.children,
    totalCents: Math.round(input.totalEuros * 100),
    currency: "EUR",
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(reservations).values(row).run();
  return { reservation: row, rental, guest, warnings: stayWarnings(rental, input) };
}

export function updateReservation(
  db: Db,
  id: string,
  raw: ReservationInput,
): SaveResult {
  const existing = getReservation(db, id);
  const input = reservationInputSchema.parse(raw);
  const rental = validateAgainstRental(db, input);
  // A cancelled reservation never blocks dates, and editing it must not
  // bring it back: status is only changed via cancel/restore.
  if (existing.reservation.status === "confirmed") {
    assertDatesFree(db, input.rentalId, input.checkIn, input.checkOut, id);
  }
  const guest = findOrCreateGuest(db, input.guest);
  db.update(reservations)
    .set({
      rentalId: input.rentalId,
      guestId: guest.id,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      adults: input.adults,
      children: input.children,
      totalCents: Math.round(input.totalEuros * 100),
      notes: input.notes,
      updatedAt: Date.now(),
    })
    .where(eq(reservations.id, id))
    .run();
  return { ...getReservation(db, id), warnings: stayWarnings(rental, input) };
}

export function cancelReservation(db: Db, id: string): ReservationRow {
  getReservation(db, id);
  db.update(reservations)
    .set({ status: "cancelled", updatedAt: Date.now() })
    .where(eq(reservations.id, id))
    .run();
  return getReservation(db, id).reservation;
}

/** Re-confirm a cancelled reservation; dates must still be free. */
export function restoreReservation(db: Db, id: string): ReservationRow {
  const { reservation } = getReservation(db, id);
  assertDatesFree(db, reservation.rentalId, reservation.checkIn, reservation.checkOut, id);
  db.update(reservations)
    .set({ status: "confirmed", updatedAt: Date.now() })
    .where(eq(reservations.id, id))
    .run();
  return getReservation(db, id).reservation;
}

export function getReservation(db: Db, id: string): ReservationWithRelations {
  const row = db
    .select()
    .from(reservations)
    .innerJoin(rentals, eq(reservations.rentalId, rentals.id))
    .innerJoin(guests, eq(reservations.guestId, guests.id))
    .where(eq(reservations.id, id))
    .get();
  if (!row) throw new ReservationNotFoundError(id);
  return { reservation: row.reservations, rental: row.rentals, guest: row.guests };
}

export type ReservationListTab = "upcoming" | "past" | "cancelled" | "all";

export function listReservations(
  db: Db,
  filter: { tab?: ReservationListTab; q?: string } = {},
): ReservationWithRelations[] {
  const today = todayIso();
  const tab = filter.tab ?? "upcoming";
  const conditions = [];
  if (tab === "upcoming") {
    conditions.push(eq(reservations.status, "confirmed"));
    conditions.push(sql`${reservations.checkOut} > ${today}`);
  } else if (tab === "past") {
    conditions.push(eq(reservations.status, "confirmed"));
    conditions.push(sql`${reservations.checkOut} <= ${today}`);
  } else if (tab === "cancelled") {
    conditions.push(eq(reservations.status, "cancelled"));
  }
  const q = filter.q?.trim().toLowerCase();
  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      sql`(lower(${guests.firstName}) LIKE ${pattern}
        OR lower(${guests.lastName}) LIKE ${pattern}
        OR lower(${rentals.name}) LIKE ${pattern})`,
    );
  }
  const rows = db
    .select()
    .from(reservations)
    .innerJoin(rentals, eq(reservations.rentalId, rentals.id))
    .innerJoin(guests, eq(reservations.guestId, guests.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      tab === "upcoming" ? sql`${reservations.checkIn} asc` : desc(reservations.checkIn),
    )
    .all();
  return rows.map((r) => ({
    reservation: r.reservations,
    rental: r.rentals,
    guest: r.guests,
  }));
}
