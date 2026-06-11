"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Client-only date: the shell is statically prerendered, so a server-rendered
 * date would freeze at build time. Server snapshot is empty; the real date
 * fills in on the client. (String snapshots are value-compared, so returning
 * a fresh string per call is safe.)
 */
function useToday(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () =>
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    () => "",
  );
}

export function Topbar() {
  const today = useToday();

  return (
    <header className="flex h-14 items-center justify-between border-b border-hairline bg-surface px-8">
      <div className="text-sm text-ink-soft">{today}</div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-sage-soft px-2.5 py-0.5 text-xs font-medium text-sage">
          Local workspace
        </span>
      </div>
    </header>
  );
}
