import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { isIsoDate } from "@/lib/dates";
import { quoteStay } from "@/server/pricing/service";
import { RentalNotFoundError } from "@/server/rentals/service";

const querySchema = z.object({
  rentalId: z.string().min(1),
  checkIn: z.string().refine(isIsoDate),
  checkOut: z.string().refine(isIsoDate),
  guests: z.coerce.number().int().min(1).max(200),
});

/** GET /api/quote?rentalId=…&checkIn=…&checkOut=…&guests=… → Quote JSON.
 * Same engine the booking site and channel sync will use. */
export function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const { rentalId, checkIn, checkOut, guests } = parsed.data;
  if (checkOut <= checkIn) {
    return NextResponse.json({ error: "checkOut must be after checkIn" }, { status: 400 });
  }
  try {
    return NextResponse.json(quoteStay(getDb(), rentalId, checkIn, checkOut, guests));
  } catch (e) {
    if (e instanceof RentalNotFoundError) {
      return NextResponse.json({ error: "Unknown rental" }, { status: 404 });
    }
    throw e;
  }
}
