"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  archiveRental,
  createRental,
  restoreRental,
  updateRental,
} from "@/server/rentals/service";
import {
  fieldErrors,
  rentalInputSchema,
} from "@/server/rentals/validation";

export type RentalFormState = {
  errors: Record<string, string>;
};

export async function saveRentalAction(
  rentalId: string | null,
  _prev: RentalFormState,
  formData: FormData,
): Promise<RentalFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = rentalInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  try {
    const db = getDb();
    if (rentalId) {
      updateRental(db, rentalId, parsed.data);
    } else {
      createRental(db, parsed.data);
    }
  } catch (e) {
    // Service re-validates; surface anything unexpected as a form-level error.
    if (e instanceof z.ZodError) return { errors: fieldErrors(e) };
    return { errors: { _form: "Could not save the rental. Please retry." } };
  }

  revalidatePath("/rentals");
  redirect("/rentals");
}

export async function setRentalStatusAction(
  rentalId: string,
  status: "active" | "archived",
): Promise<void> {
  // Server actions are public HTTP endpoints — never trust compile-time types.
  z.enum(["active", "archived"]).parse(status);
  const db = getDb();
  if (status === "archived") {
    archiveRental(db, rentalId);
  } else {
    restoreRental(db, rentalId);
  }
  revalidatePath("/rentals");
  revalidatePath(`/rentals/${rentalId}`);
}
