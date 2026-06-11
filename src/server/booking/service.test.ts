import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { createTestDb } from "@/db/test-utils";
import { createBlock } from "@/server/availability/service";
import { savePricing } from "@/server/pricing/service";
import { archiveRental, createRental } from "@/server/rentals/service";
import { createReservation } from "@/server/reservations/service";
import {
  bookDirect,
  checkStay,
  getPublicRental,
  listPublicRentals,
  StayNotBookableError,
  type DirectBookingInput,
} from "./service";
import { RentalNotFoundError } from "@/server/rentals/service";

function makeRental(db: Db, name = "Chalet Test") {
  return createRental(db, {
    name,
    propertyType: "chalet",
    description: "",
    street: "",
    city: "",
    zip: "",
    country: "",
    maxGuests: 4,
    bedrooms: 2,
    beds: 3,
    bathrooms: 1,
    checkInFrom: "16:00",
    checkInTo: "22:00",
    checkOutUntil: "10:00",
    minNights: 2,
    maxNights: 30,
  });
}

function booking(slug: string, overrides: Partial<DirectBookingInput> = {}): DirectBookingInput {
  return {
    slug,
    checkIn: "2099-07-10",
    checkOut: "2099-07-15",
    adults: 2,
    children: 0,
    firstName: "Grace",
    lastName: "Hopper",
    email: "grace@example.com",
    phone: "",
    ...overrides,
  };
}

describe("booking service", () => {
  let db: Db;
  let slug: string;
  let rentalId: string;

  beforeEach(() => {
    db = createTestDb();
    const rental = makeRental(db);
    slug = rental.slug;
    rentalId = rental.id;
    savePricing(db, rentalId, {
      baseEuros: 100,
      weekendEuros: "",
      cleaningFeeEuros: 40,
      cityTaxEuros: 2,
      weeklyDiscountPct: 0,
      monthlyDiscountPct: 0,
    });
  });

  describe("public listing", () => {
    it("lists active rentals with the cheapest nightly rate", () => {
      const list = listPublicRentals(db);
      expect(list).toHaveLength(1);
      expect(list[0].fromCents).toBe(100_00);
    });

    it("hides archived rentals everywhere", () => {
      archiveRental(db, rentalId);
      expect(listPublicRentals(db)).toHaveLength(0);
      expect(() => getPublicRental(db, slug)).toThrow(RentalNotFoundError);
    });
  });

  describe("checkStay", () => {
    it("quotes an available stay", () => {
      const rental = getPublicRental(db, slug);
      const result = checkStay(db, rental, "2099-07-10", "2099-07-15", 2);
      expect(result.available).toBe(true);
      // 5 nights × 100 + 40 cleaning + 2×2×5 tax
      expect(result.quote?.totalCents).toBe(500_00 + 40_00 + 20_00);
    });

    it("enforces stay rules with guest-readable reasons", () => {
      const rental = getPublicRental(db, slug);
      expect(
        checkStay(db, rental, "2099-07-10", "2099-07-11", 2).reasons[0],
      ).toMatch(/minimum stay/i);
      expect(
        checkStay(db, rental, "2099-07-01", "2099-08-15", 2).reasons[0],
      ).toMatch(/maximum stay/i);
      expect(
        checkStay(db, rental, "2099-07-10", "2099-07-15", 9).reasons[0],
      ).toMatch(/sleeps at most/i);
      expect(
        checkStay(db, rental, "2001-01-01", "2001-01-05", 2).reasons[0],
      ).toMatch(/past/i);
    });

    it("reports taken dates (reservation or block)", () => {
      const rental = getPublicRental(db, slug);
      createBlock(db, {
        rentalId,
        startDate: "2099-07-12",
        endDate: "2099-07-14",
        reason: "",
      });
      const result = checkStay(db, rental, "2099-07-10", "2099-07-15", 2);
      expect(result.available).toBe(false);
      expect(result.reasons[0]).toMatch(/no longer available/i);
    });
  });

  describe("bookDirect", () => {
    it("creates a confirmed, server-priced reservation with source=direct", () => {
      const result = bookDirect(db, booking(slug));
      expect(result.reservation.source).toBe("direct");
      expect(result.reservation.status).toBe("confirmed");
      expect(result.reservation.totalCents).toBe(560_00);
      expect(result.guest.email).toBe("grace@example.com");
    });

    it("rejects rule-violating or conflicting stays", () => {
      expect(() =>
        bookDirect(db, booking(slug, { checkOut: "2099-07-11" })),
      ).toThrow(StayNotBookableError);

      createReservation(db, {
        rentalId,
        checkIn: "2099-07-12",
        checkOut: "2099-07-14",
        adults: 2,
        children: 0,
        totalEuros: 0,
        notes: "",
        guest: {
          firstName: "Ada",
          lastName: "Lovelace",
          email: "ada@example.com",
          phone: "",
          language: "en",
          notes: "",
        },
      });
      expect(() => bookDirect(db, booking(slug))).toThrow(StayNotBookableError);
    });

    it("rejects unknown slugs and requires an email", () => {
      expect(() => bookDirect(db, booking("nope"))).toThrow(RentalNotFoundError);
      expect(() => bookDirect(db, booking(slug, { email: "not-an-email" }))).toThrow(
        /valid email/i,
      );
    });
  });
});
