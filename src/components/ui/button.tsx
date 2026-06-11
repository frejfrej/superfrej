import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-terracotta text-white hover:bg-terracotta-deep disabled:opacity-50",
  secondary:
    "border border-hairline-strong bg-surface-raised text-ink hover:border-ink-faint disabled:opacity-50",
  ghost: "text-ink-soft hover:bg-paper hover:text-ink",
  danger:
    "border border-danger/30 bg-surface-raised text-danger hover:bg-danger/5",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
