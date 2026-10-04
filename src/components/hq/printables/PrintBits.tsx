"use client";

/**
 * Shared building blocks for the printable forms, badges and stationery.
 * Everything is sized in millimetres so a sheet prints exactly the way it previews.
 */
import Image from "next/image";
import { A4Page } from "@/components/print/PrintShell";
import { cn } from "@/lib/utils";

/** One A4 portrait sheet with zero padding (tiles manage their own). 296.6 mm avoids a trailing blank page from rounding. */
export function Sheet({ children, className, landscape }: { children: React.ReactNode; className?: string; landscape?: boolean }) {
  return (
    <A4Page padded={false} landscape={landscape} className={cn(landscape ? "min-h-0 h-[209.6mm]" : "min-h-0 h-[296.6mm]", className)}>
      {children}
    </A4Page>
  );
}

/** A fixed-size tile (card, slip, tent half) — optional dashed cut guide. */
export function Tile({ w, h, className, children, cut = true, style }: { w: number | string; h: number | string; className?: string; children?: React.ReactNode; cut?: boolean; style?: React.CSSProperties }) {
  const size = (v: number | string) => (typeof v === "number" ? `${v}mm` : v);
  return (
    <div className={cn("relative overflow-hidden", cut && "border border-dashed border-graphite/25", className)} style={{ width: size(w), height: size(h), ...style }}>
      {children}
    </div>
  );
}

/** JOVE wordmark at a fixed width in mm (eager so it is always loaded when the print dialog opens). */
export function Wordmark({ mm = 30, white, className }: { mm?: number; white?: boolean; className?: string }) {
  return (
    <Image
      src={white ? "/brand/jove-wordmark-white.png" : "/brand/jove-wordmark.png"}
      alt="JOVE"
      width={1400}
      height={669}
      sizes="480px"
      loading="eager"
      className={cn("h-auto select-none", className)}
      style={{ width: `${mm}mm` }}
    />
  );
}

/** The O + robotic-arm symbol. */
export function Mark({ mm = 20, white, className, style }: { mm?: number; white?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <Image
      src={white ? "/brand/jove-mark-white.png" : "/brand/jove-mark.png"}
      alt=""
      width={1024}
      height={1178}
      sizes="480px"
      loading="eager"
      aria-hidden
      className={cn("h-auto select-none", className)}
      style={{ width: `${mm}mm`, ...style }}
    />
  );
}

/** Empty tick box for opt-in / yes-no choices. */
export function TickBox({ mm = 3.4, round, className }: { mm?: number; round?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 border-solid border-graphite bg-white align-[-0.6mm]", round && "rounded-full", className)}
      style={{ width: `${mm}mm`, height: `${mm}mm`, borderWidth: "0.35mm" }}
    />
  );
}

/** A write-in field: dotted line with a tiny caption underneath. */
export function WriteLine({ label, value, className, valueClassName }: { label: string; value?: React.ReactNode; className?: string; valueClassName?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className={cn("min-h-[5.4mm] truncate border-b border-dotted border-graphite/70 pb-[0.4mm] text-[9pt] font-semibold leading-tight", valueClassName)}>{value}</div>
      <div className="mt-[0.7mm] text-[5.6pt] font-semibold uppercase tracking-[0.14em] text-blueprint">{label}</div>
    </div>
  );
}

/** Hand-drawn style smiley, level 1 (very sad) → 5 (very happy). */
export function Smiley({ level, size = 11, label }: { level: 1 | 2 | 3 | 4 | 5; size?: number; label?: string }) {
  const mouth = {
    1: "M10 28 Q16 20 22 28",
    2: "M10 27 Q16 23 22 27",
    3: "M10 25 H22",
    4: "M10 23 Q16 29 22 23",
    5: "M9 22 Q16 33 23 22 Z",
  }[level];
  return (
    <svg viewBox="0 0 32 32" width={`${size}mm`} height={`${size}mm`} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={label ?? `Face ${level} of 5`}>
      <circle cx="16" cy="16" r="14" />
      <circle cx="11.5" cy="13" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="20.5" cy="13" r="1.3" fill="currentColor" stroke="none" />
      {level === 1 && <path d="M8.5 9.5 L13.5 11 M23.5 9.5 L18.5 11" strokeWidth="1" />}
      <path d={mouth} fill={level === 5 ? "currentColor" : "none"} fillOpacity={level === 5 ? 0.12 : 0} />
    </svg>
  );
}

/** Small uppercase annotation text used across printables. */
export function Annot({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("text-[6pt] font-semibold uppercase tracking-[0.2em] text-blueprint", className)}>{children}</span>;
}

/** Footer strip with the brand line, for A4 sheets that are not full-bleed. */
export function SheetFooter({ left, right, className }: { left?: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between border-t border-graphite/25 pt-[1.4mm] text-[5.6pt] uppercase tracking-[0.2em] text-blueprint", className)}>
      <span>{left ?? "Precision · Learning · Innovation · Automation"}</span>
      <span>{right ?? "JOVE — Journey of Visionation & Excellence"}</span>
    </div>
  );
}

/** Document shell shared by every generated print route: shows a friendly empty state while data loads. */
export function Notice({ children }: { children: React.ReactNode }) {
  return <div className="no-print mx-auto max-w-md rounded border border-graphite/20 bg-paper-50 px-4 py-6 text-center text-sm text-charcoal">{children}</div>;
}
