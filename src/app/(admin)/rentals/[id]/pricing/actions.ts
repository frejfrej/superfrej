"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  createSeason,
  deleteSeason,
  pricingInputSchema,
  savePricing,
  seasonInputSchema,
  SeasonOverlapError,
} from "@/server/pricing/service";

export type PricingFormState = { errors: Record<string, string>; saved?: boolean };

function flatten(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    out[issue.path.join(".") || "_form"] ??= issue.message;
  }
  return out;
}

export async function savePricingAction(
  rentalId: string,
  _prev: PricingFormState,
  formData: FormData,
): Promise<PricingFormState> {
  const parsed = pricingInputSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { errors: flatten(parsed.error) };
  savePricing(getDb(), z.string().min(1).parse(rentalId), parsed.data);
  revalidatePath(`/rentals/${rentalId}/pricing`);
  return { errors: {}, saved: true };
}

export type SeasonFormState = { errors: Record<string, string>; saved?: boolean };

export async function createSeasonAction(
  _prev: SeasonFormState,
  formData: FormData,
): Promise<SeasonFormState> {
  const parsed = seasonInputSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { errors: flatten(parsed.error) };
  try {
    createSeason(getDb(), parsed.data);
  } catch (e) {
    if (e instanceof SeasonOverlapError) {
      return { errors: { startDate: e.message } };
    }
    throw e;
  }
  revalidatePath(`/rentals/${parsed.data.rentalId}/pricing`);
  return { errors: {}, saved: true };
}

export async function deleteSeasonAction(
  rentalId: string,
  seasonId: string,
): Promise<void> {
  deleteSeason(getDb(), z.string().min(1).parse(seasonId));
  revalidatePath(`/rentals/${rentalId}/pricing`);
}
