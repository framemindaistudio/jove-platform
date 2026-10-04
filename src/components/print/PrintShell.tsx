"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { CompanySettings } from "@/lib/hq/settings";

/**
 * Wraps one or more A4 pages with an on-screen toolbar (Back · Print / Save as PDF).
 * Children should be <A4Page> elements. Use the browser's "Save as PDF" to download.
 */
export function PrintShell({ title, back, children, toolbar, landscape }: { title: string; back?: string; children: React.ReactNode; toolbar?: React.ReactNode; landscape?: boolean }) {
  return (
    <div className="min-h-dvh bg-paper-300/60 print:bg-white">
      {landscape && <style>{`@page { size: A4 landscape; margin: 0; }`}</style>}
      <div className="no-print sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-graphite/15 bg-paper/95 px-4 py-3 backdrop-blur sm:px-6">
        {back && (
          <Link href={back} className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium hover:bg-graphite/5">
            <ArrowLeft className="size-4" /> Back
          </Link>
        )}
        <h1 className="truncate text-sm font-semibold">{title}</h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {toolbar}
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> Print / Save PDF
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-center gap-6 px-2 py-8 print:block print:p-0">{children}</div>
    </div>
  );
}

/** One A4 sheet (210×297mm, or 297×210 landscape). */
export function A4Page({ children, className, landscape, padded = true }: { children: React.ReactNode; className?: string; landscape?: boolean; padded?: boolean }) {
  return (
    <div
      className={cn(
        "print-page relative overflow-hidden bg-white text-graphite shadow-[0_10px_40px_-12px_rgb(0_0_0/0.35)]",
        landscape ? "h-[210mm] w-[297mm]" : "min-h-[297mm] w-[210mm]",
        padded && "px-[16mm] py-[14mm]",
        className,
      )}
      style={{ maxWidth: "100%" }}
    >
      {children}
    </div>
  );
}

/** Brand letterhead header for invoices, proposals, letters. */
export function Letterhead({ settings, docTitle, docMeta }: { settings: CompanySettings; docTitle?: string; docMeta?: React.ReactNode }) {
  const addr = [settings.addressLine1, settings.addressLine2, [settings.city, settings.state, settings.pincode].filter(Boolean).join(", ")].filter(Boolean);
  return (
    <header className="relative mb-8 border-b-2 border-graphite pb-5">
      <div className="flex items-start justify-between gap-6">
        <div className="w-44">
          <Image src="/brand/jove-wordmark.png" alt="JOVE" width={1400} height={669} className="h-auto w-full" priority />
        </div>
        <div className="text-right text-[10px] leading-relaxed text-charcoal">
          <p className="text-[11px] font-bold text-graphite">{settings.legalName}</p>
          {addr.map((l) => (
            <p key={l}>{l}</p>
          ))}
          {(settings.phone || settings.email) && <p>{[settings.phone, settings.email].filter(Boolean).join(" · ")}</p>}
          {settings.website && <p>{settings.website}</p>}
          {settings.gstin && <p className="font-semibold">GSTIN: {settings.gstin}</p>}
        </div>
      </div>
      {docTitle && (
        <div className="mt-5 flex items-end justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{docTitle}</h1>
          {docMeta && <div className="text-right text-xs text-charcoal">{docMeta}</div>}
        </div>
      )}
      <div className="absolute -bottom-[5px] left-0 h-2 w-2 rounded-full border-2 border-graphite bg-white" />
      <div className="absolute -bottom-[5px] right-0 h-2 w-2 rounded-full border-2 border-graphite bg-white" />
    </header>
  );
}

/** Footer strip with tagline for printed docs. */
export function PrintFooter({ note }: { note?: string }) {
  return (
    <footer className="absolute inset-x-[16mm] bottom-[8mm] flex items-center justify-between border-t border-graphite/20 pt-2 text-[8px] uppercase tracking-[0.2em] text-blueprint">
      <span>Precision · Learning · Innovation · Automation</span>
      <span>{note ?? "JOVE — Journey of Visionation & Excellence"}</span>
    </footer>
  );
}
