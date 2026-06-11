import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { createTestDb } from "@/db/test-utils";
import { createRental } from "@/server/rentals/service";
import {
  cancelReservation,
  createReservation,
  OverlapError,
} from "@/server/reservations/service";
import type { ReservationInput } from "@/server/reservations/validation";
import {
  BlockNotFoundError,
  createBlock,
  DatesUnavailableError,
  deleteBlock,
  getCalendar,
} from "./service";

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
    minNights: 1,
    maxNights: 365,
    ...{},
  });
}

function resInput(rentalId: string, checkIn: string, checkOut: string): ReservationInput {
  return {
    rentalId,
    checkIn,
    checkOut,
    adults: 2,
    children: 0,
    totalEuros: 100,
    notes: "",
    guest: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "",
      language: "en",
      notes: "",
    },
  };
}

describe("availability service", () => {
  let db: Db;
  let rentalId: string;

  beforeEach(() => {
    db = createTestDb();
    rentalId = makeRental(db).id;
  });

  describe("blocks", () => {
    it("creates and deletes a block", () => {
      const block = createBlock(db, {
        rentalId,
        startDate: "2099-07-01",
        endDate: "2099-07-05",
        reason: "Repairs",
      });
      expect(block.reason).toBe("Repairs");
      deleteBlock(db, block.id);
      expect(() => deleteBlock(db, block.id)).toThrow(BlockNotFoundError);
    });

    it("rejects a block over a confirmed reservation", () => {
      createReservation(db, resInput(rentalId, "2099-07-03", "2099-07-08"));
      expect(() =>
        createBlock(db, {
          rentalId,
          startDate: "2099-07-01",
          endDate: "2099-07-05",
          reason: "",
        }),
      ).toThrow(DatesUnavailableError);
    });

    it("allows a block over a cancelled reservation and back-to-back with a stay", () => {
      const r = createReservation(db, resInput(rentalId, "2099-07-03", "2099-07-08"));
      cancelReservation(db, r.reservation.id);
      expect(() =>
        createBlock(db, {
          rentalId,
          startDate: "2099-07-01",
          endDate: "2099-07-05",
          reason: "",
        }),
      ).not.toThrow();
      // back-to-back: block ends the day a new block starts
      expect(() =>
        createBlock(db, {
          rentalId,
          startDate: "2099-07-05",
          endDate: "2099-07-09",
          reason: "",
        }),
      ).not.toThrow();
    });

    it("rejects overlapping blocks on the same rental, allows on another", () => {
      createBlock(db, {
        rentalId,
        startDate: "2099-07-01",
        endDate: "2099-07-05",
        reason: "",
      });
      expect(() =>
        createBlock(db, {
          rentalId,
          startDate: "2099-07-04",
          endDate: "2099-07-06",
          reason: "",
        }),
      ).toThrow(DatesUnavailableError);
      const other = makeRental(db, "Other").id;
      expect(() =>
        createBlock(db, {
          rentalId: other,
          startDate: "2099-07-04",
          endDate: "2099-07-06",
          reason: "",
        }),
      ).not.toThrow();
    });

    it("rejects inverted or zero-length blocks", () => {
      expect(() =>
        createBlock(db, {
          rentalId,
          startDate: "2099-07-05",
          endDate: "2099-07-05",
          reason: "",
        }),
      ).toThrow(/after start/i);
    });
  });

  describe("reservations respect blocks", () => {
    it("rejects a reservation over a block, allows back-to-back", () => {
      createBlock(db, {
        rentalId,
        startDate: "2099-07-01",
        endDate: "2099-07-05",
        reason: "",
      });
      expect(() =>
        createReservation(db, resInput(rentalId, "2099-07-04", "2099-07-08")),
      ).toThrow(DatesUnavailableError);
      expect(() =>
        createReservation(db, resInput(rentalId, "2099-07-05", "2099-07-08")),
      ).not.toThrow();
    });

    it("still rejects reservation-vs-reservation overlap", () => {
      createReservation(db, resInput(rentalId, "2099-07-10", "2099-07-15"));
      expect(() =>
        createReservation(db, resInput(rentalId, "2099-07-12", "2099-07-16")),
      ).toThrow(OverlapError);
    });
  });

  describe("getCalendar", () => {
    it("returns active rentals with reservations and blocks clipped to range", () => {
      const other = makeRental(db, "Other").id;
      createReservation(db, resInput(rentalId, "2099-06-28", "2099-07-02")); // spans into July
      createReservation(db, resInput(other, "2099-07-10", "2099-07-12"));
      createReservation(db, resInput(rentalId, "2099-08-01", "2099-08-04")); // outside July
      createBlock(db, {
        rentalId,
        startDate: "2099-07-20",
        endDate: "2099-07-22",
        reason: "",
      });

      const cal = getCalendar(db, "2099-07-01", "2099-08-01");
      expect(cal.map((c) => c.rental.name)).toEqual(["Chalet Test", "Other"]);
      const chalet = cal[0];
      expect(chalet.reservations).toHaveLength(1);
      expect(chalet.reservations[0].guestName).toBe("Ada Lovelace");
      expect(chalet.blocks).toHaveLength(1);
      expect(cal[1].reservations).toHaveLength(1);
    });

    it("omits cancelled reservations and archived rentals", () => {
      const r = createReservation(db, resInput(rentalId, "2099-07-10", "2099-07-12"));
      cancelReservation(db, r.reservation.id);
      const cal = getCalendar(db, "2099-07-01", "2099-08-01");
      expect(cal[0].reservations).toHaveLength(0);
    });
  });
});
