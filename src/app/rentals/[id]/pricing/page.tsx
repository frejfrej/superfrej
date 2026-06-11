import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import {
  getRental,
  RentalNotFoundError,
} from "@/server/rentals/service";
import { getPricing, listSeasons } from "@/server/pricing/service";
import { PricingForm } from "@/components/pricing/pricing-form";
import { SeasonsEditor } from "@/components/pricing/seasons-editor";

export const metadata: Metadata = { title: "Pricing" };
export const dynamic = "force-dynamic";

export default async function RentalPricingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  let rental;
  try {
    rental = getRental(db, id);
  } catch (e) {
    if (e instanceof RentalNotFoundError) notFound();
    throw e;
  }
  const pricing = getPricing(db, id);
  const seasons = listSeasons(db, id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/rentals/${id}`} className="text-xs text-ink-soft hover:text-ink">
        ← {rental.name}
      </Link>
      <h1 className="font-display mb-1 mt-2 text-3xl font-medium">Pricing</h1>
      <p className="mb-6 text-sm text-ink-soft">
        These rates feed every quote — reservations, the booking site and,
        later, your channels.
      </p>
      <div className="flex flex-col gap-5">
        <PricingForm rentalId={id} pricing={pricing} />
        <SeasonsEditor rentalId={id} seasons={seasons} />
      </div>
    </div>
  );
}
