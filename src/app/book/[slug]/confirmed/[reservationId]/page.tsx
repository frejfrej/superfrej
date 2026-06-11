import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { getDb } from "@/db/client";
import { formatStayDates, nightsBetween } from "@/lib/dates";
import {
  getReservation,
  ReservationNotFoundError,
} from "@/server/reservations/service";

export const metadata: Metadata = { title: "Booking confirmed" };
export const dynamic = "force-dynamic";

const fmt = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );

export default async function BookingConfirmedPage({
  params,
}: {
  params: Promise<{ slug: string; reservationId: string }>;
}) {
  const { slug, reservationId } = await params;
  let data;
  try {
    data = getReservation(getDb(), reservationId);
  } catch (e) {
    if (e instanceof ReservationNotFoundError) notFound();
    throw e;
  }
  const { reservation, rental, guest } = data;
  if (rental.slug !== slug || reservation.source !== "direct") notFound();

  const nights = nightsBetween(reservation.checkIn, reservation.checkOut);

  return (
    <div className="mx-auto max-w-lg text-center">
      <CircleCheck className="mx-auto text-ok" size={44} strokeWidth={1.5} />
      <h1 className="font-display mt-4 text-3xl font-medium">
        You&apos;re booked, {guest.firstName}!
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        A summary of your stay at {rental.name}.
      </p>

      <dl className="mt-8 rounded-card border border-hairline bg-surface-raised p-6 text-left text-sm">
        <div className="flex justify-between py-1.5">
          <dt className="text-ink-soft">Dates</dt>
          <dd className="font-medium">
            {formatStayDates(reservation.checkIn, reservation.checkOut)}
          </dd>
        </div>
        <div className="flex justify-between py-1.5">
          <dt className="text-ink-soft">Nights</dt>
          <dd className="font-medium">{nights}</dd>
        </div>
        <div className="flex justify-between py-1.5">
          <dt className="text-ink-soft">Guests</dt>
          <dd className="font-medium">
            {reservation.adults + reservation.children}
          </dd>
        </div>
        <div className="flex justify-between py-1.5">
          <dt className="text-ink-soft">Check-in</dt>
          <dd className="font-medium">
            from {rental.checkInFrom}, {reservation.checkIn}
          </dd>
        </div>
        <div className="mt-1.5 flex justify-between border-t border-hairline pt-3">
          <dt className="font-semibold">Total</dt>
          <dd className="font-display text-lg font-semibold">
            {fmt(reservation.totalCents)}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-ink-faint">
        Keep this page for your records — confirmation
        #{reservation.id.slice(0, 8)}. Payment is settled with your host
        directly.
      </p>
      <Link
        href="/book"
        className="mt-6 inline-block text-sm font-medium text-terracotta hover:text-terracotta-deep"
      >
        ← Back to all places
      </Link>
    </div>
  );
}
