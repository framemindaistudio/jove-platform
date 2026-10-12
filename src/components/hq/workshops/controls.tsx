"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";

/** Accessible on/off switch with a label and optional description. */
export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p id={`${id}-l`} className="text-sm font-medium text-graphite">
          {label}
        </p>
        {description && <p className="mt-0.5 text-xs text-blueprint">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-l`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite disabled:cursor-not-allowed disabled:opacity-60",
          checked ? "border-graphite bg-graphite" : "border-graphite/30 bg-graphite/10",
        )}
      >
        <span className={cn("absolute left-[2px] top-[2px] size-[18px] rounded-full bg-paper shadow transition-transform duration-200", checked ? "translate-x-5" : "translate-x-0 bg-graphite/70")} aria-hidden />
      </button>
    </div>
  );
}

/** Number input that commits on blur / Enter instead of on every keystroke. */
export function NumberCommit({ value, onCommit, disabled, label, prefix, className }: { value: number; onCommit: (n: number) => void; disabled?: boolean; label: string; prefix?: string; className?: string }) {
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? (value ? String(value) : "");
  function commit() {
    if (text === null) return;
    const n = text.trim() === "" ? 0 : Number(text);
    if (Number.isFinite(n) && n >= 0 && n !== value) onCommit(n);
    setText(null);
  }
  return (
    <div className={cn("relative", className)}>
      {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blueprint">{prefix}</span>}
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        aria-label={label}
        value={shown}
        disabled={disabled}
        placeholder="0"
        className={cn("tabular h-9 text-right font-mono", prefix && "pl-7")}
        onFocus={() => setText(value ? String(value) : "")}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setText(null);
        }}
      />
    </div>
  );
}
