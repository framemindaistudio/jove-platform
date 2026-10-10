"use client";

import { createContext, useContext } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { cleanNumberText } from "./draft";

/** False for Operations, and while HQ cannot save: every box on the screen is then read-only. */
const EditableContext = createContext(false);
export const EditableProvider = EditableContext.Provider;
export const useEditable = () => useContext(EditableContext);

const box =
  "h-9 w-full min-w-0 rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 px-2.5 text-sm text-graphite outline-none transition-colors placeholder:text-blueprint/50 focus:border-graphite focus:bg-white focus:ring-2 focus:ring-graphite/10 read-only:border-graphite/10 read-only:bg-transparent read-only:focus:border-graphite/30 read-only:focus:bg-transparent read-only:focus:ring-0";

/**
 * A box for a number. It shows exactly what was typed (digits, a decimal point, commas) and never a "NaN"; an
 * empty box counts as 0. `money` puts ₹ in front, `percent` puts % behind.
 */
export function NumBox({
  value,
  onChange,
  label,
  kind = "plain",
  invalid,
  autoFocus,
  className,
  id,
}: {
  value: string;
  onChange: (text: string) => void;
  /** read by screen readers when the box has no visible label of its own */
  label?: string;
  kind?: "plain" | "money" | "percent";
  invalid?: boolean;
  autoFocus?: boolean;
  className?: string;
  id?: string;
}) {
  const editable = useEditable();
  return (
    <div className={cn("relative", className)}>
      {kind === "money" && (
        <span aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-blueprint">
          ₹
        </span>
      )}
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        placeholder="0"
        value={value}
        readOnly={!editable}
        autoFocus={autoFocus}
        aria-label={label}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(cleanNumberText(e.target.value))}
        className={cn(box, "tabular text-right font-mono", kind === "money" && "pl-6", kind === "percent" && "pr-7", invalid && "border-bad focus:border-bad")}
      />
      {kind === "percent" && (
        <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-blueprint">
          %
        </span>
      )}
    </div>
  );
}

/** A box for words: a part's name, where to buy it, the name of a cost. */
export function TextBox({ value, onChange, label, placeholder, invalid, autoFocus, className, maxLength }: { value: string; onChange: (text: string) => void; label?: string; placeholder?: string; invalid?: boolean; autoFocus?: boolean; className?: string; maxLength?: number }) {
  const editable = useEditable();
  return (
    <input
      type="text"
      autoComplete="off"
      value={value}
      readOnly={!editable}
      autoFocus={autoFocus}
      maxLength={maxLength}
      placeholder={editable ? placeholder : undefined}
      aria-label={label}
      aria-invalid={invalid || undefined}
      onChange={(e) => onChange(e.target.value)}
      className={cn(box, invalid && "border-bad focus:border-bad", className)}
    />
  );
}

/** A short list to choose from. */
export function PickBox<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: readonly { value: T; label: string }[]; label?: string; className?: string }) {
  const editable = useEditable();
  return (
    <div className={cn("relative", className)}>
      <select value={value} disabled={!editable} aria-label={label} onChange={(e) => onChange(e.target.value as T)} className={cn(box, "appearance-none pr-8 disabled:border-graphite/10 disabled:bg-transparent disabled:opacity-100")}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {editable && <ChevronDown aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-blueprint" />}
    </div>
  );
}

/**
 * A labelled box in a form. The line under the box is always there (empty or not), so the form does not move
 * while a number is being typed.
 */
export function Labeled({ label, note, tone = "muted", className, children }: { label: string; note?: React.ReactNode; tone?: "muted" | "warn"; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="block">
        <span className="annot mb-1.5 block text-charcoal">{label}</span>
        {children}
      </label>
      <p className={cn("mt-1 min-h-4 text-xs leading-4", tone === "warn" ? "font-medium text-warn" : "text-blueprint")}>{note}</p>
    </div>
  );
}

/** "On the website today: ₹599" — shown next to a price that will change for customers. */
export function todayNote(differs: boolean, today: string, otherwise?: React.ReactNode): { note: React.ReactNode; tone: "muted" | "warn" } {
  return differs ? { note: `On the website today: ${today}`, tone: "warn" } : { note: otherwise, tone: "muted" };
}

/* ───────────────────────────── tables ───────────────────────────── */

/** `relative` keeps a wide table's screen-reader-only labels inside the scrolling box, so they cannot widen the page */
export const TABLE_WRAP = "hq-scroll relative overflow-x-auto";
export const TH = "annot px-2 py-2.5 text-left text-[10px] font-medium text-blueprint first:pl-5 last:pr-5";
export const TD = "px-2 py-1.5 align-middle first:pl-5 last:pr-5";
/** a figure worked out by the screen, in a table cell */
export const FIGURE = "tabular whitespace-nowrap text-right font-mono text-sm";

export function RemoveButton({ what, onClick }: { what: string; onClick: () => void }) {
  if (!useEditable()) return null;
  return (
    <button type="button" onClick={onClick} aria-label={`Remove ${what}`} title="Remove this row" className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-blueprint transition-colors hover:bg-bad/10 hover:text-bad focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-graphite">
      <Trash2 className="size-4" aria-hidden />
    </button>
  );
}

export function AddButton({ children, onClick, className }: { children: React.ReactNode; onClick: () => void; className?: string }) {
  if (!useEditable()) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-dashed border-graphite/30 px-3 text-xs font-semibold text-graphite transition-colors hover:border-graphite hover:bg-graphite/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite", className)}
    >
      <Plus className="size-3.5" aria-hidden /> {children}
    </button>
  );
}

/** A small dot on a tab or a kit that holds changes not saved yet. */
export function ChangedDot({ className }: { className?: string }) {
  return (
    <span className={cn("inline-block size-1.5 shrink-0 rounded-full bg-warn", className)}>
      <span className="sr-only">(changes not saved)</span>
    </span>
  );
}
