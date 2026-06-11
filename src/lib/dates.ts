/** Calendar-date helpers. Dates are ISO "YYYY-MM-DD" strings throughout the
 * app — no Date objects for stay dates, so timezones can never shift a night. */

const ISO_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_RE.test(value)) return false;
  // Reject impossible dates like 2026-02-30 (Date.UTC rolls them over).
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Nights between two ISO dates (checkOut - checkIn). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** Today's ISO date in the given IANA timezone (defaults to the host's). */
export function todayIso(timeZone?: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatStayDates(checkIn: string, checkOut: string): string {
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(checkIn)} → ${fmt(checkOut)}`;
}
