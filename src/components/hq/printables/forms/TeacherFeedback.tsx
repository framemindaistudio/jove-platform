"use client";

import { PrintShell } from "@/components/print/PrintShell";
import { useSettings } from "@/components/hq/data";
import { Annot, Sheet, SheetFooter, TickBox, WriteLine, Wordmark } from "../PrintBits";
import { clampInt, longDate, type Q } from "../util";

const AREAS = [
  "Planning, communication and punctuality of the JOVE team",
  "Quality and age-appropriateness of the workshop content",
  "How the trainers engaged and handled the students",
  "Hands-on time and how much the students built themselves",
  "Safety, discipline and care for school property",
  "The film crew: professional and not disruptive to learning",
  "Overall value of the JOVE Day for our school",
];

function Page({ school, date, email }: { school: string; date: string; email: string }) {
  return (
    <Sheet className="flex flex-col px-[16mm] pb-[9mm] pt-[13mm]">
      <header className="flex items-start justify-between gap-6 border-b-2 border-graphite pb-[3.5mm]">
        <Wordmark mm={38} />
        <div className="text-right">
          <h1 className="text-[17pt] font-bold leading-tight tracking-[-0.02em]">School feedback form</h1>
          <Annot>For principals &amp; teachers · takes 3 minutes</Annot>
        </div>
      </header>

      <div className="mt-[5mm] grid grid-cols-3 gap-x-[6mm] gap-y-[3.2mm]">
        <WriteLine label="School" value={school} className="col-span-2" />
        <WriteLine label="Workshop date" value={date} />
        <WriteLine label="Your name" />
        <WriteLine label="Designation" />
        <WriteLine label="Phone / email (optional)" />
      </div>

      <section className="mt-[6mm]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-graphite">
              <th className="pb-[1.4mm] text-left text-[6pt] font-semibold uppercase tracking-[0.16em] text-blueprint">Please rate each area · 1 = needs work · 5 = excellent</th>
              {[1, 2, 3, 4, 5].map((v) => (
                <th key={v} className="w-[11mm] pb-[1.4mm] text-center font-mono text-[7pt] text-charcoal">
                  {v}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AREAS.map((a, i) => (
              <tr key={a} className="border-b border-graphite/20">
                <td className="py-[2.1mm] pr-3 text-[9pt] leading-tight">
                  <span className="mr-1.5 font-mono text-blueprint">{String(i + 1).padStart(2, "0")}</span>
                  {a}
                </td>
                {[1, 2, 3, 4, 5].map((v) => (
                  <td key={v} className="text-center">
                    <span className="inline-block rounded-full border-solid border-graphite" style={{ width: "5.4mm", height: "5.4mm", borderWidth: "0.3mm" }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-[5mm] grid grid-cols-2 gap-x-[8mm] text-[9pt]">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold">Would you book JOVE again?</span>
          <span className="flex items-center gap-1"><TickBox mm={3.6} /> Yes</span>
          <span className="flex items-center gap-1"><TickBox mm={3.6} /> Maybe</span>
          <span className="flex items-center gap-1"><TickBox mm={3.6} /> No</span>
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold">Would you recommend us to another school?</span>
          <span className="flex items-center gap-1"><TickBox mm={3.6} /> Yes</span>
          <span className="flex items-center gap-1"><TickBox mm={3.6} /> No</span>
        </p>
      </section>

      <section className="mt-[5mm] space-y-[4.2mm]">
        <WriteLine label="What worked best on the day?" valueClassName="min-h-[14mm]" />
        <WriteLine label="What should we improve?" valueClassName="min-h-[14mm]" />
        <WriteLine label="Which topics or grades would you like next (robotics, AI, coding, Virtual Labs, a Club programme…)?" valueClassName="min-h-[9mm]" />
      </section>

      <section className="mt-[5mm] rounded-[1.2mm] border border-graphite/40 px-[4mm] py-[3mm]">
        <p className="flex items-start gap-[2.4mm] text-[8.2pt] leading-snug">
          <TickBox mm={4} className="mt-[0.4mm]" />
          <span>
            <strong>I am happy for JOVE to quote my comments</strong> above, with my name, designation and school, on its website and marketing material. I understand I can withdraw this at any time by writing to {email || "JOVE"}.
          </span>
        </p>
        <div className="mt-[3.2mm] grid grid-cols-[1.6fr_1fr] gap-x-[8mm]">
          <WriteLine label="Signature (only if you tick the box above)" valueClassName="min-h-[8mm]" />
          <WriteLine label="Date" valueClassName="min-h-[8mm]" />
        </div>
      </section>

      <SheetFooter className="mt-auto" right="Thank you for hosting us" />
    </Sheet>
  );
}

export function TeacherFeedback({ q }: { q: Q }) {
  const { settings } = useSettings();
  const copies = clampInt(q.pages, 1, 60, 1);
  return (
    <PrintShell title="School feedback form (principal / teacher)" back="/hq/printables" toolbar={<span className="text-xs text-blueprint">{copies} cop{copies === 1 ? "y" : "ies"} · 1 per A4</span>}>
      {Array.from({ length: copies }, (_, i) => (
        <Page key={i} school={q.school ?? ""} date={longDate(q.date)} email={settings.email} />
      ))}
    </PrintShell>
  );
}
