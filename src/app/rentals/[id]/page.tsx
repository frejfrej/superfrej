import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import {
  getRental,
  RentalNotFoundError,
} from "@/server/rentals/service";
import { RentalForm } from "@/components/rentals/rental-form";
import { RentalStatusButton } from "@/components/rentals/rental-status-button";

export const metadata: Metadata = { title: "Edit rental" };
export const dynamic = "force-dynamic";

export default async function RentalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let rental;
  try {
    rental = getRental(getDb(), id);
  } catch (e) {
    if (e instanceof RentalNotFoundError) notFound();
    throw e;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/rentals" className="text-xs text-ink-soft hover:text-ink">
        ← Rentals
      </Link>
      <div className="mb-6 mt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium">{rental.name}</h1>
          <p className="mt-1 text-xs text-ink-faint">
            /{rental.slug}
            {rental.status === "archived" && " · archived"}
          </p>
        </div>
        <RentalStatusButton rentalId={rental.id} status={rental.status} />
      </div>
      <RentalForm rental={rental} />
    </div>
  );
}
