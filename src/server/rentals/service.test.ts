import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { createTestDb } from "@/db/test-utils";
import {
  archiveRental,
  createRental,
  getRental,
  listRentals,
  RentalNotFoundError,
  restoreRental,
  updateRental,
} from "./service";
import type { RentalInput } from "./validation";

const valid: RentalInput = {
  name: "Cosy Chalet",
  propertyType: "chalet",
  description: "",
  street: "1 rue des Alpes",
  city: "Bourg-Saint-Maurice",
  zip: "73700",
  country: "France",
  maxGuests: 4,
  bedrooms: 2,
  beds: 3,
  bathrooms: 1,
  checkInFrom: "16:00",
  checkInTo: "22:00",
  checkOutUntil: "10:00",
  minNights: 2,
  maxNights: 365,
};

describe("rentals service", () => {
  let db: Db;

  beforeEach(() => {
    db = createTestDb();
  });

  describe("createRental", () => {
    it("creates an active rental with a slug derived from the name", () => {
      const rental = createRental(db, valid);
      expect(rental.status).toBe("active");
      expect(rental.slug).toBe("cosy-chalet");
      expect(rental.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(getRental(db, rental.id).name).toBe("Cosy Chalet");
    });

    it("de-duplicates slugs with numeric suffixes", () => {
      expect(createRental(db, valid).slug).toBe("cosy-chalet");
      expect(createRental(db, valid).slug).toBe("cosy-chalet-2");
      expect(createRental(db, valid).slug).toBe("cosy-chalet-3");
    });

    it("strips diacritics in slugs", () => {
      const rental = createRental(db, { ...valid, name: "Chalet Ensoleillé" });
      expect(rental.slug).toBe("chalet-ensoleille");
    });

    it("rejects an empty name", () => {
      expect(() => createRental(db, { ...valid, name: "  " })).toThrow();
    });

    it("rejects maxNights below minNights", () => {
      expect(() =>
        createRental(db, { ...valid, minNights: 7, maxNights: 3 }),
      ).toThrow(/max nights/i);
    });

    it("rejects an inverted check-in window", () => {
      expect(() =>
        createRental(db, { ...valid, checkInFrom: "22:00", checkInTo: "16:00" }),
      ).toThrow(/check-in window/i);
    });

    it("rejects malformed times", () => {
      expect(() =>
        createRental(db, { ...valid, checkOutUntil: "25:99" }),
      ).toThrow(/time like/i);
    });
  });

  describe("listRentals", () => {
    it("returns rentals sorted by name and supports search on name and city", () => {
      createRental(db, { ...valid, name: "Zen Loft", city: "Paris" });
      createRental(db, { ...valid, name: "Alp Chalet" });
      expect(listRentals(db).map((r) => r.name)).toEqual([
        "Alp Chalet",
        "Zen Loft",
      ]);
      expect(listRentals(db, { q: "zen" })).toHaveLength(1);
      expect(listRentals(db, { q: "PARIS" })).toHaveLength(1);
      expect(listRentals(db, { q: "nowhere" })).toHaveLength(0);
    });

    it("filters by status", () => {
      const a = createRental(db, { ...valid, name: "A" });
      createRental(db, { ...valid, name: "B" });
      archiveRental(db, a.id);
      expect(listRentals(db, { status: "active" }).map((r) => r.name)).toEqual([
        "B",
      ]);
      expect(
        listRentals(db, { status: "archived" }).map((r) => r.name),
      ).toEqual(["A"]);
      expect(listRentals(db)).toHaveLength(2);
    });
  });

  describe("updateRental", () => {
    it("updates fields and keeps the slug when the name is unchanged", () => {
      const rental = createRental(db, valid);
      const updated = updateRental(db, rental.id, { ...valid, maxGuests: 6 });
      expect(updated.maxGuests).toBe(6);
      expect(updated.slug).toBe("cosy-chalet");
    });

    it("refreshes the slug when renamed, without colliding", () => {
      createRental(db, { ...valid, name: "Taken Name" });
      const rental = createRental(db, valid);
      const renamed = updateRental(db, rental.id, {
        ...valid,
        name: "Taken Name",
      });
      expect(renamed.slug).toBe("taken-name-2");
    });

    it("keeps its own slug when renaming to the same name casing variant", () => {
      const rental = createRental(db, valid);
      const updated = updateRental(db, rental.id, {
        ...valid,
        name: "COSY chalet",
      });
      expect(updated.slug).toBe("cosy-chalet");
    });

    it("throws on unknown id", () => {
      expect(() => updateRental(db, "missing", valid)).toThrow(
        RentalNotFoundError,
      );
    });
  });

  describe("archive / restore", () => {
    it("round-trips status", () => {
      const rental = createRental(db, valid);
      expect(archiveRental(db, rental.id).status).toBe("archived");
      expect(restoreRental(db, rental.id).status).toBe("active");
    });

    it("throws on unknown id", () => {
      expect(() => archiveRental(db, "nope")).toThrow(RentalNotFoundError);
    });
  });
});
