"use client";

/**
 * Shared frame for the A3 school brochures (HQ → Printables → Brochures for schools).
 *
 * One brochure is two A3 landscape sheets (420 × 297 mm):
 *   OUTSIDE — back cover on the left half, front cover on the right half
 *   INSIDE  — the spread a reader sees on opening it
 * Printed on both sides (flip on the short edge) and folded once down the middle, it becomes a 4-page A4 brochure.
 * Everything is sized in millimetres and points so a sheet prints exactly the way it previews.
 */
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { PrintShell } from "@/components/print/PrintShell";
import { useSettings } from "@/components/hq/data";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { Q } from "../util";

/** Sheet geometry in millimetres. Keep text 12 mm clear of the sheet edges and 10 mm clear of the fold on each side. */
export const A3 = { w: 420, h: 297, fold: 210, edge: 12, gutter: 10 } as const;

/** One A3 landscape sheet. 296.6 mm tall so rounding never pushes a blank page out of the printer. */
export function Spread({ children, className, foldMarks = true }: { children: React.ReactNode; className?: string; foldMarks?: boolean }) {
  return (
    <div className={cn("print-page relative h-[296.6mm] w-[420mm] shrink-0 overflow-hidden bg-white text-graphite shadow-[0_10px_40px_-12px_rgb(0_0_0/0.35)]", className)}>
      {children}
      {foldMarks && (
        <>
          {/* printed: two ticks that show where to fold, long enough to survive a printer's 5 mm unprintable edge */}
          <span aria-hidden className="pointer-events-none absolute left-[209.85mm] top-[2mm] h-[7mm] w-[0.3mm] bg-graphite/60 outline outline-[0.25mm] outline-white/70" />
          <span aria-hidden className="pointer-events-none absolute bottom-[2mm] left-[209.85mm] h-[7mm] w-[0.3mm] bg-graphite/60 outline outline-[0.25mm] outline-white/70" />
          {/* screen only: the fold line */}
          <span aria-hidden className="no-print pointer-events-none absolute inset-y-0 left-[210mm] w-0 border-l border-dashed border-info/50" />
        </>
      )}
    </div>
  );
}

/** One A4-sized half of a spread. `side="left"` is the back cover on the outside sheet; `side="right"` is the front cover. */
export function Half({ side, children, className }: { side: "left" | "right"; children: React.ReactNode; className?: string }) {
  return <section className={cn("absolute top-0 h-full w-[210mm] overflow-hidden", side === "left" ? "left-0" : "left-[210mm]", className)}>{children}</section>;
}

/* ───────────────────────────── who to call ───────────────────────────── */

export interface BrochureInfo {
  /** "Prepared for …" — the school this copy is for, when typed in the Printables dialog */
  school: string;
  /** the person at JOVE the school should call, when typed in the dialog */
  contactName: string;
  phone: string;
  email: string;
  /** website without the protocol, e.g. "www.jove.website" */
  web: string;
  /** full address of a page on the public website, for QR codes: link("/contact") */
  link: (path?: string) => string;
  /** one line: "City, State" when the company address is filled in Settings */
  place: string;
  /** the company's name as HQ → Settings has it (what every other HQ document prints) */
  legalName: string;
  /** false until the company details have loaded */
  ready: boolean;
}

/** Contact details for the back cover: what was typed in the dialog, else HQ → Settings, else the website's own settings. */
export function useBrochureInfo(q: Q): BrochureInfo {
  const { settings, loading } = useSettings();
  const local = /^(https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(site.url);
  const base = (local ? "https://www.jove.website" : site.url).replace(/\/+$/, "");
  const typed = (settings.website || "").trim().replace(/\/+$/, "");
  const web = (typed || base).replace(/^https?:\/\//i, "");
  return {
    school: (q.for ?? "").trim(),
    contactName: (q.contact ?? "").trim(),
    phone: (q.phone ?? "").trim() || settings.phone || site.contact.phone,
    email: settings.email || site.contact.email,
    web,
    link: (path = "") => `${base}${path}`,
    place: [settings.city, settings.state].filter(Boolean).join(", "),
    legalName: settings.legalName || site.legalName,
    ready: !loading,
  };
}

/* ───────────────────────────── QR code ───────────────────────────── */

/** A QR code as a data URL ("" until it is ready). `dark` / `light` are hex colours. */
export function useQr(text: string, dark = "#2b2b2b", light = "#ffffff") {
  const [qr, setQr] = useState({ text: "", src: "" });
  useEffect(() => {
    let alive = true;
    if (!text) return;
    QRCode.toDataURL(text, { errorCorrectionLevel: "M", margin: 0, width: 520, color: { dark, light } })
      .then((src) => {
        if (alive) setQr({ text: `${text}|${dark}|${light}`, src });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [text, dark, light]);
  return qr.text === `${text}|${dark}|${light}` ? qr.src : "";
}

/** A printed QR code, `mm` wide. Renders an empty box of the same size until the code is ready. */
export function Qr({ src, mm = 26, label, className }: { src: string; mm?: number; label: string; className?: string }) {
  const size = { width: `${mm}mm`, height: `${mm}mm` };
  if (!src) return <span aria-hidden className={cn("block shrink-0", className)} style={size} />;
  // eslint-disable-next-line @next/next/no-img-element -- a data URL made in the browser
  return <img src={src} alt={label} className={cn("block shrink-0", className)} style={size} />;
}

/* ───────────────────────────── shared wording and signs ───────────────────────────── */

/** A session length, said the same way on every brochure: 75 → "1 h 15 min" · 180 → "3 hours". */
export function sessionLength(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} ${h === 1 ? "hour" : "hours"}`;
}

/**
 * The rupee sign drawn as a vector, sized by the text around it. The mono face has no rupee glyph, and a substitute
 * from the computer's own fonts would look different on every machine that prints the brochure.
 */
export function RupeeSign() {
  return (
    <svg role="img" aria-label="₹" viewBox="0 0 100 140" overflow="visible" fill="none" stroke="currentColor" strokeWidth="16" strokeLinejoin="bevel" className="mr-[0.07em] inline-block h-[0.73em] w-[0.52em] align-baseline">
      <path d="M4 8H96M4 41H96M4 8H36C78 8 78 74 36 74H14L72 138" />
    </svg>
  );
}

/* ───────────────────────────── print page shell ───────────────────────────── */

export type Sides = "both" | "outside" | "inside";
export const sidesOf = (q: Q): Sides => (q.sides === "outside" || q.sides === "inside" ? q.sides : "both");

/**
 * The print page for one brochure: toolbar, A3 landscape paper, and the sheets asked for in `?sides=`.
 * `ready` should be false while anything the sheets need (company details, QR code) is still loading.
 */
export function BrochureShell({ title, q, outside, inside, ready = true }: { title: string; q: Q; outside: React.ReactNode; inside: React.ReactNode; ready?: boolean }) {
  const sides = sidesOf(q);
  const note = sides === "both" ? "A3 landscape · 2 sides · print double-sided (flip on short edge), then fold in half" : `A3 landscape · ${sides} sheet only`;
  return (
    <PrintShell
      title={title}
      back="/hq/printables"
      paper="A3 landscape"
      toolbar={
        <span className="text-xs text-blueprint" data-brochure-ready={ready ? "1" : "0"}>
          {ready ? note : "Preparing…"}
        </span>
      }
    >
      {sides !== "inside" && outside}
      {sides !== "outside" && inside}
    </PrintShell>
  );
}
