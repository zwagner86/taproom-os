import type { ButtonHTMLAttributes } from "react";

import { cn } from "../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-pine text-parchment shadow-panel hover:bg-pine/90 disabled:bg-pine/40 disabled:text-parchment/70",
  secondary:
    "bg-ember text-white shadow-panel hover:bg-ember/90 disabled:bg-ember/40 disabled:text-white/70",
  ghost:
    "border border-ink/10 bg-white/80 text-ink hover:border-ink/20 hover:bg-white",
};

export function Button({
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-ember/40",
        variants[variant],
        className,
      )}
      type={type}
      {...props}
    />
  );
}

