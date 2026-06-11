import { describe, expect, it } from "vitest";
import {
  addMonths,
  dayOfMonth,
  daysInMonth,
  isIsoMonth,
  monthStart,
  nextMonthStart,
  weekdayIndex,
} from "./month";

describe("month helpers", () => {
  it("validates month strings", () => {
    expect(isIsoMonth("2026-06")).toBe(true);
    expect(isIsoMonth("2026-13")).toBe(false);
    expect(isIsoMonth("2026-6")).toBe(false);
  });

  it("computes month boundaries", () => {
    expect(monthStart("2026-06")).toBe("2026-06-01");
    expect(nextMonthStart("2026-06")).toBe("2026-07-01");
    expect(nextMonthStart("2026-12")).toBe("2027-01-01");
  });

  it("adds months across year boundaries in both directions", () => {
    expect(addMonths("2026-06", 1)).toBe("2026-07");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-01", -13)).toBe("2024-12");
  });

  it("knows month lengths including leap February", () => {
    expect(daysInMonth("2026-06")).toBe(30);
    expect(daysInMonth("2026-02")).toBe(28);
    expect(daysInMonth("2024-02")).toBe(29);
  });

  it("computes Monday-based weekdays", () => {
    expect(weekdayIndex("2026-06", 1)).toBe(0); // 1 June 2026 is a Monday
    expect(weekdayIndex("2026-06", 7)).toBe(6); // Sunday
  });

  it("extracts day of month", () => {
    expect(dayOfMonth("2026-06-09")).toBe(9);
  });
});
