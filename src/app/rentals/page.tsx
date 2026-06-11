import type { Metadata } from "next";
import Link from "next/link";
import { BedDouble, Home, Plus, Search, Users } from "lucide-react";
import { getDb } from "@/db/client";
import { listRentals } from "@/server/rentals/service";
import type { RentalRow } from "@/db/schema";

export const metadata: Metadata = { title: "Rentals" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { label: "Active", value: "active" },
  { label: "Archived", value: "archived" },
  { label: "All", value: "all" },
] as const;

function EmptyState({ filtered }: { filtered: boolean }) {
  if (filtered) {
    return (
      <div className="rounded-card border border-hairline bg-surface-raised px-6 py-16 text-center text-sm text-ink-soft">
        No rentals match this search.
      </div>
    );
  }
  return (
    <div className="rounded-card border border-dashed border-hairline-strong bg-surface px-6 py-16 text-center">
      <Home className="mx-auto text-ink-faint" size={28} strokeWidth={1.5} />
      <h2 className="font-display mt-4 text-xl font-medium">
        Add your first rental
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
        A rental is one bookable property — an apartment, a chalet, a room.
        Everything else in Superfrej (calendar, pricing, reservations) builds
        on it.
      </p>
      <Link
        href="/rentals/new"
        className="mt-6 inline-flex h-9 items-center gap-2 rounded-lg bg-terracotta px-4 text-sm font-medium text-white hover:bg-terracotta-deep"
      >
        <Plus size={16} /> New rental
      </Link>
    </div>
  );
}

function RentalCard({ rental }: { rental: RentalRow }) {
  return (
    <Link
      href={`/rentals/${rental.id}`}
      className="group flex items-center justify-between gap-4 rounded-card border border-hairline bg-surface-raised px-5 py-4 transition-colors hover:border-terracotta/40"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold group-hover:text-terracotta-deep">
            {rental.name}
          </span>
          {rental.status === "archived" && (
            <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] text-ink-faint">
              archived
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-xs text-ink-soft">
          {[rental.city, rental.country].filter(Boolean).join(", ") ||
            "No address yet"}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <Users size={14} className="text-ink-faint" /> {rental.maxGuests}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BedDouble size={14} className="text-ink-faint" /> {rental.bedrooms}
        </span>
        <span className="hidden text-ink-faint sm:block">
          in {rental.checkInFrom}–{rental.checkInTo} · out{" "}
          {rental.checkOutUntil}
        </span>
      </div>
    </Link>
  );
}

export default async function RentalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status: rawStatus } = await searchParams;
  const status =
    rawStatus === "archived" || rawStatus === "all" ? rawStatus : "active";
  const db = getDb();
  const rentals = listRentals(db, {
    q,
    status: status === "all" ? undefined : status,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium">Rentals</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {rentals.length} propert{rentals.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <Link
          href="/rentals/new"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-terracotta px-4 text-sm font-medium text-white hover:bg-terracotta-deep"
        >
          <Plus size={16} /> New rental
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form className="relative" action="/rentals">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name or city…"
            className="h-9 w-64 rounded-lg border border-hairline-strong bg-surface-raised pl-9 pr-3 text-sm placeholder:text-ink-faint focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/15"
          />
          {status !== "active" && (
            <input type="hidden" name="status" value={status} />
          )}
        </form>
        <div className="flex rounded-lg border border-hairline bg-surface p-0.5">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={`/rentals?status=${f.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                status === f.value
                  ? "bg-pine text-pine-ink"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {rentals.length === 0 ? (
          <EmptyState filtered={Boolean(q) || status !== "active"} />
        ) : (
          rentals.map((r) => <RentalCard key={r.id} rental={r} />)
        )}
      </div>
    </div>
  );
}
