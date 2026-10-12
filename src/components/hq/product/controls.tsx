"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CircleCheck, Info, Loader2, TriangleAlert, X } from "lucide-react";
import { PrintShell } from "@/components/print/PrintShell";
import { cn } from "@/lib/utils";

/* ─────────────────────────── notices ─────────────────────────── */

export type NoticeState = { tone: "ok" | "bad" | "info"; text: React.ReactNode } | null;

export function Notice({ notice, onDismiss, className }: { notice: NoticeState; onDismiss?: () => void; className?: string }) {
  if (!notice) return null;
  const Icon = notice.tone === "ok" ? CircleCheck : notice.tone === "bad" ? TriangleAlert : Info;
  return (
    <div
      role={notice.tone === "bad" ? "alert" : "status"}
      className={cn(
        "no-print mb-4 flex items-start gap-3 rounded-[var(--radius-sm)] border px-4 py-3 text-sm",
        notice.tone === "ok" && "border-ok/30 bg-ok/10 text-graphite",
        notice.tone === "bad" && "border-bad/30 bg-bad/10 text-graphite",
        notice.tone === "info" && "border-graphite/15 bg-graphite/[0.04] text-charcoal",
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", notice.tone === "ok" && "text-ok", notice.tone === "bad" && "text-bad", notice.tone === "info" && "text-blueprint")} aria-hidden />
      <div className="min-w-0 flex-1">{notice.text}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="rounded p-0.5 text-blueprint hover:bg-graphite/10 hover:text-graphite" aria-label="Dismiss message">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/** notice state that can be set from async handlers */
export function useNotice() {
  const [notice, setNotice] = useState<NoticeState>(null);
  const clear = useCallback(() => setNotice(null), []);
  return { notice, setNotice, clear };
}

export const errMsg = (e: unknown, fallback = "Something went wrong") => (e instanceof Error ? e.message : fallback);

/* ─────────────────────────── drawer control ─────────────────────────── */

/**
 * Controlled-drawer helper for <CollectionManager openId onOpenChange>.
 * `undefined` keeps the manager uncontrolled (so a brand-new record isn't closed by background refreshes);
 * an id opens that record; `closeDrawer()` force-closes it after an action.
 */
export function useDrawerControl(initial?: string) {
  const [openId, setOpenId] = useState<string | null | undefined>(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const onOpenChange = useCallback((id: string | null) => setOpenId(id ?? undefined), []);
  const openRecord = useCallback((id: string) => setOpenId(id), []);
  const closeDrawer = useCallback(() => {
    setOpenId(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpenId(undefined), 80);
  }, []);
  return { openId, onOpenChange, openRecord, closeDrawer };
}

/* ─────────────────────────── segmented control ─────────────────────────── */

export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: React.ReactNode; icon?: React.ReactNode }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex h-10 items-center rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex h-full items-center gap-1.5 rounded-[3px] px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-graphite",
            o.value === value ? "bg-graphite text-paper" : "text-charcoal hover:bg-graphite/5",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────── small icon button / link ─────────────────────────── */

const iconBtn =
  "inline-grid size-8 place-items-center rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 text-charcoal transition-colors hover:border-graphite hover:bg-graphite hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-graphite disabled:pointer-events-none disabled:opacity-40";

export function IconButton({ label, className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={cn(iconBtn, className)} {...props}>
      {children}
    </button>
  );
}

export function IconLink({ label, href, external, children }: { label: string; href: string; external?: boolean; children: React.ReactNode }) {
  return external ? (
    <a href={href} aria-label={label} title={label} target="_blank" rel="noopener noreferrer" className={iconBtn}>
      {children}
    </a>
  ) : (
    <Link href={href} aria-label={label} title={label} className={iconBtn}>
      {children}
    </Link>
  );
}

/* ─────────────────────────── QR codes (generated in the browser) ─────────────────────────── */

export function useQr(text: string, width = 320) {
  const [state, setState] = useState<{ text: string; src: string } | null>(null);
  useEffect(() => {
    if (!text) return;
    let alive = true;
    import("qrcode")
      .then((mod) => {
        const lib = (mod as unknown as { default?: typeof mod }).default ?? mod;
        return lib.toDataURL(text, { margin: 1, width, errorCorrectionLevel: "M", color: { dark: "#161616", light: "#FFFFFF" } });
      })
      .then((src) => alive && setState({ text, src }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [text, width]);
  return state && state.text === text ? state.src : "";
}

export function QrImage({ src, size, alt, className }: { src: string; size: number; alt: string; className?: string }) {
  if (!src) return <div aria-hidden className={cn("shrink-0 border border-dashed border-graphite/30", className)} style={{ width: size, height: size }} />;
  return <Image src={src} alt={alt} width={size} height={size} unoptimized className={cn("shrink-0", className)} />;
}

/* ─────────────────────────── print page states ─────────────────────────── */

export function DocMessage({ title, back, state, noun, backLabel }: { title: string; back: string; state: "loading" | "error" | "missing"; noun: string; backLabel: string; }) {
  return (
    <PrintShell title={title} back={back}>
      <div className="w-full max-w-md rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-8 text-center">
        {state === "loading" ? (
          <p className="flex items-center justify-center gap-2 text-sm text-blueprint">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Loading…
          </p>
        ) : (
          <>
            <h2 className="text-base font-semibold">{state === "error" ? `Could not load this ${noun}` : `${noun.charAt(0).toUpperCase()}${noun.slice(1)} not found`}</h2>
            <p className="mt-2 text-sm text-charcoal">{state === "error" ? "Check your connection and try again." : "It may have been deleted, or the link is wrong."}</p>
            <Link href={back} className="mt-5 inline-block text-sm font-semibold underline underline-offset-2">
              {backLabel}
            </Link>
          </>
        )}
      </div>
    </PrintShell>
  );
}
