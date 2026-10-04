"use client";

import { PrintShell } from "@/components/print/PrintShell";
import { Annot, Sheet, Smiley, TickBox, Tile, WriteLine, Wordmark } from "../PrintBits";
import { chunk, clampInt, longDate, type Q } from "../util";

const SMILEY_QS = ["I liked building my robot.", "I learned something new today.", "My trainer helped me when I was stuck.", "I want another JOVE Day!"];
const SHORT_QS = ["The workshop was interesting.", "The trainer explained things clearly.", "I got enough hands-on time.", "The difficulty was right for me.", "Overall experience."];

function SmileyCard({ school, date }: { school: string; date: string }) {
  return (
    <Tile w={105} h={148.3} className="flex flex-col px-[7mm] pb-[5mm] pt-[6mm]">
      <header className="flex items-start justify-between gap-3">
        <Wordmark mm={20} />
        <Annot className="text-right">{[school, date].filter(Boolean).join(" · ") || "JOVE Day"}</Annot>
      </header>
      <h2 className="mt-[3mm] text-[12pt] font-bold leading-tight tracking-[-0.02em]">How was your JOVE Day?</h2>
      <p className="text-[7pt] text-charcoal">Circle the face that is like you. There are no wrong answers.</p>

      <ol className="mt-[3mm] space-y-[2.6mm]">
        {SMILEY_QS.map((t, i) => (
          <li key={t}>
            <p className="text-[8pt] font-semibold leading-tight">
              <span className="mr-1 font-mono text-blueprint">{i + 1}.</span>
              {t}
            </p>
            <div className="mt-[0.8mm] flex items-center justify-between px-[1mm] text-graphite">
              {([1, 2, 3, 4, 5] as const).map((l) => (
                <Smiley key={l} level={l} size={9} />
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-[2.6mm]">
        <p className="text-[8pt] font-semibold">My favourite part was… (write or draw)</p>
        <div className="mt-[1mm] h-[19mm] rounded-[1mm] border border-dotted border-graphite/60" />
      </div>

      <div className="mt-auto grid grid-cols-[1.6fr_1fr] gap-x-[4mm] pt-[2mm]">
        <WriteLine label="My name (optional)" />
        <WriteLine label="Class" />
      </div>
    </Tile>
  );
}

function RatingRow({ label, n }: { label: string; n: number }) {
  return (
    <tr className="border-b border-graphite/15">
      <td className="py-[1.3mm] pr-2 text-[8pt]">
        <span className="mr-1 font-mono text-blueprint">{n}.</span>
        {label}
      </td>
      {[1, 2, 3, 4, 5].map((v) => (
        <td key={v} className="w-[9mm] py-[1.3mm] text-center">
          <span className="inline-grid place-items-center rounded-full border-solid border-graphite font-mono text-[6.5pt] font-semibold" style={{ width: "5.2mm", height: "5.2mm", borderWidth: "0.3mm" }}>
            {v}
          </span>
        </td>
      ))}
    </tr>
  );
}

function ShortCard({ school, date }: { school: string; date: string }) {
  return (
    <Tile w={210} h={148.3} className="flex flex-col px-[12mm] pb-[5mm] pt-[7mm]">
      <header className="flex items-start justify-between gap-6">
        <Wordmark mm={25} />
        <div className="text-right">
          <h2 className="text-[12.5pt] font-bold leading-tight tracking-[-0.02em]">JOVE Day: student feedback</h2>
          <Annot>{[school, date].filter(Boolean).join(" · ") || "Grades 6–10 · takes 2 minutes"}</Annot>
        </div>
      </header>

      <div className="mt-[3mm] grid grid-cols-[1.25fr_1fr] gap-x-[8mm]">
        <div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="pb-[1mm] text-left text-[5.8pt] font-semibold uppercase tracking-[0.14em] text-blueprint">Rate 1 (poor) to 5 (excellent)</th>
                {[1, 2, 3, 4, 5].map((v) => (
                  <th key={v} className="w-[9mm] pb-[1mm] text-center font-mono text-[6pt] text-blueprint">
                    {v}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHORT_QS.map((t, i) => (
                <RatingRow key={t} label={t} n={i + 1} />
              ))}
            </tbody>
          </table>
          <p className="mt-[2.4mm] text-[8pt]">
            I would recommend JOVE Day to a friend: <TickBox mm={3.2} className="ml-1" /> Yes <TickBox mm={3.2} className="ml-2" /> Maybe <TickBox mm={3.2} className="ml-2" /> No
          </p>
        </div>

        <div className="space-y-[3mm]">
          <WriteLine label="The most useful thing I learned" valueClassName="min-h-[10mm]" />
          <WriteLine label="One thing JOVE should improve" valueClassName="min-h-[10mm]" />
          <div>
            <Annot>I want to learn more about</Annot>
            <p className="mt-[1mm] grid grid-cols-2 gap-x-2 gap-y-[1mm] text-[7.4pt]">
              {["Robotics", "AI & machine learning", "Coding", "Electronics", "Film-making & media"].map((t) => (
                <span key={t} className="flex items-center gap-1">
                  <TickBox mm={3} /> {t}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-[1.4fr_0.6fr_1.4fr] items-end gap-x-[6mm]">
        <WriteLine label="Name (optional)" />
        <WriteLine label="Class" />
        <p className="pb-[1mm] text-right text-[6pt] uppercase tracking-[0.18em] text-blueprint">Thank you. We read every form.</p>
      </div>
    </Tile>
  );
}

export function StudentFeedback({ q }: { q: Q }) {
  const smiley = q.version !== "short";
  const school = q.school ?? "";
  const date = longDate(q.date);
  const perSheet = smiley ? 4 : 2;
  const sheets = clampInt(q.pages, 1, 60, 1);
  const cards = Array.from({ length: sheets * perSheet });

  return (
    <PrintShell
      title={smiley ? "Student feedback — smiley form (Grades 1–5)" : "Student feedback — short form (Grades 6–10)"}
      back="/hq/printables"
      toolbar={<span className="text-xs text-blueprint">{cards.length} forms · {perSheet} per A4</span>}
    >
      {chunk(cards, perSheet).map((group, i) => (
        <Sheet key={i} className={smiley ? "grid grid-cols-2 content-start justify-center" : "flex flex-col"}>
          {group.map((_, j) => (smiley ? <SmileyCard key={j} school={school} date={date} /> : <ShortCard key={j} school={school} date={date} />))}
        </Sheet>
      ))}
    </PrintShell>
  );
}
