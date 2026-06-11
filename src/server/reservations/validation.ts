import { z } from "zod";
import { isIsoDate } from "@/lib/dates";
import { guestInputSchema } from "@/server/guests/service";

const isoDate = (label: string) =>
  z
    .string()
    .refine(isIsoDate, `${label} must be a date like 2026-07-14`);

export const reservationInputSchema = z
  .object({
    rentalId: z.string().min(1, "Pick a rental"),
    checkIn: isoDate("Check-in"),
    checkOut: isoDate("Check-out"),
    adults: z.coerce.number().int().min(1, "At least 1 adult").max(100),
    children: z.coerce.number().int().min(0).max(100),
    /** Total price in euros as typed in the form; converted to cents. */
    totalEuros: z.coerce.number().min(0).max(1_000_000).default(0),
    notes: z.string().trim().max(10_000).default(""),
    guest: guestInputSchema,
  })
  .refine((v) => v.checkOut > v.checkIn, {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });

export type ReservationInput = z.infer<typeof reservationInputSchema>;

/** Flatten a zod error into { "guest.email": message } style keys. */
export function reservationFieldErrors(
  error: z.ZodError,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    out[key] ??= issue.message;
  }
  return out;
}
