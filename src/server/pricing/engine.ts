import { nightsBetween } from "@/lib/dates";

/**
 * The quote engine — a pure function over a pricing config. Every part of
 * the product that needs a price (reservation form, booking engine, channel
 * sync) calls `computeQuote`; nothing else may do price math.
 */

export type SeasonConfig = {
  name: string;
  /** [startDate, endDate) — endDate's night is not in the season. */
  startDate: string;
  endDate: string;
  nightlyCents: number;
  weekendCents: number | null;
};

export type PricingConfig = {
  baseCents: number;
  weekendCents: number | null;
  cleaningFeeCents: number;
  /** Per guest per night. */
  cityTaxCents: number;
  weeklyDiscountPct: number;
  monthlyDiscountPct: number;
  currency: string;
  seasons: SeasonConfig[];
};

export type QuoteNight = {
  /** The date the night starts on. */
  date: string;
  cents: number;
  weekend: boolean;
  season: string | null;
};

export type Quote = {
  nights: QuoteNight[];
  accommodationCents: number;
  discountPct: number;
  discountLabel: "monthly" | "weekly" | null;
  discountCents: number;
  cleaningFeeCents: number;
  cityTaxCents: number;
  totalCents: number;
  currency: string;
};

/** ISO weekday: 0 = Monday … 6 = Sunday, without Date round-trips. */
function weekdayOf(isoDate: string): number {
  return (Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / 86_400_000) + 3) % 7;
}

function addDays(isoDate: string, days: number): string {
  const t = Date.parse(`${isoDate}T00:00:00Z`) + days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** A "weekend night" is the night starting Friday or Saturday. */
function isWeekendNight(date: string): boolean {
  const wd = weekdayOf(date);
  return wd === 4 || wd === 5;
}

function nightPrice(config: PricingConfig, date: string): Omit<QuoteNight, "date"> {
  const weekend = isWeekendNight(date);
  const season = config.seasons.find(
    (s) => s.startDate <= date && date < s.endDate,
  );
  if (season) {
    return {
      cents: weekend && season.weekendCents != null ? season.weekendCents : season.nightlyCents,
      weekend,
      season: season.name,
    };
  }
  return {
    cents: weekend && config.weekendCents != null ? config.weekendCents : config.baseCents,
    weekend,
    season: null,
  };
}

export function computeQuote(
  config: PricingConfig,
  checkIn: string,
  checkOut: string,
  guests: number,
): Quote {
  const nightCount = nightsBetween(checkIn, checkOut);
  if (nightCount <= 0) throw new Error("checkOut must be after checkIn");
  if (guests < 1) throw new Error("at least one guest");

  const nights: QuoteNight[] = [];
  for (let i = 0; i < nightCount; i++) {
    const date = addDays(checkIn, i);
    nights.push({ date, ...nightPrice(config, date) });
  }

  const accommodationCents = nights.reduce((sum, n) => sum + n.cents, 0);

  let discountPct = 0;
  let discountLabel: Quote["discountLabel"] = null;
  if (nightCount >= 28 && config.monthlyDiscountPct > 0) {
    discountPct = config.monthlyDiscountPct;
    discountLabel = "monthly";
  } else if (nightCount >= 7 && config.weeklyDiscountPct > 0) {
    discountPct = config.weeklyDiscountPct;
    discountLabel = "weekly";
  }
  // Discount applies to accommodation only — never to fees or taxes.
  const discountCents = Math.round((accommodationCents * discountPct) / 100);

  const cityTaxCents = config.cityTaxCents * guests * nightCount;

  return {
    nights,
    accommodationCents,
    discountPct,
    discountLabel,
    discountCents,
    cleaningFeeCents: config.cleaningFeeCents,
    cityTaxCents,
    totalCents:
      accommodationCents - discountCents + config.cleaningFeeCents + cityTaxCents,
    currency: config.currency,
  };
}
