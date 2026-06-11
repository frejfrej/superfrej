import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { listRentals } from "@/server/rentals/service";
import { BlockForm } from "@/components/calendar/block-form";

export const metadata: Metadata = { title: "Block dates" };
export const dynamic = "force-dynamic";

export default async function NewBlockPage({
  searchParams,
}: {
  searchParams: Promise<{ rentalId?: string }>;
}) {
  const { rentalId } = await searchParams;
  const rentals = listRentals(getDb(), { status: "active" });
  if (rentals.length === 0) redirect("/rentals/new");

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/calendar" className="text-xs text-ink-soft hover:text-ink">
        ← Calendar
      </Link>
      <h1 className="font-display mb-2 mt-2 text-3xl font-medium">
        Block dates
      </h1>
      <p className="mb-6 text-sm text-ink-soft">
        Blocked dates can&apos;t be booked — for maintenance, personal stays,
        or anything else. The end date is the first day that&apos;s free
        again.
      </p>
      <BlockForm rentals={rentals} defaultRentalId={rentalId} />
    </div>
  );
}
