import type { Metadata } from "next";
import Link from "next/link";
import { Bath, BedDouble, MapPin, Users } from "lucide-react";
import { getDb } from "@/db/client";
import { listPublicRentals } from "@/server/booking/service";

export const metadata: Metadata = { title: "Book your stay" };
export const dynamic = "force-dynamic";

const euros = (cents: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);

export default async function BookIndexPage() {
  const rentals = listPublicRentals(getDb());

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
        Stays
      </p>
      <h1 className="font-display mt-2 text-4xl font-medium">
        Choose your place
      </h1>

      {rentals.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">
          No places are open for booking right now — please check back soon.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {rentals.map((r) => (
            <Link
              key={r.id}
              href={`/book/${r.slug}`}
              className="group rounded-card border border-hairline bg-surface-raised p-6 transition-all hover:-translate-y-0.5 hover:border-terracotta/40 hover:shadow-[0_8px_24px_rgba(32,37,31,0.08)]"
            >
              <h2 className="font-display text-xl font-medium group-hover:text-terracotta-deep">
                {r.name}
              </h2>
              {(r.city || r.country) && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-soft">
                  <MapPin size={12} />
                  {[r.city, r.country].filter(Boolean).join(", ")}
                </p>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-ink-soft">
                <span className="inline-flex items-center gap-1">
                  <Users size={13} /> {r.maxGuests}
                </span>
                <span className="inline-flex items-center gap-1">
                  <BedDouble size={13} /> {r.bedrooms}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Bath size={13} /> {r.bathrooms}
                </span>
              </div>
              <p className="mt-4 text-sm">
                <span className="font-display text-lg font-medium">
                  {euros(r.fromCents)}
                </span>{" "}
                <span className="text-ink-soft">/ night, from</span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
