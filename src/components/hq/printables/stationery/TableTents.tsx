"use client";

import { PrintShell } from "@/components/print/PrintShell";
import { cn } from "@/lib/utils";
import { Annot, Mark, Sheet, Wordmark } from "../PrintBits";
import { chunk, clampInt, textLines, type Q } from "../util";

interface Tent {
  n: number;
  team: string;
}

/** One printed face of the tent. The top half is rotated 180° so both sides read upright once folded. */
function Face({ tent, label, flipped }: { tent: Tent; label: string; flipped?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden bg-white", flipped && "rotate-180")} style={{ width: "210mm", height: "74.15mm" }}>
      <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-35" aria-hidden />
      <Mark mm={46} className="pointer-events-none absolute -right-[6mm] top-[3mm] opacity-[0.06]" />
      <div className="absolute inset-x-[14mm] top-[8mm] flex items-start justify-between">
        <Annot className="text-[7pt]">{label}</Annot>
        <Wordmark mm={26} />
      </div>
      <div className="absolute inset-x-[14mm] bottom-[8mm] top-[18mm] flex items-center gap-[10mm]">
        <p className="font-mono text-[72pt] font-bold leading-none tracking-[-0.05em] tabular-nums">{String(tent.n).padStart(2, "0")}</p>
        <span className="h-[34mm] border-l border-dashed border-graphite/50" aria-hidden />
        <div className="min-w-0 flex-1">
          <Annot>Team</Annot>
          {tent.team ? (
            <p className="mt-[1.4mm] truncate text-[22pt] font-bold leading-tight tracking-[-0.02em]">{tent.team}</p>
          ) : (
            <div className="mt-[10mm] border-b border-dotted border-graphite/70" />
          )}
          <p className="mt-[4mm] text-[8pt] leading-snug text-charcoal">Stuck? Raise your hand and wait for your trainer. Switch the robot off before you touch it.</p>
        </div>
      </div>
    </div>
  );
}

function TentSheetItem({ tent, label }: { tent: Tent; label: string }) {
  return (
    <div className="relative flex flex-col" style={{ height: "148.3mm" }}>
      <Face tent={tent} label={label} flipped />
      <div className="relative z-10 flex items-center border-t border-dashed border-graphite/60">
        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[5.6pt] uppercase tracking-[0.3em] text-blueprint">fold here</span>
      </div>
      <Face tent={tent} label={label} />
    </div>
  );
}

export function TableTents({ q }: { q: Q }) {
  const names = textLines(q.names);
  const start = clampInt(q.from, 1, 999, 1);
  const count = names.length || clampInt(q.count, 1, 120, 10);
  const label = q.label?.trim() || "Station";
  const tents: Tent[] = Array.from({ length: count }, (_, i) => ({ n: start + i, team: names[i] ?? "" }));
  const sheets = chunk(tents, 2);

  return (
    <PrintShell title="Station table tents (folded A5)" back="/hq/printables" toolbar={<span className="text-xs text-blueprint">{count} tent{count === 1 ? "" : "s"} · 2 per A4 · cut in half, then fold on the dashed line</span>}>
      {sheets.map((pair, i) => (
        <Sheet key={i} className="flex flex-col">
          {pair.map((t) => (
            <TentSheetItem key={t.n} tent={t} label={label.toUpperCase()} />
          ))}
          {pair.length === 2 && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-graphite/40" />}
        </Sheet>
      ))}
    </PrintShell>
  );
}
