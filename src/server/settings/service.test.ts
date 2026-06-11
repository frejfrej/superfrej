import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { createTestDb } from "@/db/test-utils";
import { getSetting, setSetting } from "./service";

describe("settings service", () => {
  let db: Db;

  beforeEach(() => {
    db = createTestDb();
  });

  it("returns null for a setting that was never written", () => {
    expect(getSetting(db, "workspace")).toBeNull();
  });

  it("round-trips a setting", () => {
    setSetting(db, "workspace", {
      name: "Chalet Frej",
      currency: "EUR",
      timezone: "Europe/Paris",
    });
    expect(getSetting(db, "workspace")).toEqual({
      name: "Chalet Frej",
      currency: "EUR",
      timezone: "Europe/Paris",
    });
  });

  it("overwrites on second write instead of duplicating", () => {
    setSetting(db, "workspace", {
      name: "First",
      currency: "EUR",
      timezone: "Europe/Paris",
    });
    setSetting(db, "workspace", {
      name: "Second",
      currency: "USD",
      timezone: "America/New_York",
    });
    expect(getSetting(db, "workspace")?.name).toBe("Second");
    expect(getSetting(db, "workspace")?.currency).toBe("USD");
  });

  it("rejects invalid values at write time", () => {
    expect(() =>
      setSetting(db, "workspace", {
        name: "",
        currency: "EUR",
        timezone: "Europe/Paris",
      }),
    ).toThrow();
  });
});
