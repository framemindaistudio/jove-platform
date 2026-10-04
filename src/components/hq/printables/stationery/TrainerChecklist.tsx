"use client";

import { PrintShell } from "@/components/print/PrintShell";
import { joveDayRules, joveDaySchedule } from "@/lib/content/business";
import { Annot, Sheet, TickBox, Tile, WriteLine, Wordmark } from "../PrintBits";
import { chunk, clampInt, longDate, type Q } from "../util";

const at = (prefix: string) => joveDaySchedule.find((s) => s.title.startsWith(prefix));
const arrival = at("Team arrival");
const opening = at("Opening");
const lunch = at("Lunch");
const showcase = at("Showcase");
const interview = at("Principal");

const SECTIONS: { title: string; sub: string; items: string[] }[] = [
  {
    title: "Before you leave",
    sub: "Night before / at base",
    items: [
      "Kits counted against the batch list",
      "Batteries charged, spares packed",
      "Tool box and spare-parts bag",
      "Laptops charged, software tested",
      "Banners, arena mats, projector, extension boards",
      "Media rig cards formatted, power banks charged",
      "Drone batteries and permission confirmed",
      "Consent, attendance and feedback forms printed",
      "Certificates and name tags packed",
      "ID cards on, vehicle fuelled",
    ],
  },
  {
    title: "On site",
    sub: arrival ? `Report ${arrival.time} · opening show ${opening?.time ?? ""}` : "Arrival & setup",
    items: [
      "Meet the school coordinator, confirm halls and power",
      "Safety rules poster up in each hall",
      "Stations and table tents set out",
      "One kit per grade band tested end to end",
      "Media rig and drone pre-flight checks done",
      "Team briefed: roles, timings, safety",
      "Consent slips checked before filming starts",
      "Opening robot and drone show ready",
    ],
  },
  {
    title: "During & after",
    sub: lunch ? `Lunch reset ${lunch.time} · showcase ${showcase?.time ?? ""}` : "Sessions & wrap-up",
    items: [
      "Attendance taken in every session",
      "Lunch: cells swapped, consumables refilled",
      "Footage backed up at lunch",
      "Showcase and certificate ceremony run",
      `Principal interview ${interview ? `(${interview.time})` : ""}`.trim(),
      "Feedback forms collected",
      "Kit check-in count matches check-out",
      "Footage backed up twice before leaving",
      `Balance invoice reminder (due in ${joveDayRules.balanceDueDays} days)`,
    ],
  },
];

function Card({ q }: { q: Q }) {
  return (
    <Tile w={210} h={148.3} cut={false} className="flex flex-col px-[10mm] pb-[5mm] pt-[6mm]">
      <header className="flex items-end justify-between gap-6 border-b-2 border-graphite pb-[2.4mm]">
        <div className="flex items-end gap-[5mm]">
          <Wordmark mm={26} />
          <h2 className="text-[13pt] font-bold leading-none tracking-[-0.02em]">Trainer day checklist</h2>
        </div>
        <Annot>JOVE Day · tick as you go</Annot>
      </header>
      <div className="mt-[2.6mm] grid grid-cols-[2fr_1fr_1.4fr] gap-x-[5mm]">
        <WriteLine label="School" value={q.school} />
        <WriteLine label="Date" value={longDate(q.date)} />
        <WriteLine label="Lead trainer" value={q.lead} />
      </div>
      <div className="mt-[3mm] grid flex-1 grid-cols-3 gap-x-[5mm]">
        {SECTIONS.map((s) => (
          <section key={s.title} className="min-w-0">
            <h3 className="text-[8.6pt] font-bold uppercase tracking-[0.1em]">{s.title}</h3>
            <p className="mb-[1.6mm] border-b border-graphite/30 pb-[1mm] font-mono text-[5.8pt] uppercase tracking-[0.12em] text-blueprint">{s.sub}</p>
            <ul className="space-y-[1.15mm]">
              {s.items.map((it) => (
                <li key={it} className="flex items-start gap-[1.6mm] text-[7pt] leading-[1.22]">
                  <TickBox mm={2.8} className="mt-[0.35mm]" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Tile>
  );
}

export function TrainerChecklist({ q }: { q: Q }) {
  const sheets = clampInt(q.pages, 1, 20, 1);
  const cards = Array.from({ length: sheets * 2 });
  return (
    <PrintShell title="Trainer day checklist card" back="/hq/printables" toolbar={<span className="text-xs text-blueprint">{cards.length} cards · 2 per A4 (one per trainer)</span>}>
      {chunk(cards, 2).map((pair, i) => (
        <Sheet key={i} className="flex flex-col">
          {pair.map((_, j) => (
            <Card key={j} q={q} />
          ))}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-graphite/40" />
          <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[5.6pt] uppercase tracking-[0.3em] text-blueprint">cut here</span>
        </Sheet>
      ))}
    </PrintShell>
  );
}
