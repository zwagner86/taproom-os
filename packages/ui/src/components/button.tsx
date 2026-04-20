import type { ButtonHTMLAttributes } from "react";

import { cn } from "../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ember text-white hover:bg-ember-dark disabled:opacity-50",
  secondary: "bg-white text-ink border border-rim hover:bg-mist disabled:opacity-50",
  ghost: "bg-transparent text-muted hover:bg-mist disabled:opacity-50",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
  success: "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50",
  outline: "bg-transparent text-ember border border-ember hover:bg-ember-light disabled:opacity-50",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-4 py-2 text-[14px]",
  lg: "px-6 py-3 text-[15px]",
};

export function Button({
  className,
  type = "button",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer",
        variants[variant],
        sizes[size],
        props.disabled && "cursor-not-allowed",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
