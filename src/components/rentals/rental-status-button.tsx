"use client";

import { useTransition } from "react";
import { setRentalStatusAction } from "@/app/(admin)/rentals/actions";
import { Button } from "@/components/ui/button";

/**
 * Archive keeps history intact (reservations will reference rentals); there
 * is deliberately no hard delete in the UI.
 */
export function RentalStatusButton({
  rentalId,
  status,
}: {
  rentalId: string;
  status: "active" | "archived";
}) {
  const [pending, startTransition] = useTransition();
  const next = status === "active" ? "archived" : "active";

  return (
    <Button
      variant={status === "active" ? "danger" : "secondary"}
      disabled={pending}
      onClick={() =>
        startTransition(() => setRentalStatusAction(rentalId, next))
      }
    >
      {pending
        ? "Working…"
        : status === "active"
          ? "Archive"
          : "Restore"}
    </Button>
  );
}
