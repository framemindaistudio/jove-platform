"use client";

import Link from "next/link";
import { Badge, statusTone, type Tone } from "@/components/ui/Badge";
import { PRICES_HREF } from "@/components/hq/product/lib";
import { cn } from "@/lib/utils";
import { WORKSHOP_STATUS, countdownLabel, daysBetween, isIso, optionLabel, parseIso } from "./logic";

/** Blueprint progress bar with quarter ticks. `value` is 0–1. */
export function ProgressBar({ value, className, dark, label }: { value: number; className?: string; dark?: boolean; label?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className={cn("relative h-1.5 overflow-hidden rounded-full", dark ? "bg-paper/15" : "bg-graphite/10", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
    >
      <div className={cn("absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-[var(--ease-out-expo)]", dark ? "bg-paper" : "bg-graphite")} style={{ width: `${pct}%` }} />
      {[25, 50, 75].map((t) => (
        <span key={t} className={cn("absolute inset-y-0 w-px", dark ? "bg-graphite/40" : "bg-paper")} style={{ left: `${t}%` }} />
      ))}
    </div>
  );
}

/** Circular readiness gauge drawn like a protractor. `value` is 0–1. */
export function ReadinessRing({ value, size = 64, label = "Ready", dark }: { value: number; size?: number; label?: string; dark?: boolean }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${pct}%`}>
      <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="4" className={dark ? "stroke-paper/15" : "stroke-graphite/10"} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={32 + Math.cos(a) * 30.5}
              y1={32 + Math.sin(a) * 30.5}
              x2={32 + Math.cos(a) * 32}
              y2={32 + Math.sin(a) * 32}
              strokeWidth="1"
              className={dark ? "stroke-paper/40" : "stroke-graphite/30"}
            />
          );
        })}
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className={cn("transition-[stroke-dashoffset] duration-700 ease-[var(--ease-out-expo)]", dark ? "stroke-paper" : "stroke-graphite")}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <span className="text-center leading-none">
          <span className={cn("tabular block font-mono text-[13px] font-bold", dark ? "text-paper" : "text-graphite")}>{pct}%</span>
          <span className={cn("annot mt-0.5 block text-[7px]", dark ? "text-paper/55" : "text-blueprint")}>{label}</span>
        </span>
      </span>
    </div>
  );
}

/** Tear-off calendar block: weekday / day / month. */
export function DateBlock({ iso, className, dark }: { iso: string; className?: string; dark?: boolean }) {
  const ok = isIso(iso);
  const d = ok ? parseIso(iso) : null;
  return (
    <div
      className={cn(
        "relative flex w-16 shrink-0 flex-col items-center overflow-hidden rounded-[var(--radius-sm)] border text-center",
        dark ? "border-paper/25 bg-paper/5 text-paper" : "border-graphite/20 bg-paper text-graphite",
        className,
      )}
    >
      <span className={cn("annot w-full py-0.5 text-[9px]", dark ? "bg-paper text-graphite" : "bg-graphite text-paper")}>{d ? d.toLocaleDateString("en-IN", { weekday: "short" }) : "TBD"}</span>
      <span className="tabular pt-1 font-mono text-2xl font-bold leading-none">{d ? d.getDate() : "—"}</span>
      <span className={cn("annot pb-1.5 pt-1 text-[9px]", dark ? "text-paper/60" : "text-blueprint")}>{d ? d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) : ""}</span>
    </div>
  );
}

export function StatusBadge({ status, className }: { status: unknown; className?: string }) {
  if (!status) return null;
  return (
    <Badge tone={statusTone(status)} dot className={className}>
      {optionLabel(WORKSHOP_STATUS, status)}
    </Badge>
  );
}

export function countdownTone(days: number): Tone {
  if (days < 0) return "neutral";
  if (days <= 3) return "warn";
  if (days <= 14) return "info";
  return "outline";
}

/** "In 12 days" badge. Renders nothing until the viewer's date is known. */
export function Countdown({ date, today, className }: { date: unknown; today: string | null; className?: string }) {
  if (!today || !isIso(date)) return null;
  const days = daysBetween(today, date);
  return (
    <Badge tone={countdownTone(days)} className={className}>
      {countdownLabel(days)}
    </Badge>
  );
}

/** Small mono label + value used inside cards. */
export function Metric({ label, value, sub, className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="annot text-[9px] text-blueprint">{label}</p>
      <p className="tabular mt-1 font-mono text-sm font-semibold text-graphite">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-blueprint">{sub}</p>}
    </div>
  );
}

/** Inline status / error line under action buttons. */
export function Notice({ tone = "neutral", children, className }: { tone?: "neutral" | "ok" | "bad" | "warn"; children: React.ReactNode; className?: string }) {
  const cls = {
    neutral: "border-graphite/15 bg-graphite/[0.04] text-charcoal",
    ok: "border-ok/30 bg-ok/10 text-ok",
    bad: "border-bad/30 bg-bad/10 text-bad",
    warn: "border-warn/30 bg-warn/10 text-warn",
  }[tone];
  return (
    <p role={tone === "bad" ? "alert" : "status"} className={cn("rounded-[var(--radius-sm)] border px-3 py-2 text-xs leading-relaxed", cls, className)}>
      {children}
    </p>
  );
}

/**
 * Link to the screen where the founders type what things cost. Render it only for the roles that see Finance
 * (useBook() is not null): nobody else can open that page.
 */
export function PricesLink({ children = "Money → Prices & Costs", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <Link href={PRICES_HREF} className={cn("font-semibold underline underline-offset-2", className)}>
      {children}
    </Link>
  );
}
