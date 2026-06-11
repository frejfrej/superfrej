import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bath, BedDouble, Clock, MapPin, Moon, Users } from "lucide-react";
import { getDb } from "@/db/client";
import { getPublicRental } from "@/server/booking/service";
import { RentalNotFoundError } from "@/server/rentals/service";
import { BookingWidget } from "@/components/booking/booking-widget";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    return { title: getPublicRental(getDb(), slug).name };
  } catch {
    return { title: "Not found" };
  }
}

export default async function PublicRentalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let rental;
  try {
    rental = getPublicRental(getDb(), slug);
  } catch (e) {
    if (e instanceof RentalNotFoundError) notFound();
    throw e;
  }

  const facts = [
    { icon: Users, label: `${rental.maxGuests} guests` },
    { icon: BedDouble, label: `${rental.bedrooms} bedroom${rental.bedrooms > 1 ? "s" : ""} · ${rental.beds} bed${rental.beds > 1 ? "s" : ""}` },
    { icon: Bath, label: `${rental.bathrooms} bathroom${rental.bathrooms > 1 ? "s" : ""}` },
    { icon: Clock, label: `Check-in ${rental.checkInFrom}–${rental.checkInTo} · out by ${rental.checkOutUntil}` },
    { icon: Moon, label: `${rental.minNights}–${rental.maxNights} nights` },
  ];

  return (
    <div>
      <Link href="/book" className="text-xs text-ink-soft hover:text-ink">
        ← All places
      </Link>
      <div className="mt-2 grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h1 className="font-display text-4xl font-medium">{rental.name}</h1>
          {(rental.city || rental.country) && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-soft">
              <MapPin size={14} />
              {[rental.city, rental.country].filter(Boolean).join(", ")}
            </p>
          )}

          <ul className="mt-6 flex flex-col gap-2.5">
            {facts.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm text-ink">
                <Icon size={15} className="shrink-0 text-terracotta" />
                {label}
              </li>
            ))}
          </ul>

          {rental.description && (
            <>
              <h2 className="font-display mt-8 text-xl font-medium">
                About this place
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {rental.description}
              </p>
            </>
          )}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <BookingWidget slug={rental.slug} />
        </div>
      </div>
    </div>
  );
}
