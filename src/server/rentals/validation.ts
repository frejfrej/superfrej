import { z } from "zod";
import { PROPERTY_TYPES } from "@/db/schema";

/**
 * Rental input validation — shared by server actions and unit tests.
 * Kept free of db imports so client components may import it too.
 */

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const time = (label: string) =>
  z
    .string()
    .regex(TIME_RE, `${label} must be a time like 14:00`);

export const rentalInputSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    propertyType: z.enum(PROPERTY_TYPES),
    description: z.string().trim().max(10_000).default(""),
    street: z.string().trim().max(200).default(""),
    city: z.string().trim().max(100).default(""),
    zip: z.string().trim().max(20).default(""),
    country: z.string().trim().max(100).default(""),
    maxGuests: z.coerce.number().int().min(1, "At least 1 guest").max(100),
    bedrooms: z.coerce.number().int().min(0).max(50),
    beds: z.coerce.number().int().min(0).max(100),
    bathrooms: z.coerce.number().int().min(0).max(50),
    checkInFrom: time("Check-in from"),
    checkInTo: time("Check-in until"),
    checkOutUntil: time("Check-out until"),
    minNights: z.coerce.number().int().min(1).max(365),
    maxNights: z.coerce.number().int().min(1).max(3650),
  })
  .refine((v) => v.maxNights >= v.minNights, {
    message: "Max nights must be at least min nights",
    path: ["maxNights"],
  })
  .refine((v) => v.checkInTo >= v.checkInFrom, {
    message: "Check-in window must end after it starts",
    path: ["checkInTo"],
  });

export type RentalInput = z.infer<typeof rentalInputSchema>;

/** Flatten a zod error into { field: firstMessage } for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    out[key] ??= issue.message;
  }
  return out;
}
