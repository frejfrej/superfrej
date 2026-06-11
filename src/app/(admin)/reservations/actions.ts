"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db/client";
import { DatesUnavailableError } from "@/server/availability/service";
import {
  cancelReservation,
  CapacityError,
  createReservation,
  OverlapError,
  restoreReservation,
  updateReservation,
} from "@/server/reservations/service";
import {
  reservationFieldErrors,
  reservationInputSchema,
} from "@/server/reservations/validation";

export type ReservationFormState = {
  errors: Record<string, string>;
  /** Set when saved but worth a heads-up (e.g. below min nights). */
  warnings?: string[];
  savedId?: string;
};

function formToInput(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return {
    ...raw,
    guest: {
      firstName: raw["guest.firstName"],
      lastName: raw["guest.lastName"],
      email: raw["guest.email"],
      phone: raw["guest.phone"],
      language: raw["guest.language"],
      notes: "",
    },
  };
}

export async function saveReservationAction(
  reservationId: string | null,
  _prev: ReservationFormState,
  formData: FormData,
): Promise<ReservationFormState> {
  const parsed = reservationInputSchema.safeParse(formToInput(formData));
  if (!parsed.success) {
    return { errors: reservationFieldErrors(parsed.error) };
  }

  let warnings: string[] = [];
  let savedId: string;
  try {
    const db = getDb();
    const result = reservationId
      ? updateReservation(db, reservationId, parsed.data)
      : createReservation(db, parsed.data);
    warnings = result.warnings;
    savedId = result.reservation.id;
  } catch (e) {
    if (e instanceof OverlapError || e instanceof DatesUnavailableError) {
      return { errors: { checkIn: e.message } };
    }
    if (e instanceof CapacityError) {
      return { errors: { adults: e.message } };
    }
    if (e instanceof z.ZodError) {
      return { errors: reservationFieldErrors(e) };
    }
    return { errors: { _form: "Could not save the reservation. Please retry." } };
  }

  revalidatePath("/reservations");
  if (warnings.length > 0) {
    // Stay on the form so the host actually sees the advisory.
    return { errors: {}, warnings, savedId };
  }
  redirect(`/reservations/${savedId}`);
}

export async function setReservationStatusAction(
  reservationId: string,
  status: "confirmed" | "cancelled",
): Promise<{ error?: string }> {
  z.enum(["confirmed", "cancelled"]).parse(status);
  try {
    const db = getDb();
    if (status === "cancelled") {
      cancelReservation(db, reservationId);
    } else {
      restoreReservation(db, reservationId);
    }
  } catch (e) {
    if (e instanceof OverlapError || e instanceof DatesUnavailableError) {
      return { error: e.message };
    }
    throw e;
  }
  revalidatePath("/reservations");
  revalidatePath(`/reservations/${reservationId}`);
  return {};
}
