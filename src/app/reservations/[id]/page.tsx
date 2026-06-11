import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import {
  displayStatus,
  getReservation,
  ReservationNotFoundError,
} from "@/server/reservations/service";
import { listRentals } from "@/server/rentals/service";
import { ReservationForm } from "@/components/reservations/reservation-form";
import { ReservationStatusButton } from "@/components/reservations/reservation-status-button";

export const metadata: Metadata = { title: "Reservation" };
export const dynamic = "force-dynamic";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  let data;
  try {
    data = getReservation(db, id);
  } catch (e) {
    if (e instanceof ReservationNotFoundError) notFound();
    throw e;
  }
  const { reservation, rental, guest } = data;
  const status = displayStatus(reservation);

  // Active rentals, plus the current one even if archived since.
  const rentals = listRentals(db, { status: "active" });
  if (!rentals.some((r) => r.id === rental.id)) rentals.unshift(rental);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/reservations"
        className="text-xs text-ink-soft hover:text-ink"
      >
        ← Reservations
      </Link>
      <div className="mb-6 mt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium">
            {guest.firstName} {guest.lastName}
          </h1>
          <p className="mt-1 text-xs text-ink-faint">
            {rental.name} · {status}
            {reservation.source === "manual" && " · entered manually"}
          </p>
        </div>
        <ReservationStatusButton
          reservationId={reservation.id}
          status={reservation.status}
        />
      </div>
      <ReservationForm rentals={rentals} reservation={reservation} guest={guest} />
    </div>
  );
}
