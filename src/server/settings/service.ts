import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/client";
import { settings } from "@/db/schema";

/**
 * Typed workspace settings on top of the key-value `settings` table.
 * Add new settings here: one zod schema + one entry in SETTINGS.
 */
export const SETTINGS = {
  workspace: z.object({
    name: z.string().min(1).max(120),
    currency: z.string().length(3).default("EUR"),
    timezone: z.string().default("Europe/Paris"),
  }),
} as const;

export type SettingKey = keyof typeof SETTINGS;
export type SettingValue<K extends SettingKey> = z.infer<(typeof SETTINGS)[K]>;

export function getSetting<K extends SettingKey>(
  db: Db,
  key: K,
): SettingValue<K> | null {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  if (!row) return null;
  return SETTINGS[key].parse(row.value) as SettingValue<K>;
}

export function setSetting<K extends SettingKey>(
  db: Db,
  key: K,
  value: SettingValue<K>,
): SettingValue<K> {
  const parsed = SETTINGS[key].parse(value) as SettingValue<K>;
  db.insert(settings)
    .values({ key, value: parsed, updatedAt: Date.now() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: parsed, updatedAt: Date.now() },
    })
    .run();
  return parsed;
}
