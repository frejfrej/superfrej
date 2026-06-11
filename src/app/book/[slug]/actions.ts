"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  bookDirect,
  directBookingSchema,
  StayNotBookableError,
} from "@/server/booking/service";
import { RentalNotFoundError } from "@/server/rentals/service";

export type BookingFormState = { errors: Record<string, string> };

export async function bookDirectAction(
  slug: string,
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const parsed = directBookingSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    slug,
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".") || "_form"] ??= issue.message;
    }
    return { errors };
  }

  let reservationId: string;
  try {
    reservationId = bookDirect(getDb(), parsed.data).reservation.id;
  } catch (e) {
    if (e instanceof StayNotBookableError) {
      return { errors: { _form: e.reasons.join(" ") } };
    }
    if (e instanceof RentalNotFoundError) {
      return { errors: { _form: "This place is no longer available." } };
    }
    if (e instanceof z.ZodError) {
      return { errors: { _form: "Please check your details." } };
    }
    return { errors: { _form: "Something went wrong — please try again." } };
  }
  redirect(`/book/${slug}/confirmed/${reservationId}`);
}
