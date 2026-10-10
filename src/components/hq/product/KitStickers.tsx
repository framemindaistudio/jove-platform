"use client";

/**
 * Printable sticker set for the plain brown kit boxes (HQ → Printables → Kit box stickers, or Kits & BOM → Box stickers).
 *
 * The page is driven by its query string:
 *   kit     spark | explorer | builder | innovator   (default spark)
 *   count   boxes to dress, 1–60                      (default 4)
 *   show    all | lid | rounds | back                 (default all)
 *   batch   batch number, free text                   (empty prints a line to write on)
 *   packed  YYYY-MM                                   (default: this month)
 *   origin  country of origin, free text              (empty prints nothing)
 *
 * Printed on A4 self-adhesive paper at 100 % and cut out by hand along the dashed lines.
 */
import { useMemo } from "react";
import Link from "next/link";
import { PrintShell } from "@/components/print/PrintShell";
import { useSettings } from "@/components/hq/data";
import { useBrochureInfo, useQr } from "@/components/hq/printables/brochures/BrochureBits";
import { useThisMonth } from "@/components/hq/printables/hooks";
import { Notice, Sheet } from "@/components/hq/printables/PrintBits";
import { qs, type Q } from "@/components/hq/printables/util";
import { gradeBands, kits } from "@/lib/content/business";
import { cn } from "@/lib/utils";
import { kitSlug } from "./lib";
import { boxesOf, kitOf, layoutSheets, showOf, stickerSize } from "./stickers/layout";
import { BackLabel, GradeBadge, LidLabel, Seal, kitWords, type BackFacts } from "./stickers/Stickers";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** "2026-10" → "October 2026" ("" when it is not a month) */
function monthYear(ym: string) {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(ym.trim());
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : "";
}
/** free text from the address bar: one line, no runs of spaces, not longer than the label can hold */
const typed = (v: string | undefined, max: number) => (v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
/** one part of an address, without the comma or full stop someone typed at its end */
const part = (v: string | undefined) => (v ?? "").trim().replace(/[\s,.;]+$/, "");
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function KitStickers({ q }: { q: Q }) {
  const kit = kitOf(q.kit);
  const count = boxesOf(q.count);
  const show = showOf(q.show);
  const batch = typed(q.batch, 40);
  const origin = typed(q.origin, 40);
  const thisMonth = useThisMonth();
  const packed = monthYear(q.packed ?? "") || monthYear(thisMonth);

  const { settings, loading } = useSettings();
  const info = useBrochureInfo(q);
  const url = info.link(`/shop/${kitSlug(kit.id)}`);
  const qr = useQr(url);
  const band = gradeBands.find((b) => b.kitId === kit.id);

  // "Packed and marketed by": the legal name, and the address only when HQ → Settings has one (never an empty comma)
  const street = [part(settings.addressLine1), part(settings.addressLine2), part(settings.city)].filter(Boolean);
  const address = street.length ? [...street, [part(settings.state), part(settings.pincode)].filter(Boolean).join(" ")].filter(Boolean).join(", ") : "";
  const legalName = part(info.legalName);
  const care = [info.phone, info.email].map((v) => v.trim()).filter(Boolean);

  const facts: BackFacts = {
    packed,
    batch,
    origin,
    packer: address ? `${legalName}, ${address}` : legalName,
    care,
    qr,
    url: url.replace(/^https?:\/\//i, ""),
    withAdult: band?.id === "g1-2" || band?.id === "g3-5",
  };

  const sheets = useMemo(() => layoutSheets(kit, count, show), [kit, count, show]);
  // nothing is shown, so nothing can be printed, until the company details and the QR code are there
  const ready = !loading && info.ready && !!qr && !!packed;
  const lid = stickerSize("lid", kit);
  const hasBack = show === "all" || show === "back";
  const missing = [!address && "the company address", !care.length && "a customer care phone or email"].filter(Boolean).join(" and ");

  return (
    <PrintShell
      title={`Box stickers: ${kit.name}`}
      back={q.from === "kits" ? "/hq/kits" : "/hq/printables"}
      toolbar={
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
            <nav aria-label="Choose kit" className="flex flex-wrap items-center gap-1">
              {kits.map((k) => (
                <Link
                  key={k.id}
                  href={`/hq/print/kit-stickers${qs({ kit: k.id, count: q.count, show: q.show, batch: q.batch, packed: q.packed, origin: q.origin, from: q.from })}`}
                  aria-current={k.id === kit.id ? "page" : undefined}
                  className={cn("inline-flex h-8 items-center rounded px-2.5 text-xs font-semibold", k.id === kit.id ? "bg-graphite text-paper" : "hover:bg-graphite/5")}
                >
                  {kitWords(k).head}
                </Link>
              ))}
            </nav>
            <span className="text-xs font-semibold" data-sheets={sheets.length}>
              {plural(count, "box", "boxes")} · {plural(sheets.length, "A4 sheet")}
            </span>
          </div>
          <span className="text-xs text-blueprint">Print on A4 self-adhesive paper at 100% with margins set to None. Cut along the dashed lines.</span>
        </div>
      }
    >
      <div className="no-print w-full max-w-[210mm] space-y-1 text-xs leading-relaxed text-charcoal">
        <p>
          For a {kit.box.label} box. Lid label {lid.w} × {lid.h} mm, grade badge 50 mm, seal 36 mm, back label 145 × 89 mm. Stick the seal across the edge of the lid flap, half on the lid and half on the front.
        </p>
        {hasBack && info.ready && missing && (
          <p className="font-semibold text-bad">
            HQ → Settings has no {missing.replace(/^the company address/, "company address")}, so the back label prints without it. Add it in Settings before you print labels for boxes you will sell.
          </p>
        )}
        {hasBack && !origin && <p>Country of origin is not printed. Once it is confirmed, type it in the “Country of origin” field in Printables and print again.</p>}
      </div>

      {!ready && <Notice>Preparing the stickers…</Notice>}
      {ready && sheets.map((placed, i) => (
        <Sheet key={i}>
          {placed.map((p, j) => (
            <div key={j} className="absolute" style={{ left: `${p.x}mm`, top: `${p.y}mm` }}>
              {p.kind === "lid" ? <LidLabel kit={kit} image={band?.image} w={p.w} h={p.h} /> : p.kind === "back" ? <BackLabel kit={kit} facts={facts} /> : p.kind === "badge" ? <GradeBadge kit={kit} /> : <Seal />}
            </div>
          ))}
        </Sheet>
      ))}
    </PrintShell>
  );
}
