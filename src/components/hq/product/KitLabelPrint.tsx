"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PrintShell, A4Page } from "@/components/print/PrintShell";
import { kits } from "@/lib/content/business";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { DocMessage, QrImage, useQr } from "./controls";
import { getKit, kitSlug } from "./lib";

const BACK = "/hq/kits";
const PER_SHEET = 8;

export function KitLabelPrint({ kitId }: { kitId: string }) {
  const kit = getKit(kitId);
  if (!kit) return <DocMessage title="Kit box labels" back={BACK} state="missing" noun="kit" backLabel="Back to Kits & BOM" />;
  return <Sheet kit={kit} />;
}

function Sheet({ kit }: { kit: NonNullable<ReturnType<typeof getKit>> }) {
  const [countText, setCountText] = useState(String(PER_SHEET));
  const count = Math.min(80, Math.max(1, Math.floor(Number(countText)) || 1));
  const url = `${site.url.replace(/\/$/, "")}/shop/${kitSlug(kit.id)}`;
  const qr = useQr(url, 280);
  const pages = Array.from({ length: Math.ceil(count / PER_SHEET) }, (_, p) => Math.min(PER_SHEET, count - p * PER_SHEET));

  return (
    <PrintShell
      title={`Kit box labels — ${kit.name}`}
      back={BACK}
      toolbar={
        <>
          <nav aria-label="Choose kit" className="flex flex-wrap items-center gap-1">
            {kits.map((k) => (
              <Link
                key={k.id}
                href={`/hq/print/kit-label/${k.id}`}
                aria-current={k.id === kit.id ? "page" : undefined}
                className={cn("inline-flex h-8 items-center rounded px-2.5 text-xs font-semibold", k.id === kit.id ? "bg-graphite text-paper" : "hover:bg-graphite/5")}
              >
                {k.name.replace("JOVE ", "").replace(" Kit", "")}
              </Link>
            ))}
          </nav>
          <label className="flex items-center gap-2 text-xs font-semibold">
            Labels
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={80}
              value={countText}
              onChange={(e) => setCountText(e.target.value)}
              className="tabular h-8 w-16 rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 px-2 text-sm outline-none focus:border-graphite"
            />
          </label>
        </>
      }
    >
      <p className="no-print w-full max-w-[210mm] text-xs text-charcoal">
        {PER_SHEET} labels per A4 sheet (98 × 69 mm cells — fits standard 8-up sticker sheets). Print at 100% scale with margins set to “None”. The QR links to <span className="font-mono">{url}</span>.
      </p>
      {pages.map((n, p) => (
        <A4Page key={p} padded={false} className="px-[7mm] py-[10mm]">
          <div className="grid grid-cols-2 content-start">
            {Array.from({ length: n }, (_, i) => (
              <Label key={i} kit={kit} qr={qr} url={url} />
            ))}
          </div>
        </A4Page>
      ))}
    </PrintShell>
  );
}

function Label({ kit, qr, url }: { kit: NonNullable<ReturnType<typeof getKit>>; qr: string; url: string }) {
  return (
    <div className="relative flex h-[69mm] w-[98mm] break-inside-avoid flex-col overflow-hidden border border-dashed border-graphite/30 p-[3.5mm]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Image src="/brand/jove-wordmark.png" alt="JOVE" width={1400} height={669} sizes="96px" className="h-auto w-[24mm]" />
          <p className="mt-1.5 text-[13px] font-bold leading-tight tracking-tight">{kit.name}</p>
          <p className="mt-0.5 font-mono text-[7.5px] uppercase tracking-wider text-charcoal">
            {kit.sku} · {kit.grades}
          </p>
        </div>
        <div className="shrink-0 text-center">
          <QrImage src={qr} size={64} alt={`QR code linking to ${url}`} />
          <p className="mt-0.5 text-[5.5px] uppercase tracking-wider text-charcoal">Scan for kit page</p>
        </div>
      </div>
      <p className="mt-1.5 text-[8px] font-semibold leading-tight">{kit.project}</p>
      <p className="mt-1.5 text-[6.5px] font-semibold uppercase tracking-[0.2em] text-blueprint">In the box</p>
      <ul className="mt-0.5 columns-2 gap-3 text-[7px] leading-[1.35]">
        {kit.inTheBox.map((item) => (
          <li key={item} className="flex break-inside-avoid gap-1">
            <span aria-hidden className="mt-[1px] inline-block size-[6px] shrink-0 border border-graphite" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-1 text-[6.5px] tracking-wide text-blueprint">{url.replace(/^https?:\/\//, "")}</p>
    </div>
  );
}
