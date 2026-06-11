import { randomUUID } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/client";
import {
  rentalPricing,
  rentalSeasons,
  type RentalPricingRow,
  type RentalSeasonRow,
} from "@/db/schema";
import { isIsoDate } from "@/lib/dates";
import { getRental } from "@/server/rentals/service";
import { computeQuote, type PricingConfig, type Quote } from "./engine";

/** Euros in forms ↔ cents in storage. */
const euros = (label: string) =>
  z.coerce.number().min(0, `${label} can't be negative`).max(1_000_000);
const pct = z.coerce.number().int().min(0).max(90);

export const pricingInputSchema = z.object({
  baseEuros: euros("Nightly price").refine((v) => v > 0, "Nightly price is required"),
  weekendEuros: z.union([z.literal(""), euros("Weekend price")]).default(""),
  cleaningFeeEuros: euros("Cleaning fee").default(0),
  cityTaxEuros: euros("City tax").default(0),
  weeklyDiscountPct: pct.default(0),
  monthlyDiscountPct: pct.default(0),
});

export type PricingInput = z.infer<typeof pricingInputSchema>;

export const seasonInputSchema = z
  .object({
    rentalId: z.string().min(1),
    name: z.string().trim().min(1, "Name the season").max(80),
    startDate: z.string().refine(isIsoDate, "First night must be a date"),
    endDate: z.string().refine(isIsoDate, "End must be a date"),
    nightlyEuros: euros("Nightly price").refine((v) => v > 0, "Nightly price is required"),
    weekendEuros: z.union([z.literal(""), euros("Weekend price")]).default(""),
  })
  .refine((v) => v.endDate > v.startDate, {
    message: "End must be after start",
    path: ["endDate"],
  });

export type SeasonInput = z.infer<typeof seasonInputSchema>;

export class SeasonOverlapError extends Error {
  constructor() {
    super("This season overlaps an existing one");
    this.name = "SeasonOverlapError";
  }
}

const DEFAULTS: Omit<RentalPricingRow, "rentalId" | "updatedAt"> = {
  baseCents: 100_00,
  weekendCents: null,
  cleaningFeeCents: 0,
  cityTaxCents: 0,
  weeklyDiscountPct: 0,
  monthlyDiscountPct: 0,
  currency: "EUR",
};

/** Pricing row for a rental, defaults if never configured. */
export function getPricing(db: Db, rentalId: string): RentalPricingRow {
  getRental(db, rentalId);
  const row = db
    .select()
    .from(rentalPricing)
    .where(eq(rentalPricing.rentalId, rentalId))
    .get();
  return row ?? { rentalId, ...DEFAULTS, updatedAt: 0 };
}

export function savePricing(db: Db, rentalId: string, raw: PricingInput): RentalPricingRow {
  getRental(db, rentalId);
  const input = pricingInputSchema.parse(raw);
  const values = {
    baseCents: Math.round(input.baseEuros * 100),
    weekendCents:
      input.weekendEuros === "" ? null : Math.round(input.weekendEuros * 100),
    cleaningFeeCents: Math.round(input.cleaningFeeEuros * 100),
    cityTaxCents: Math.round(input.cityTaxEuros * 100),
    weeklyDiscountPct: input.weeklyDiscountPct,
    monthlyDiscountPct: input.monthlyDiscountPct,
    updatedAt: Date.now(),
  };
  db.insert(rentalPricing)
    .values({ rentalId, currency: "EUR", ...values })
    .onConflictDoUpdate({ target: rentalPricing.rentalId, set: values })
    .run();
  return getPricing(db, rentalId);
}

export function listSeasons(db: Db, rentalId: string): RentalSeasonRow[] {
  return db
    .select()
    .from(rentalSeasons)
    .where(eq(rentalSeasons.rentalId, rentalId))
    .orderBy(asc(rentalSeasons.startDate))
    .all();
}

export function createSeason(db: Db, raw: SeasonInput): RentalSeasonRow {
  const input = seasonInputSchema.parse(raw);
  getRental(db, input.rentalId);
  const overlap = db
    .select({ id: rentalSeasons.id })
    .from(rentalSeasons)
    .where(
      and(
        eq(rentalSeasons.rentalId, input.rentalId),
        sql`${rentalSeasons.startDate} < ${input.endDate}`,
        sql`${rentalSeasons.endDate} > ${input.startDate}`,
      ),
    )
    .get();
  if (overlap) throw new SeasonOverlapError();
  const now = Date.now();
  const row: RentalSeasonRow = {
    id: randomUUID(),
    rentalId: input.rentalId,
    name: input.name,
    startDate: input.startDate,
    endDate: input.endDate,
    nightlyCents: Math.round(input.nightlyEuros * 100),
    weekendCents:
      input.weekendEuros === "" ? null : Math.round(input.weekendEuros * 100),
    createdAt: now,
    updatedAt: now,
  };
  db.insert(rentalSeasons).values(row).run();
  return row;
}

export class SeasonNotFoundError extends Error {
  constructor(id: string) {
    super(`Season not found: ${id}`);
    this.name = "SeasonNotFoundError";
  }
}

export function deleteSeason(db: Db, id: string): void {
  const row = db.select().from(rentalSeasons).where(eq(rentalSeasons.id, id)).get();
  if (!row) throw new SeasonNotFoundError(id);
  db.delete(rentalSeasons).where(eq(rentalSeasons.id, id)).run();
}

/** The one true price for a stay — config + seasons fed to the engine. */
export function quoteStay(
  db: Db,
  rentalId: string,
  checkIn: string,
  checkOut: string,
  guests: number,
): Quote {
  const pricing = getPricing(db, rentalId);
  const config: PricingConfig = {
    baseCents: pricing.baseCents,
    weekendCents: pricing.weekendCents,
    cleaningFeeCents: pricing.cleaningFeeCents,
    cityTaxCents: pricing.cityTaxCents,
    weeklyDiscountPct: pricing.weeklyDiscountPct,
    monthlyDiscountPct: pricing.monthlyDiscountPct,
    currency: pricing.currency,
    seasons: listSeasons(db, rentalId).map((s) => ({
      name: s.name,
      startDate: s.startDate,
      endDate: s.endDate,
      nightlyCents: s.nightlyCents,
      weekendCents: s.weekendCents,
    })),
  };
  return computeQuote(config, checkIn, checkOut, guests);
}
