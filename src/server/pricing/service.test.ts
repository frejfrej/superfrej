import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { createTestDb } from "@/db/test-utils";
import { createRental } from "@/server/rentals/service";
import {
  createSeason,
  deleteSeason,
  getPricing,
  quoteStay,
  savePricing,
  SeasonNotFoundError,
  SeasonOverlapError,
} from "./service";

function makeRental(db: Db) {
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
    minNights: 1,
    maxNights: 365,
  });
}

describe("pricing service", () => {
  let db: Db;
  let rentalId: string;

  beforeEach(() => {
    db = createTestDb();
    rentalId = makeRental(db).id;
  });

  it("returns defaults when never configured", () => {
    const pricing = getPricing(db, rentalId);
    expect(pricing.baseCents).toBe(100_00);
    expect(pricing.weekendCents).toBeNull();
    expect(pricing.currency).toBe("EUR");
  });

  it("saves and upserts pricing (euros → cents, blank weekend → null)", () => {
    savePricing(db, rentalId, {
      baseEuros: 120.5,
      weekendEuros: 150,
      cleaningFeeEuros: 60,
      cityTaxEuros: 1.5,
      weeklyDiscountPct: 10,
      monthlyDiscountPct: 20,
    });
    let pricing = getPricing(db, rentalId);
    expect(pricing.baseCents).toBe(12050);
    expect(pricing.weekendCents).toBe(15000);

    savePricing(db, rentalId, {
      baseEuros: 130,
      weekendEuros: "",
      cleaningFeeEuros: 60,
      cityTaxEuros: 1.5,
      weeklyDiscountPct: 0,
      monthlyDiscountPct: 0,
    });
    pricing = getPricing(db, rentalId);
    expect(pricing.baseCents).toBe(13000);
    expect(pricing.weekendCents).toBeNull();
  });

  it("rejects a zero nightly price", () => {
    expect(() =>
      savePricing(db, rentalId, {
        baseEuros: 0,
        weekendEuros: "",
        cleaningFeeEuros: 0,
        cityTaxEuros: 0,
        weeklyDiscountPct: 0,
        monthlyDiscountPct: 0,
      }),
    ).toThrow(/required/i);
  });

  it("creates seasons, rejects overlaps on the same rental only", () => {
    createSeason(db, {
      rentalId,
      name: "Hiver",
      startDate: "2099-12-15",
      endDate: "2100-01-05",
      nightlyEuros: 250,
      weekendEuros: "",
    });
    expect(() =>
      createSeason(db, {
        rentalId,
        name: "Noël",
        startDate: "2099-12-20",
        endDate: "2099-12-27",
        nightlyEuros: 300,
        weekendEuros: "",
      }),
    ).toThrow(SeasonOverlapError);

    const other = makeRental(db).id;
    expect(() =>
      createSeason(db, {
        rentalId: other,
        name: "Noël",
        startDate: "2099-12-20",
        endDate: "2099-12-27",
        nightlyEuros: 300,
        weekendEuros: "",
      }),
    ).not.toThrow();
  });

  it("allows back-to-back seasons and deletes them", () => {
    createSeason(db, {
      rentalId,
      name: "A",
      startDate: "2099-07-01",
      endDate: "2099-08-01",
      nightlyEuros: 200,
      weekendEuros: "",
    });
    const b = createSeason(db, {
      rentalId,
      name: "B",
      startDate: "2099-08-01",
      endDate: "2099-09-01",
      nightlyEuros: 180,
      weekendEuros: "",
    });
    deleteSeason(db, b.id);
    expect(() => deleteSeason(db, b.id)).toThrow(SeasonNotFoundError);
  });

  it("quoteStay feeds config + seasons into the engine", () => {
    savePricing(db, rentalId, {
      baseEuros: 100,
      weekendEuros: "",
      cleaningFeeEuros: 50,
      cityTaxEuros: 2,
      weeklyDiscountPct: 0,
      monthlyDiscountPct: 0,
    });
    createSeason(db, {
      rentalId,
      name: "Été",
      startDate: "2099-07-08",
      endDate: "2099-07-10",
      nightlyEuros: 200,
      weekendEuros: "",
    });
    // Mon 6 → Sat 11 July 2099: nights 6,7 (base) 8,9 (season) 10 (base)
    const q = quoteStay(db, rentalId, "2099-07-06", "2099-07-11", 2);
    expect(q.accommodationCents).toBe(3 * 100_00 + 2 * 200_00);
    expect(q.cityTaxCents).toBe(2_00 * 2 * 5);
    expect(q.totalCents).toBe(700_00 + 50_00 + 20_00);
  });
});
