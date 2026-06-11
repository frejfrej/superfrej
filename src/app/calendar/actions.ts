"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  blockInputSchema,
  createBlock,
  DatesUnavailableError,
  deleteBlock,
} from "@/server/availability/service";

export type BlockFormState = { errors: Record<string, string> };

export async function createBlockAction(
  _prev: BlockFormState,
  formData: FormData,
): Promise<BlockFormState> {
  const parsed = blockInputSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".") || "_form"] ??= issue.message;
    }
    return { errors };
  }
  try {
    createBlock(getDb(), parsed.data);
  } catch (e) {
    if (e instanceof DatesUnavailableError) {
      return { errors: { startDate: e.message } };
    }
    if (e instanceof z.ZodError) {
      return { errors: { _form: "Invalid block" } };
    }
    return { errors: { _form: "Could not block these dates. Please retry." } };
  }
  revalidatePath("/calendar");
  redirect(`/calendar?month=${parsed.data.startDate.slice(0, 7)}`);
}

export async function deleteBlockAction(blockId: string): Promise<void> {
  deleteBlock(getDb(), z.string().min(1).parse(blockId));
  revalidatePath("/calendar");
}
