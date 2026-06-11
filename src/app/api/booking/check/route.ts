import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { isIsoDate } from "@/lib/dates";
import { checkStay, getPublicRental } from "@/server/booking/service";
import { RentalNotFoundError } from "@/server/rentals/service";

const querySchema = z.object({
  slug: z.string().min(1),
  checkIn: z.string().refine(isIsoDate),
  checkOut: z.string().refine(isIsoDate),
  guests: z.coerce.number().int().min(1).max(200),
});

/** Public availability + price check for the booking widget. */
export function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const { slug, checkIn, checkOut, guests } = parsed.data;
  try {
    const db = getDb();
    const rental = getPublicRental(db, slug);
    return NextResponse.json(checkStay(db, rental, checkIn, checkOut, guests));
  } catch (e) {
    if (e instanceof RentalNotFoundError) {
      return NextResponse.json({ error: "Unknown rental" }, { status: 404 });
    }
    throw e;
  }
}
