import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/client";
import { rentalPricing, rentals, rentalSeasons, type RentalRow } from "@/db/schema";
import { isIsoDate, nightsBetween, todayIso } from "@/lib/dates";
import {
  findBlockConflict,
  findReservationConflict,
} from "@/server/availability/service";
import { quoteStay } from "@/server/pricing/service";
import type { Quote } from "@/server/pricing/engine";
import {
  createReservation,
  type SaveResult,
} from "@/server/reservations/service";
import { getRentalBySlug, RentalNotFoundError } from "@/server/rentals/service";

/**
 * The direct-booking engine: what guests can see and do on the public site.
 * Unlike the host's manual flow, guest bookings ENFORCE the rental's stay
 * rules and ALWAYS price server-side via the quote engine — the client's
 * total is never trusted.
 */

export type PublicRental = RentalRow & {
  /** Cheapest configured nightly rate ("from €X / night"). */
  fromCents: number;
  currency: string;
};

export function listPublicRentals(db: Db): PublicRental[] {
  const rows = db
    .select()
    .from(rentals)
    .where(eq(rentals.status, "active"))
    .orderBy(asc(rentals.name))
    .all();
  return rows.map((rental) => decorate(db, rental));
}

function decorate(db: Db, rental: RentalRow): PublicRental {
  const pricing = db
    .select()
    .from(rentalPricing)
    .where(eq(rentalPricing.rentalId, rental.id))
    .get();
  const seasons = db
    .select({ nightlyCents: rentalSeasons.nightlyCents })
    .from(rentalSeasons)
    .where(eq(rentalSeasons.rentalId, rental.id))
    .all();
  const base = pricing?.baseCents ?? 100_00;
  return {
    ...rental,
    fromCents: Math.min(base, ...seasons.map((s) => s.nightlyCents)),
    currency: pricing?.currency ?? "EUR",
  };
}

export function getPublicRental(db: Db, slug: string): PublicRental {
  const rental = getRentalBySlug(db, slug);
  if (rental.status !== "active") throw new RentalNotFoundError(slug);
  return decorate(db, rental);
}

export type AvailabilityResult = {
  available: boolean;
  /** Guest-readable reasons when not bookable. */
  reasons: string[];
  quote: Quote | null;
};

/** Can [checkIn, checkOut) × guests be booked? Returns reasons + quote. */
export function checkStay(
  db: Db,
  rental: RentalRow,
  checkIn: string,
  checkOut: string,
  guests: number,
): AvailabilityResult {
  const reasons: string[] = [];
  const nights = nightsBetween(checkIn, checkOut);

  if (checkIn < todayIso()) reasons.push("Check-in is in the past.");
  if (nights < 1) reasons.push("Check-out must be after check-in.");
  if (nights >= 1 && nights < rental.minNights) {
    reasons.push(`Minimum stay is ${rental.minNights} nights.`);
  }
  if (nights > rental.maxNights) {
    reasons.push(`Maximum stay is ${rental.maxNights} nights.`);
  }
  if (guests > rental.maxGuests) {
    reasons.push(`This place sleeps at most ${rental.maxGuests} guests.`);
  }
  if (
    reasons.length === 0 &&
    (findReservationConflict(db, rental.id, checkIn, checkOut) ||
      findBlockConflict(db, rental.id, checkIn, checkOut))
  ) {
    reasons.push("These dates are no longer available.");
  }

  if (reasons.length > 0) return { available: false, reasons, quote: null };
  return {
    available: true,
    reasons: [],
    quote: quoteStay(db, rental.id, checkIn, checkOut, guests),
  };
}

export class StayNotBookableError extends Error {
  constructor(public reasons: string[]) {
    super(reasons.join(" "));
    this.name = "StayNotBookableError";
  }
}

export const directBookingSchema = z.object({
  slug: z.string().min(1),
  checkIn: z.string().refine(isIsoDate, "Pick a check-in date"),
  checkOut: z.string().refine(isIsoDate, "Pick a check-out date"),
  adults: z.coerce.number().int().min(1, "At least 1 adult").max(100),
  children: z.coerce.number().int().min(0).max(100),
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().toLowerCase().email("A valid email is required"),
  phone: z.string().trim().max(30).default(""),
});

export type DirectBookingInput = z.infer<typeof directBookingSchema>;

/** Instant booking from the public site. */
export function bookDirect(db: Db, raw: DirectBookingInput): SaveResult {
  const input = directBookingSchema.parse(raw);
  const rental = getPublicRental(db, input.slug);
  const guests = input.adults + input.children;

  const check = checkStay(db, rental, input.checkIn, input.checkOut, guests);
  if (!check.available || !check.quote) {
    throw new StayNotBookableError(check.reasons);
  }

  return createReservation(
    db,
    {
      rentalId: rental.id,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      adults: input.adults,
      children: input.children,
      totalEuros: check.quote.totalCents / 100,
      notes: "",
      guest: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        language: "en",
        notes: "",
      },
    },
    { source: "direct" },
  );
}
