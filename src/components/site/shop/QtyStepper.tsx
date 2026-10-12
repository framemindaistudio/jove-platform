"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** − [ n ] + quantity control. Typing is allowed; the value is clamped on blur. */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 50,
  size = "md",
  label = "Quantity",
  disabled,
  className,
}: {
  value: number;
  onChange: (qty: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (n: number) => Math.max(min, Math.min(max, Math.round(n)));
  const commit = (raw: string) => {
    const n = Number(raw);
    if (raw.trim() !== "" && Number.isFinite(n)) onChange(clamp(n));
    setDraft(null);
  };
  const h = size === "sm" ? "h-9" : "h-11";
  const w = size === "sm" ? "w-9" : "w-11";
  const btn = cn(
    "grid shrink-0 place-items-center text-graphite transition-colors hover:bg-graphite/[0.06] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent",
    h,
    w,
  );

  return (
    <div role="group" aria-label={label} className={cn("inline-flex items-stretch overflow-hidden rounded-[var(--radius-sm)] border border-graphite/25 bg-paper-50", disabled && "opacity-60", className)}>
      <button type="button" className={btn} onClick={() => {
          setDraft(null);
          onChange(clamp(value - 1));
        }} disabled={disabled || value <= min} aria-label={`Decrease ${label.toLowerCase()}`}>
        <Minus className="size-3.5" aria-hidden />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={label}
        className={cn("tabular w-11 border-x border-graphite/15 bg-transparent text-center font-mono text-sm font-semibold text-graphite outline-none focus:bg-white", h)}
        value={draft ?? String(value)}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 2))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit((e.target as HTMLInputElement).value);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setDraft(null);
            onChange(clamp(value + 1));
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setDraft(null);
            onChange(clamp(value - 1));
          }
        }}
      />
      <button type="button" className={btn} onClick={() => {
          setDraft(null);
          onChange(clamp(value + 1));
        }} disabled={disabled || value >= max} aria-label={`Increase ${label.toLowerCase()}`}>
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
