import { describe, expect, it } from "vitest";
import { isIsoDate, nightsBetween } from "./dates";

describe("isIsoDate", () => {
  it("accepts real calendar dates", () => {
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2024-02-29")).toBe(true); // leap year
    expect(isIsoDate("2026-12-31")).toBe(true);
  });

  it("rejects malformed and impossible dates", () => {
    expect(isIsoDate("2026-2-28")).toBe(false);
    expect(isIsoDate("28/02/2026")).toBe(false);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("2025-02-29")).toBe(false); // not a leap year
    expect(isIsoDate("")).toBe(false);
  });
});

describe("nightsBetween", () => {
  it("counts nights, not days", () => {
    expect(nightsBetween("2026-07-10", "2026-07-15")).toBe(5);
    expect(nightsBetween("2026-07-10", "2026-07-11")).toBe(1);
  });

  it("crosses months, years and DST boundaries", () => {
    expect(nightsBetween("2026-01-31", "2026-02-02")).toBe(2);
    expect(nightsBetween("2025-12-30", "2026-01-02")).toBe(3);
    expect(nightsBetween("2026-03-28", "2026-03-30")).toBe(2); // EU DST switch
  });
});
