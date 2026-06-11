import type { Metadata } from "next";
import Link from "next/link";
import { CalendarRange, Plus, Search, Users } from "lucide-react";
import { getDb } from "@/db/client";
import { formatStayDates, nightsBetween } from "@/lib/dates";
import {
  displayStatus,
  listReservations,
  type ReservationListTab,
} from "@/server/reservations/service";
import { listRentals } from "@/server/rentals/service";

export const metadata: Metadata = { title: "Reservations" };
export const dynamic = "force-dynamic";

const TABS: { label: string; value: ReservationListTab }[] = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Past", value: "past" },
  { label: "Cancelled", value: "cancelled" },
  { label: "All", value: "all" },
];

const STATUS_BADGE: Record<string, string> = {
  confirmed: "bg-sage-soft text-sage",
  completed: "bg-paper text-ink-faint",
  cancelled: "bg-danger/10 text-danger",
};

function euros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const { q = "", tab: rawTab } = await searchParams;
  const tab: ReservationListTab =
    rawTab === "past" || rawTab === "cancelled" || rawTab === "all"
      ? rawTab
      : "upcoming";
  const db = getDb();
  const rows = listReservations(db, { tab, q });
  const hasRentals = listRentals(db, { status: "active" }).length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium">Reservations</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {rows.length} stay{rows.length === 1 ? "" : "s"} ·{" "}
            <Link href="/guests" className="underline decoration-hairline-strong underline-offset-2 hover:text-ink">
              guest book
            </Link>
          </p>
        </div>
        {hasRentals && (
          <Link
            href="/reservations/new"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-terracotta px-4 text-sm font-medium text-white hover:bg-terracotta-deep"
          >
            <Plus size={16} /> New reservation
          </Link>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form className="relative" action="/reservations">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search guest or rental…"
            className="h-9 w-64 rounded-lg border border-hairline-strong bg-surface-raised pl-9 pr-3 text-sm placeholder:text-ink-faint focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/15"
          />
          {tab !== "upcoming" && <input type="hidden" name="tab" value={tab} />}
        </form>
        <div className="flex rounded-lg border border-hairline bg-surface p-0.5">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={`/reservations?tab=${t.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t.value
                  ? "bg-pine text-pine-ink"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {rows.length === 0 ? (
          <div className="rounded-card border border-dashed border-hairline-strong bg-surface px-6 py-16 text-center">
            <CalendarRange
              className="mx-auto text-ink-faint"
              size={28}
              strokeWidth={1.5}
            />
            <h2 className="font-display mt-4 text-xl font-medium">
              {hasRentals ? "No reservations here yet" : "Add a rental first"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
              {hasRentals
                ? "Record a booking manually — OTA-synced reservations arrive with the channel manager."
                : "Reservations live on a rental. Create your first property, then come back here."}
            </p>
            <Link
              href={hasRentals ? "/reservations/new" : "/rentals/new"}
              className="mt-6 inline-flex h-9 items-center gap-2 rounded-lg bg-terracotta px-4 text-sm font-medium text-white hover:bg-terracotta-deep"
            >
              <Plus size={16} />{" "}
              {hasRentals ? "New reservation" : "New rental"}
            </Link>
          </div>
        ) : (
          rows.map(({ reservation, rental, guest }) => {
            const status = displayStatus(reservation);
            const nights = nightsBetween(reservation.checkIn, reservation.checkOut);
            return (
              <Link
                key={reservation.id}
                href={`/reservations/${reservation.id}`}
                className="group grid grid-cols-[1fr_auto] items-center gap-4 rounded-card border border-hairline bg-surface-raised px-5 py-4 transition-colors hover:border-terracotta/40 sm:grid-cols-[1.2fr_1fr_auto_auto]"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold group-hover:text-terracotta-deep">
                    {guest.firstName} {guest.lastName}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-ink-soft">
                    {rental.name}
                  </div>
                </div>
                <div className="hidden min-w-0 text-xs text-ink-soft sm:block">
                  {formatStayDates(reservation.checkIn, reservation.checkOut)}
                  <span className="text-ink-faint">
                    {" "}
                    · {nights} night{nights > 1 ? "s" : ""} ·{" "}
                    <span className="inline-flex items-center gap-1">
                      <Users size={11} className="inline" />
                      {reservation.adults + reservation.children}
                    </span>
                  </span>
                </div>
                <div className="hidden text-sm font-medium sm:block">
                  {euros(reservation.totalCents)}
                </div>
                <span
                  className={`justify-self-end rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[status]}`}
                >
                  {status}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
