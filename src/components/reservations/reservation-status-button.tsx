"use client";

import { useState, useTransition } from "react";
import { setReservationStatusAction } from "@/app/(admin)/reservations/actions";
import { Button } from "@/components/ui/button";

/** Cancel frees the dates; restore re-checks them (it can fail if someone
 * else booked the gap in between). */
export function ReservationStatusButton({
  reservationId,
  status,
}: {
  reservationId: string;
  status: "confirmed" | "cancelled";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const next = status === "confirmed" ? "cancelled" : "confirmed";

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={status === "confirmed" ? "danger" : "secondary"}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await setReservationStatusAction(reservationId, next);
            setError(result.error);
          })
        }
      >
        {pending
          ? "Working…"
          : status === "confirmed"
            ? "Cancel stay"
            : "Restore"}
      </Button>
      {error && <p className="max-w-56 text-right text-xs text-danger">{error}</p>}
    </div>
  );
}
