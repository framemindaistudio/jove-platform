"use client";

import { PrintShell } from "@/components/print/PrintShell";
import { useSettings } from "@/components/hq/data";
import { Annot, Sheet, TickBox, WriteLine, Wordmark } from "../PrintBits";
import { chunk, clampInt, longDate, textLines, type Q } from "../util";

const CHOICES = [
  { label: "Photographs", detail: "Photos of my child taking part in the workshop." },
  { label: "Video", detail: "Video clips of my child, and the full-day film." },
  { label: "Drone (aerial) footage", detail: "Shots from the air, taken at a distance; students appear small." },
  { label: "Social media & website", detail: "Selected moments posted publicly by JOVE and the school." },
];

function Slip({ school, date, student, email, last }: { school: string; date: string; student: string; email: string; last: boolean }) {
  return (
    <section className={`relative flex h-1/2 flex-col px-[12mm] pb-[4mm] pt-[7mm] ${last ? "" : "border-b border-dashed border-graphite/40"}`} aria-label="Consent slip">
      {!last && <span className="absolute -bottom-[2.1mm] left-1/2 -translate-x-1/2 bg-white px-2 text-[6pt] tracking-[0.3em] text-blueprint">✂ CUT HERE</span>}
      <header className="flex items-start justify-between gap-6">
        <Wordmark mm={25} />
        <div className="text-right">
          <h2 className="text-[12.5pt] font-bold leading-tight tracking-[-0.02em]">Photo, Video &amp; Drone Consent</h2>
          <p className="mt-[0.8mm] text-[7pt] font-semibold text-charcoal">
            JOVE Day{school ? ` · ${school}` : ""}
            {date ? ` · ${date}` : ""}
          </p>
        </div>
      </header>

      <p className="mt-[3mm] text-[7.2pt] leading-[1.4] text-charcoal">
        On the JOVE Day, JOVE&apos;s in-house film studio (FrameMind AI Studio) will photograph and film the workshop to make the school&apos;s free Media Pack: reels, a full-day film and drone shots. With your permission we may also share
        selected moments publicly. <strong className="text-graphite">Tick only what you are comfortable with. Anything left unticked means NO</strong>, and your child will still take part fully; we will keep them out of that footage.
      </p>

      <div className="mt-[2.4mm]">
        <Annot>I am the parent / legal guardian of the student below and I consent to</Annot>
        <ul className="mt-[1.4mm] grid grid-cols-2 gap-x-[6mm] gap-y-[1.8mm]">
          {CHOICES.map((c) => (
            <li key={c.label} className="flex items-start gap-[2mm]">
              <TickBox mm={4} className="mt-[0.3mm]" />
              <span className="text-[7.4pt] leading-[1.25]">
                <strong>{c.label}</strong>
                <span className="block text-[6.6pt] text-charcoal">{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-[3.2mm] grid grid-cols-[1.5fr_1fr_0.8fr] gap-x-[5mm] gap-y-[2.2mm]">
        <WriteLine label="Student name" value={student} />
        <WriteLine label="Class & section" />
        <WriteLine label="Roll no." />
        <WriteLine label="Parent / guardian name" />
        <WriteLine label="Relationship" />
        <WriteLine label="Phone" />
      </div>

      <div className="mt-[3.4mm] grid grid-cols-[1.5fr_0.8fr] gap-x-[5mm]">
        <WriteLine label="Parent / guardian signature" valueClassName="min-h-[8mm]" />
        <WriteLine label="Date" valueClassName="min-h-[8mm]" />
      </div>

      <p className="mt-auto pt-[1.6mm] text-[5.6pt] leading-[1.35] text-blueprint">
        You may withdraw this consent at any time by writing to {email || "the school office"}; JOVE will stop using your child&apos;s images in new material and remove them from channels it controls. Media is used only for the purposes ticked
        above. This form records a parent&apos;s consent; India&apos;s DPDP Act, 2023 treats anyone under 18 as a child. Schools should have their legal adviser review this template before first use.
      </p>
    </section>
  );
}

export function ConsentForm({ q }: { q: Q }) {
  const { settings } = useSettings();
  const names = textLines(q.names);
  const slips = names.length ? names : Array.from({ length: clampInt(q.pages, 1, 40, 1) * 2 }, () => "");
  const sheets = chunk(slips, 2);
  const date = longDate(q.date);

  return (
    <PrintShell title="Photo, video & drone consent forms" back="/hq/printables" toolbar={<span className="text-xs text-blueprint">{slips.length} slips · {sheets.length} sheet{sheets.length === 1 ? "" : "s"} · 2 per A4</span>}>
      {sheets.map((pair, i) => (
        <Sheet key={i}>
          {pair.map((student, j) => (
            <Slip key={j} school={q.school ?? ""} date={date} student={student} email={settings.email} last={j === 1 || j === pair.length - 1} />
          ))}
        </Sheet>
      ))}
    </PrintShell>
  );
}
