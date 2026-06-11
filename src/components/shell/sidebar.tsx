"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS, SETTINGS_ITEM, type NavItem } from "./nav";

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active =
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;

  if (item.soon) {
    return (
      <span
        className="group flex cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm text-pine-ink-soft/60"
        title="Coming soon"
      >
        <Icon size={16} strokeWidth={1.75} />
        <span>{item.label}</span>
        <span className="ml-auto rounded-full border border-pine-ink-soft/25 px-1.5 py-px text-[10px] uppercase tracking-wider text-pine-ink-soft/50">
          soon
        </span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-pine-raised text-pine-ink"
          : "text-pine-ink-soft hover:bg-pine-raised/60 hover:text-pine-ink"
      }`}
    >
      {active && (
        <span className="absolute -left-3 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-terracotta" />
      )}
      <Icon size={16} strokeWidth={1.75} />
      <span>{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-pine px-5 py-6">
      <Link href="/" className="px-3">
        <span className="font-display text-2xl font-medium italic text-pine-ink">
          Superfrej
        </span>
        <span className="mt-0.5 block text-[11px] uppercase tracking-[0.18em] text-pine-ink-soft">
          Hosting, composed
        </span>
      </Link>

      <nav className="mt-8 flex flex-1 flex-col gap-6 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-pine-ink-soft/70">
              {section.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-pine-raised pt-3">
        <NavLink item={SETTINGS_ITEM} />
      </div>
    </aside>
  );
}
