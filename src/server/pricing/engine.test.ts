import { describe, expect, it } from "vitest";
import { computeQuote, type PricingConfig } from "./engine";

const base: PricingConfig = {
  baseCents: 100_00,
  weekendCents: null,
  cleaningFeeCents: 0,
  cityTaxCents: 0,
  weeklyDiscountPct: 0,
  monthlyDiscountPct: 0,
  currency: "EUR",
  seasons: [],
};

// 2099-07-06 is a Monday.
const MON = "2099-07-06";

describe("computeQuote", () => {
  it("prices a simple stay at base rate", () => {
    const q = computeQuote(base, MON, "2099-07-09", 2); // Mon,Tue,Wed nights
    expect(q.nights).toHaveLength(3);
    expect(q.accommodationCents).toBe(300_00);
    expect(q.totalCents).toBe(300_00);
    expect(q.nights.every((n) => !n.weekend && n.season === null)).toBe(true);
  });

  it("applies weekend price on Friday and Saturday nights only", () => {
    const q = computeQuote(
      { ...base, weekendCents: 150_00 },
      MON,
      "2099-07-13", // a full week: Mon..Sun nights
      2,
    );
    const weekendNights = q.nights.filter((n) => n.weekend);
    expect(weekendNights.map((n) => n.date)).toEqual(["2099-07-10", "2099-07-11"]); // Fri, Sat
    expect(q.accommodationCents).toBe(5 * 100_00 + 2 * 150_00);
  });

  it("falls back to base price on weekends when weekendCents is null", () => {
    const q = computeQuote(base, "2099-07-10", "2099-07-12", 2); // Fri+Sat nights
    expect(q.accommodationCents).toBe(200_00);
    expect(q.nights.every((n) => n.weekend)).toBe(true);
  });

  it("applies a season over its [start, end) range, base outside it", () => {
    const q = computeQuote(
      {
        ...base,
        seasons: [
          {
            name: "High season",
            startDate: "2099-07-08",
            endDate: "2099-07-10",
            nightlyCents: 200_00,
            weekendCents: null,
          },
        ],
      },
      MON,
      "2099-07-11",
      2,
    );
    // Nights: 6,7 base — 8,9 season — 10 base (end exclusive)
    expect(q.nights.map((n) => n.cents)).toEqual([
      100_00, 100_00, 200_00, 200_00, 100_00,
    ]);
    expect(q.nights[2].season).toBe("High season");
  });

  it("uses season weekend price when set, season nightly otherwise", () => {
    const season = {
      name: "Été",
      startDate: "2099-07-01",
      endDate: "2099-08-01",
      nightlyCents: 200_00,
      weekendCents: 260_00,
    };
    const q = computeQuote(
      { ...base, weekendCents: 150_00, seasons: [season] },
      "2099-07-10", // Friday
      "2099-07-12",
      2,
    );
    expect(q.nights.map((n) => n.cents)).toEqual([260_00, 260_00]);

    const noWeekend = computeQuote(
      { ...base, seasons: [{ ...season, weekendCents: null }] },
      "2099-07-10",
      "2099-07-12",
      2,
    );
    expect(noWeekend.nights.map((n) => n.cents)).toEqual([200_00, 200_00]);
  });

  it("applies weekly discount at 7+ nights, to accommodation only", () => {
    const q = computeQuote(
      { ...base, weeklyDiscountPct: 10, cleaningFeeCents: 50_00, cityTaxCents: 2_00 },
      MON,
      "2099-07-13",
      2,
    );
    expect(q.discountLabel).toBe("weekly");
    expect(q.discountCents).toBe(70_00); // 10% of 700
    expect(q.cityTaxCents).toBe(2_00 * 2 * 7);
    expect(q.totalCents).toBe(700_00 - 70_00 + 50_00 + 28_00);
  });

  it("monthly discount wins over weekly at 28+ nights", () => {
    const q = computeQuote(
      { ...base, weeklyDiscountPct: 10, monthlyDiscountPct: 25 },
      MON,
      "2099-08-03", // 28 nights
      1,
    );
    expect(q.discountLabel).toBe("monthly");
    expect(q.discountPct).toBe(25);
  });

  it("no discount under 7 nights", () => {
    const q = computeQuote({ ...base, weeklyDiscountPct: 10 }, MON, "2099-07-12", 1);
    expect(q.discountLabel).toBeNull();
    expect(q.discountCents).toBe(0);
  });

  it("city tax scales with guests and nights", () => {
    const q = computeQuote({ ...base, cityTaxCents: 1_50 }, MON, "2099-07-09", 4);
    expect(q.cityTaxCents).toBe(1_50 * 4 * 3);
  });

  it("rejects nonsense input", () => {
    expect(() => computeQuote(base, MON, MON, 2)).toThrow();
    expect(() => computeQuote(base, MON, "2099-07-09", 0)).toThrow();
  });
});
