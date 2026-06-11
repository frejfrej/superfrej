import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Globe } from "lucide-react";
import { getDb } from "@/db/client";
import { listPublicRentals } from "@/server/booking/service";

export const metadata: Metadata = { title: "Booking site" };
export const dynamic = "force-dynamic";

export default async function BookingSiteAdminPage() {
  const rentals = listPublicRentals(getDb());

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-medium">Booking site</h1>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        Your zero-commission direct-booking site is live. Share these links
        anywhere — bookings land straight in your calendar, priced by your
        own rates.
      </p>

      <div className="mt-6 rounded-card border border-hairline bg-surface-raised p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-terracotta" />
            <div>
              <div className="text-sm font-semibold">Your site</div>
              <code className="text-xs text-ink-soft">/book</code>
            </div>
          </div>
          <Link
            href="/book"
            target="_blank"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-terracotta px-4 text-sm font-medium text-white hover:bg-terracotta-deep"
          >
            Open <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      <h2 className="font-display mt-8 text-xl font-medium">Rental pages</h2>
      <div className="mt-3 flex flex-col gap-2">
        {rentals.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No active rentals — add one and it appears on the site
            automatically.
          </p>
        ) : (
          rentals.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-4 rounded-card border border-hairline bg-surface-raised px-5 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{r.name}</div>
                <code className="text-xs text-ink-faint">/book/{r.slug}</code>
              </div>
              <Link
                href={`/book/${r.slug}`}
                target="_blank"
                className="shrink-0 text-sm font-medium text-terracotta hover:text-terracotta-deep"
              >
                Open <ArrowUpRight size={13} className="inline" />
              </Link>
            </div>
          ))
        )}
      </div>

      <p className="mt-6 text-xs text-ink-faint">
        Coming later: embeddable widget, request-to-book mode, promo codes,
        custom domain.
      </p>
    </div>
  );
}
