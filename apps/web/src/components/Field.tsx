import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export function Field({
  label,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      <span>{label}</span>
      <input
        className={cn(
          "h-11 rounded-md border border-line bg-field px-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20",
          className
        )}
        {...props}
      />
      {error ? <span className="text-sm font-normal text-red-600">{error}</span> : null}
    </label>
  );
}

export function SelectField({
  label,
  hideLabel = false,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hideLabel?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
      <select
        className={cn(
          "h-10 rounded-md border border-line bg-field px-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
