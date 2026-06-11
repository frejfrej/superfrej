import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getDb } from "@/db/client";
import { todayIso } from "@/lib/dates";
import {
  dateOf,
  dayOfMonth,
  daysInMonth,
  isIsoMonth,
  monthLabel,
  monthOf,
  monthStart,
  nextMonthStart,
  addMonths,
  weekdayIndex,
} from "@/lib/month";
import { getCalendar, type CalendarRow } from "@/server/availability/service";
import { BlockBar } from "@/components/calendar/block-bar";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function RentalLane({
  row,
  month,
  today,
}: {
  row: CalendarRow;
  month: string;
  today: string;
}) {
  const days = daysInMonth(month);
  const from = monthStart(month);
  const to = nextMonthStart(month);

  // Clip a [start, end) range to this month and convert to 1-based grid
  // columns (end is exclusive: a stay ending on the 5th frees the 5th).
  const columns = (start: string, end: string) => {
    const s = start < from ? 1 : dayOfMonth(start);
    const e = end >= to ? days + 1 : dayOfMonth(end);
    return { start: s, end: e };
  };

  return (
    <div
      className="relative grid h-12"
      style={{ gridTemplateColumns: `repeat(${days}, minmax(2.25rem, 1fr))` }}
    >
      {Array.from({ length: days }, (_, i) => {
        const day = i + 1;
        const date = dateOf(month, day);
        const weekend = weekdayIndex(month, day) >= 5;
        return (
          <Link
            key={day}
            href={`/reservations/new?rentalId=${row.rental.id}&checkIn=${date}`}
            title={`New reservation from ${date}`}
            // Explicit placement: auto-placed cells would skip columns
            // occupied by the bars and shift the whole lane.
            style={{ gridRow: 1, gridColumn: day }}
            className={`border-b border-r border-hairline transition-colors hover:bg-terracotta-soft/40 ${
              weekend ? "bg-paper" : "bg-surface-raised"
            } ${date === today ? "bg-gold-soft/50" : ""}`}
          />
        );
      })}

      {row.reservations.map(({ reservation, guestName }) => {
        const { start, end } = columns(reservation.checkIn, reservation.checkOut);
        return (
          <Link
            key={reservation.id}
            href={`/reservations/${reservation.id}`}
            title={`${guestName} · ${reservation.checkIn} → ${reservation.checkOut}`}
            className="z-10 m-1 flex items-center truncate rounded-md bg-pine px-2 text-xs font-medium text-pine-ink shadow-sm transition-colors hover:bg-pine-raised"
            style={{ gridRow: 1, gridColumnStart: start, gridColumnEnd: end }}
          >
            <span className="truncate">{guestName}</span>
          </Link>
        );
      })}

      {row.blocks.map((block) => {
        const { start, end } = columns(block.startDate, block.endDate);
        return (
          <BlockBar
            key={block.id}
            blockId={block.id}
            reason={block.reason}
            style={{ gridRow: 1, gridColumnStart: start, gridColumnEnd: end }}
          />
        );
      })}
    </div>
  );
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const today = todayIso();
  const { month: rawMonth } = await searchParams;
  const month = rawMonth && isIsoMonth(rawMonth) ? rawMonth : monthOf(today);
  const rows = getCalendar(getDb(), monthStart(month), nextMonthStart(month));
  const days = daysInMonth(month);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium">Calendar</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Click a free day to book it, or block dates for maintenance and
            personal use.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar/block/new?month=${month}`}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-hairline-strong bg-surface-raised px-4 text-sm font-medium hover:border-ink-faint"
          >
            <Plus size={16} /> Block dates
          </Link>
          <div className="flex items-center rounded-lg border border-hairline bg-surface">
            <Link
              href={`/calendar?month=${addMonths(month, -1)}`}
              className="flex h-9 w-9 items-center justify-center text-ink-soft hover:text-ink"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </Link>
            <Link
              href="/calendar"
              className="px-2 text-xs font-medium text-ink-soft hover:text-ink"
            >
              Today
            </Link>
            <Link
              href={`/calendar?month=${addMonths(month, 1)}`}
              className="flex h-9 w-9 items-center justify-center text-ink-soft hover:text-ink"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      <h2 className="font-display mt-6 text-xl font-medium">
        {monthLabel(month)}
      </h2>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-card border border-dashed border-hairline-strong bg-surface px-6 py-16 text-center">
          <CalendarDays className="mx-auto text-ink-faint" size={28} strokeWidth={1.5} />
          <h2 className="font-display mt-4 text-xl font-medium">
            No active rentals yet
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
            The calendar shows one lane per rental. Create your first property
            to see it here.
          </p>
          <Link
            href="/rentals/new"
            className="mt-6 inline-flex h-9 items-center gap-2 rounded-lg bg-terracotta px-4 text-sm font-medium text-white hover:bg-terracotta-deep"
          >
            <Plus size={16} /> New rental
          </Link>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-card border border-hairline bg-surface-raised">
          <div className="min-w-fit">
            {/* Day header */}
            <div className="grid border-b border-hairline-strong" style={{ gridTemplateColumns: `10rem repeat(${days}, minmax(2.25rem, 1fr))` }}>
              <div className="border-r border-hairline" />
              {Array.from({ length: days }, (_, i) => {
                const day = i + 1;
                const date = dateOf(month, day);
                const wd = weekdayIndex(month, day);
                return (
                  <div
                    key={day}
                    className={`border-r border-hairline py-1.5 text-center ${
                      wd >= 5 ? "bg-paper" : ""
                    } ${date === today ? "bg-gold-soft/50" : ""}`}
                  >
                    <div className="text-[10px] uppercase text-ink-faint">
                      {WEEKDAYS[wd]}
                    </div>
                    <div
                      className={`text-xs font-medium ${
                        date === today ? "text-terracotta" : "text-ink-soft"
                      }`}
                    >
                      {day}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* One lane per rental */}
            {rows.map((row) => (
              <div
                key={row.rental.id}
                className="grid"
                style={{ gridTemplateColumns: `10rem 1fr` }}
              >
                <Link
                  href={`/rentals/${row.rental.id}`}
                  className="flex items-center truncate border-b border-r border-hairline px-3 text-xs font-medium hover:text-terracotta-deep"
                >
                  <span className="truncate">{row.rental.name}</span>
                </Link>
                <RentalLane row={row} month={month} today={today} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded-sm bg-pine" /> Reservation
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded-sm border border-hairline-strong bg-[repeating-linear-gradient(135deg,transparent,transparent_3px,rgba(32,37,31,0.18)_3px,rgba(32,37,31,0.18)_5px)]" />{" "}
          Blocked
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded-sm bg-gold-soft" /> Today
        </span>
      </div>
    </div>
  );
}
