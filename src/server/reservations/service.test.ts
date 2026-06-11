import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { createTestDb } from "@/db/test-utils";
import { createRental } from "@/server/rentals/service";
import { listGuests } from "@/server/guests/service";
import {
  cancelReservation,
  CapacityError,
  createReservation,
  displayStatus,
  listReservations,
  OverlapError,
  restoreReservation,
  updateReservation,
} from "./service";
import type { ReservationInput } from "./validation";

function makeRental(db: Db, overrides: Partial<Parameters<typeof createRental>[1]> = {}) {
  return createRental(db, {
    name: "Chalet Test",
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
    ...overrides,
  });
}

function input(rentalId: string, overrides: Partial<ReservationInput> = {}): ReservationInput {
  return {
    rentalId,
    checkIn: "2099-07-10",
    checkOut: "2099-07-15",
    adults: 2,
    children: 0,
    totalEuros: 750,
    notes: "",
    guest: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "",
      language: "en",
      notes: "",
    },
    ...overrides,
  };
}

describe("reservations service", () => {
  let db: Db;
  let rentalId: string;

  beforeEach(() => {
    db = createTestDb();
    rentalId = makeRental(db).id;
  });

  describe("createReservation", () => {
    it("creates a confirmed reservation, stores cents, creates the guest", () => {
      const result = createReservation(db, input(rentalId));
      expect(result.reservation.status).toBe("confirmed");
      expect(result.reservation.totalCents).toBe(75_000);
      expect(result.guest.email).toBe("ada@example.com");
      expect(result.warnings).toEqual([]);
    });

    it("reuses a guest with the same email (case-insensitive)", () => {
      createReservation(db, input(rentalId));
      createReservation(
        db,
        input(rentalId, {
          checkIn: "2099-08-01",
          checkOut: "2099-08-05",
          guest: {
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ADA@example.com",
            phone: "+44 1",
            language: "en",
            notes: "",
          },
        }),
      );
      expect(listGuests(db)).toHaveLength(1);
      expect(listGuests(db)[0].phone).toBe("+44 1");
    });

    it("rejects overlapping confirmed stays on the same rental", () => {
      createReservation(db, input(rentalId));
      expect(() =>
        createReservation(
          db,
          input(rentalId, { checkIn: "2099-07-14", checkOut: "2099-07-20" }),
        ),
      ).toThrow(OverlapError);
    });

    it("allows back-to-back stays (checkout day = next check-in day)", () => {
      createReservation(db, input(rentalId));
      expect(() =>
        createReservation(
          db,
          input(rentalId, { checkIn: "2099-07-15", checkOut: "2099-07-18" }),
        ),
      ).not.toThrow();
    });

    it("allows the same dates on a different rental", () => {
      const other = makeRental(db, { name: "Other" }).id;
      createReservation(db, input(rentalId));
      expect(() => createReservation(db, input(other))).not.toThrow();
    });

    it("ignores cancelled reservations when checking overlap", () => {
      const { reservation } = createReservation(db, input(rentalId));
      cancelReservation(db, reservation.id);
      expect(() => createReservation(db, input(rentalId))).not.toThrow();
    });

    it("rejects more guests than the rental sleeps", () => {
      expect(() =>
        createReservation(db, input(rentalId, { adults: 3, children: 2 })),
      ).toThrow(CapacityError);
    });

    it("rejects check-out on or before check-in", () => {
      expect(() =>
        createReservation(
          db,
          input(rentalId, { checkIn: "2099-07-10", checkOut: "2099-07-10" }),
        ),
      ).toThrow(/check-out/i);
    });

    it("rejects impossible calendar dates", () => {
      expect(() =>
        createReservation(db, input(rentalId, { checkIn: "2099-02-30" })),
      ).toThrow(/date like/i);
    });

    it("warns (without blocking) when the stay violates min/max nights", () => {
      const short = createReservation(
        db,
        input(rentalId, { checkIn: "2099-07-10", checkOut: "2099-07-11" }),
      );
      expect(short.warnings).toHaveLength(1);
      expect(short.warnings[0]).toMatch(/below this rental's minimum/);

      const long = createReservation(
        db,
        input(rentalId, { checkIn: "2099-09-01", checkOut: "2099-10-15" }),
      );
      expect(long.warnings[0]).toMatch(/above this rental's maximum/);
    });
  });

  describe("updateReservation", () => {
    it("moves dates when free, rejects when occupied", () => {
      const a = createReservation(db, input(rentalId));
      createReservation(
        db,
        input(rentalId, { checkIn: "2099-07-20", checkOut: "2099-07-25" }),
      );
      const moved = updateReservation(db, a.reservation.id, {
        ...input(rentalId),
        checkIn: "2099-07-16",
        checkOut: "2099-07-19",
      });
      expect(moved.reservation.checkIn).toBe("2099-07-16");
      expect(() =>
        updateReservation(db, a.reservation.id, {
          ...input(rentalId),
          checkIn: "2099-07-21",
          checkOut: "2099-07-24",
        }),
      ).toThrow(OverlapError);
    });

    it("does not conflict with itself", () => {
      const a = createReservation(db, input(rentalId));
      expect(() =>
        updateReservation(db, a.reservation.id, input(rentalId, { adults: 1 })),
      ).not.toThrow();
    });
  });

  describe("cancel / restore", () => {
    it("cancel frees the dates; restore re-checks them", () => {
      const a = createReservation(db, input(rentalId));
      cancelReservation(db, a.reservation.id);
      createReservation(db, input(rentalId)); // same dates, now free
      expect(() => restoreReservation(db, a.reservation.id)).toThrow(OverlapError);
    });

    it("restore succeeds when dates are still free", () => {
      const a = createReservation(db, input(rentalId));
      cancelReservation(db, a.reservation.id);
      expect(restoreReservation(db, a.reservation.id).status).toBe("confirmed");
    });
  });

  describe("displayStatus", () => {
    it("derives completed from past check-out", () => {
      expect(
        displayStatus({ status: "confirmed", checkOut: "2001-01-05" }, "2026-01-01"),
      ).toBe("completed");
      expect(
        displayStatus({ status: "confirmed", checkOut: "2099-01-05" }, "2026-01-01"),
      ).toBe("confirmed");
      expect(
        displayStatus({ status: "cancelled", checkOut: "2001-01-05" }, "2026-01-01"),
      ).toBe("cancelled");
    });
  });

  describe("listReservations", () => {
    it("splits tabs and searches guest and rental names", () => {
      createReservation(db, input(rentalId)); // upcoming
      const old = createReservation(
        db,
        input(rentalId, { checkIn: "2020-01-01", checkOut: "2020-01-05" }),
      );
      const gone = createReservation(
        db,
        input(rentalId, { checkIn: "2099-12-01", checkOut: "2099-12-05" }),
      );
      cancelReservation(db, gone.reservation.id);

      expect(listReservations(db, { tab: "upcoming" })).toHaveLength(1);
      expect(listReservations(db, { tab: "past" })).toHaveLength(1);
      expect(listReservations(db, { tab: "cancelled" })).toHaveLength(1);
      expect(listReservations(db, { tab: "all" })).toHaveLength(3);
      expect(listReservations(db, { tab: "all", q: "lovelace" })).toHaveLength(3);
      expect(listReservations(db, { tab: "all", q: "chalet" })).toHaveLength(3);
      expect(listReservations(db, { tab: "all", q: "zzz" })).toHaveLength(0);
      expect(old.reservation.id).toBeTruthy();
    });
  });
});
