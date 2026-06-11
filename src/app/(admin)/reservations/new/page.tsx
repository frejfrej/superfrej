import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { listRentals } from "@/server/rentals/service";
import { ReservationForm } from "@/components/reservations/reservation-form";

export const metadata: Metadata = { title: "New reservation" };
export const dynamic = "force-dynamic";

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: Promise<{ rentalId?: string; checkIn?: string }>;
}) {
  // Prefill support: the calendar links here with ?rentalId=…&checkIn=…
  const { rentalId, checkIn } = await searchParams;
  const rentals = listRentals(getDb(), { status: "active" });
  if (rentals.length === 0) redirect("/rentals/new");

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/reservations" className="text-xs text-ink-soft hover:text-ink">
        ← Reservations
      </Link>
      <h1 className="font-display mb-6 mt-2 text-3xl font-medium">
        New reservation
      </h1>
      <ReservationForm
        rentals={rentals}
        defaults={{ rentalId, checkIn }}
      />
    </div>
  );
}
