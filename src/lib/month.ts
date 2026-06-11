/** Month helpers for the calendar grid. A month is "YYYY-MM". */

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isIsoMonth(value: string): boolean {
  return MONTH_RE.test(value);
}

export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/** First day of the month, ISO date. */
export function monthStart(month: string): string {
  return `${month}-01`;
}

/** First day of the following month, ISO date — [start, nextStart) covers
 * the whole month. */
export function nextMonthStart(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 12
    ? `${y + 1}-01-01`
    : `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12 + 12) % 12 + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 1-based day of month for an ISO date. */
export function dayOfMonth(isoDate: string): number {
  return Number(isoDate.slice(8, 10));
}

/** 0 = Monday … 6 = Sunday (European calendar). */
export function weekdayIndex(month: string, day: number): number {
  const [y, m] = month.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, day)).getUTCDay() + 6) % 7;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** ISO date for a 1-based day of the month. */
export function dateOf(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, "0")}`;
}
