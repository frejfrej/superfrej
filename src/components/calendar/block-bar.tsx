"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { deleteBlockAction } from "@/app/(admin)/calendar/actions";

/** Hatched bar for a blocked period; click twice to remove (inline confirm —
 * no browser dialogs). */
export function BlockBar({
  blockId,
  reason,
  style,
}: {
  blockId: string;
  reason: string;
  style: CSSProperties;
}) {
  const [arm, setArm] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      style={style}
      title={reason || "Blocked"}
      onClick={() => {
        if (!arm) {
          setArm(true);
          setTimeout(() => setArm(false), 3000);
          return;
        }
        startTransition(() => deleteBlockAction(blockId));
      }}
      className={`z-10 m-1 flex items-center truncate rounded-md border px-2 text-xs transition-colors ${
        arm
          ? "border-danger bg-danger/10 font-medium text-danger"
          : "border-hairline-strong bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,rgba(32,37,31,0.12)_4px,rgba(32,37,31,0.12)_7px)] text-ink-soft hover:border-ink-faint"
      } ${pending ? "opacity-50" : ""}`}
    >
      <span className="truncate">
        {pending ? "Removing…" : arm ? "Remove block?" : reason || "Blocked"}
      </span>
    </button>
  );
}
