import type { Metadata } from "next";
import Link from "next/link";
import { RentalForm } from "@/components/rentals/rental-form";

export const metadata: Metadata = { title: "New rental" };

export default function NewRentalPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/rentals" className="text-xs text-ink-soft hover:text-ink">
        ← Rentals
      </Link>
      <h1 className="font-display mb-6 mt-2 text-3xl font-medium">
        New rental
      </h1>
      <RentalForm />
    </div>
  );
}
