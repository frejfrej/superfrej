import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const STEPS = [
  {
    title: "Add your rentals",
    body: "Create each property with its capacity, check-in windows and house rules.",
    status: "Up next",
  },
  {
    title: "Set your pricing",
    body: "Base and weekend rates, seasonal adjustments, fees and taxes.",
    status: "Soon",
  },
  {
    title: "Open your calendar",
    body: "See every stay across properties, block dates, take direct bookings.",
    status: "Soon",
  },
  {
    title: "Connect your channels",
    body: "Sync rates and availability with Airbnb, Booking.com and more.",
    status: "Soon",
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
        Welcome
      </p>
      <h1 className="font-display mt-2 max-w-2xl text-4xl font-medium leading-tight">
        Your house, in order.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
        Superfrej brings reservations, guests, payments and channel sync into
        one calm place. The modules below light up as they ship — follow along
        on the{" "}
        <Link
          href="https://github.com/frejfrej/superfrej/issues"
          className="font-medium text-terracotta underline decoration-terracotta/30 underline-offset-2 hover:decoration-terracotta"
        >
          roadmap
          <ArrowUpRight className="ml-0.5 inline" size={12} />
        </Link>
        .
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="rounded-card border border-hairline bg-surface-raised p-5 shadow-[0_1px_2px_rgba(32,37,31,0.04)]"
          >
            <div className="flex items-start justify-between">
              <span className="font-display text-3xl font-light text-hairline-strong">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  step.status === "Up next"
                    ? "bg-terracotta-soft text-terracotta-deep"
                    : "bg-paper text-ink-faint"
                }`}
              >
                {step.status}
              </span>
            </div>
            <h2 className="mt-3 text-sm font-semibold">{step.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
