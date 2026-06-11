import type { Metadata } from "next";
import Link from "next/link";
import { BookUser, Search } from "lucide-react";
import { getDb } from "@/db/client";
import { listGuests } from "@/server/guests/service";

export const metadata: Metadata = { title: "Guests" };
export const dynamic = "force-dynamic";

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
};

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const guests = listGuests(getDb(), { q });

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/reservations" className="text-xs text-ink-soft hover:text-ink">
        ← Reservations
      </Link>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium">Guest book</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {guests.length} guest{guests.length === 1 ? "" : "s"} — created
            automatically from reservations
          </p>
        </div>
        <form className="relative" action="/guests">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search guests…"
            className="h-9 w-56 rounded-lg border border-hairline-strong bg-surface-raised pl-9 pr-3 text-sm placeholder:text-ink-faint focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/15"
          />
        </form>
      </div>

      <div className="mt-6 overflow-hidden rounded-card border border-hairline bg-surface-raised">
        {guests.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <BookUser className="mx-auto text-ink-faint" size={28} strokeWidth={1.5} />
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
              {q
                ? "No guests match this search."
                : "Guests appear here automatically when you record reservations."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Phone</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Language</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-3 font-medium">
                    {g.firstName} {g.lastName}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{g.email || "—"}</td>
                  <td className="hidden px-5 py-3 text-ink-soft sm:table-cell">
                    {g.phone || "—"}
                  </td>
                  <td className="hidden px-5 py-3 text-ink-soft sm:table-cell">
                    {LANGUAGE_LABELS[g.language] ?? g.language}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
