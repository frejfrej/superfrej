import Link from "next/link";
import { getDb } from "@/db/client";
import { getSetting } from "@/server/settings/service";

/** Public, guest-facing chrome — no admin navigation. */
export default function BookingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const workspace = getSetting(getDb(), "workspace");
  const brand = workspace?.name ?? "Superfrej";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6">
          <Link href="/book" className="font-display text-xl font-medium italic">
            {brand}
          </Link>
          <span className="text-xs uppercase tracking-[0.18em] text-ink-faint">
            Book direct
          </span>
        </div>
      </header>
      <main className="paper-grain flex-1">
        <div className="mx-auto w-full max-w-4xl px-6 py-10">{children}</div>
      </main>
      <footer className="border-t border-hairline bg-surface py-4 text-center text-xs text-ink-faint">
        Powered by Superfrej — zero-commission direct booking
      </footer>
    </div>
  );
}
