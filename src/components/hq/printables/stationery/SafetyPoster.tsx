"use client";

import { BatteryWarning, Ear, Footprints, Hand, Shirt, Users, Wrench, Zap, type LucideIcon } from "lucide-react";
import { PrintShell } from "@/components/print/PrintShell";
import { CornerMarks } from "@/components/brand/Blueprint";
import { Annot, Mark, Sheet, SheetFooter, WriteLine, Wordmark } from "../PrintBits";
import { clampInt, type Q } from "../util";

const RULES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Ear, title: "Listen first", text: "Hear the trainer's instructions before you touch any parts." },
  { icon: Zap, title: "Power last", text: "Switch on only after your trainer has checked your circuit." },
  { icon: BatteryWarning, title: "Batteries with care", text: "Never force, bend or join the wrong ends. Tell us if one feels warm." },
  { icon: Wrench, title: "Tools the safe way", text: "Point tools down, use one at a time and pass them handle-first." },
  { icon: Hand, title: "Fingers clear", text: "Wheels and arms move. Switch the robot off before you touch it." },
  { icon: Shirt, title: "Tie it back", text: "Tie long hair, tuck loose cords, ties and dupattas away from motors." },
  { icon: Footprints, title: "Walk, never run", text: "Bags under the table. Keep walkways and the arena clear." },
  { icon: Users, title: "Ask for help", text: "Hurt, stuck or unsure? Raise your hand. No question is silly." },
];

function Poster({ q }: { q: Q }) {
  return (
    <Sheet className="flex flex-col px-[16mm] pb-[9mm] pt-[13mm]">
      <Mark mm={150} className="pointer-events-none absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 opacity-[0.035]" />
      <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-25" aria-hidden />

      <header className="relative flex items-start justify-between gap-6 border-b-2 border-graphite pb-[4mm]">
        <Wordmark mm={40} />
        <Annot className="text-right text-[6.6pt]">
          Workshop room
          <br />
          {q.school ? q.school : "Safety first"}
        </Annot>
      </header>

      <div className="relative mt-[8mm]">
        <p className="font-mono text-[8pt] uppercase tracking-[0.3em] text-blueprint">Read together before we build</p>
        <h1 className="mt-[1.6mm] text-[34pt] font-bold leading-[1] tracking-[-0.035em]">
          Workshop
          <br />
          safety rules
        </h1>
      </div>

      <ol className="relative mt-[8mm] grid flex-1 grid-cols-2 content-start gap-x-[7mm] gap-y-[6mm]">
        {RULES.map((r, i) => (
          <li key={r.title} className="relative border border-graphite/45 bg-white/90 px-[5mm] py-[4.2mm]">
            <CornerMarks size={7} />
            <div className="flex items-center justify-between">
              <span className="grid size-[12mm] place-items-center rounded-full border border-graphite">
                <r.icon className="size-[6mm]" strokeWidth={1.5} aria-hidden />
              </span>
              <span className="font-mono text-[9pt] tracking-[0.2em] text-blueprint">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h2 className="mt-[3mm] text-[13pt] font-bold tracking-[-0.02em]">{r.title}</h2>
            <p className="mt-[1mm] text-[9pt] leading-snug text-charcoal">{r.text}</p>
          </li>
        ))}
      </ol>

      <section className="relative mt-[7mm] bg-graphite px-[6mm] py-[5mm] text-paper">
        <p className="text-[12pt] font-bold tracking-[-0.01em]">If anything feels unsafe: stop, step back, raise your hand.</p>
        <p className="mt-[1mm] text-[8pt] text-paper/75">No food or drink at the building tables. Water bottles stay on the floor, away from the electronics.</p>
      </section>

      <div className="relative mt-[5mm] grid grid-cols-2 gap-x-[8mm]">
        <WriteLine label="Lead trainer" />
        <WriteLine label="School coordinator" />
      </div>
      <SheetFooter className="relative mt-[5mm]" />
    </Sheet>
  );
}

export function SafetyPoster({ q }: { q: Q }) {
  const copies = clampInt(q.pages, 1, 20, 1);
  return (
    <PrintShell title="Workshop room safety rules poster" back="/hq/printables" toolbar={<span className="text-xs text-blueprint">{copies} cop{copies === 1 ? "y" : "ies"} · A4 portrait</span>}>
      {Array.from({ length: copies }, (_, i) => (
        <Poster key={i} q={q} />
      ))}
    </PrintShell>
  );
}
