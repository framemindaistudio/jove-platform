"use client";

import Image from "next/image";
import { Camera } from "lucide-react";
import { PrintShell } from "@/components/print/PrintShell";
import { CornerMarks } from "@/components/brand/Blueprint";
import { gradeBands, joveDaySchedule, kits } from "@/lib/content/business";
import { Annot, Sheet, SheetFooter, Wordmark } from "../PrintBits";
import { clampInt, csv, plainDate, type Q } from "../util";

const slotFor = (name: string) => joveDaySchedule.find((s) => s.title === name);
const slotStarting = (prefix: string) => joveDaySchedule.find((s) => s.title.startsWith(prefix));

function Poster({ q }: { q: Q }) {
  const wanted = csv(q.bands);
  const bands = gradeBands.filter((b) => !wanted.length || wanted.includes(b.id));
  const school = q.school?.trim() || "our school";
  const date = plainDate(q.date);
  const opening = slotStarting("Opening");
  const showcase = slotStarting("Showcase");

  return (
    <Sheet className="flex flex-col">
      {/* dark hero band */}
      <div className="relative h-[100mm] shrink-0 overflow-hidden bg-graphite text-paper">
        <Image src="/images/studio/media-crew.webp" alt="" fill sizes="900px" loading="eager" className="object-cover opacity-30 grayscale" aria-hidden />
        <div className="bp-grid-dark absolute inset-0" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-graphite via-graphite/85 to-transparent" aria-hidden />
        <div className="relative flex h-full flex-col justify-between px-[16mm] pb-[10mm] pt-[12mm]">
          <div className="flex items-start justify-between">
            <Wordmark white mm={38} />
            <span className="text-[6.4pt] font-semibold uppercase tracking-[0.3em] text-paper/70">Robotics · AI · Machine Learning</span>
          </div>
          <div>
            <p className="font-mono text-[9pt] font-medium uppercase tracking-[0.28em] text-paper/75">JOVE Day{date ? ` · ${date}` : ""}</p>
            <h1 className="mt-[2.4mm] max-w-[150mm] text-[31pt] font-bold leading-[1.02] tracking-[-0.03em]">
              JOVE Day is coming to <span className="underline decoration-paper/50 decoration-[0.5mm] underline-offset-[2mm]">{school}</span>
            </h1>
            <p className="mt-[4mm] max-w-[120mm] text-[10pt] leading-snug text-paper/85">A full day of hands-on robotics, AI &amp; machine learning for Grades 1 to 10, with a real film crew capturing every build.</p>
          </div>
        </div>
      </div>

      {/* sessions */}
      <section className="px-[16mm] pt-[9mm]">
        <Annot>Your day · who builds what</Annot>
        <ul className="mt-[3mm] grid grid-cols-2 gap-[5mm]">
          {bands.map((b) => {
            const slot = slotFor(b.name);
            const kit = kits.find((k) => k.id === b.kitId);
            return (
              <li key={b.id} className="relative border border-graphite/45 bg-white px-[5mm] py-[4mm]">
                <CornerMarks size={7} />
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[7.4pt] font-semibold uppercase tracking-[0.14em] text-blueprint">{b.grades}</span>
                  {slot && (
                    <span className="font-mono text-[8pt] font-semibold tabular-nums">
                      {slot.time} – {slot.end}
                    </span>
                  )}
                </div>
                <h2 className="mt-[1.4mm] text-[13.5pt] font-bold leading-tight tracking-[-0.02em]">{b.name}</h2>
                <p className="text-[8pt] italic text-charcoal">{b.theme}</p>
                {kit && (
                  <p className="mt-[2.4mm] border-t border-dashed border-graphite/35 pt-[2mm] text-[8pt] leading-snug">
                    <span className="font-semibold">You will build:</span> {kit.project}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-[3mm] flex flex-wrap gap-x-6 gap-y-1 text-[8pt] text-charcoal">
          {opening && (
            <span>
              <strong className="font-mono text-graphite">{opening.time}</strong> · Opening robot &amp; drone show for the whole school
            </span>
          )}
          {showcase && (
            <span>
              <strong className="font-mono text-graphite">{showcase.time}</strong> · Showcase &amp; certificate ceremony
            </span>
          )}
        </p>
        <p className="mt-[1mm] text-[6.4pt] text-blueprint">Timings are indicative. Your school coordinator will confirm the final timetable for each class.</p>
      </section>

      {/* film crew */}
      <section className="hatch-light relative mx-[16mm] mt-[7mm] flex items-center gap-[5mm] border-y border-graphite/50 px-[5mm] py-[4.5mm]">
        <span className="grid size-[13mm] shrink-0 place-items-center rounded-full border border-graphite bg-white">
          <Camera className="size-[6mm]" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-[11pt] font-bold tracking-[-0.01em]">Lights, camera, robots!</p>
          <p className="mt-[0.6mm] text-[8.2pt] leading-snug text-charcoal">
            Our in-house film studio, FrameMind AI Studio, will be on site filming reels, a full-day film and drone shots for the school. Parents will receive a consent form first: <strong className="text-graphite">no consent, no camera</strong>.
          </p>
        </div>
      </section>

      <div className="mt-auto px-[16mm] pb-[8mm]">
        {q.note?.trim() && <p className="mb-[3mm] border-l-[1mm] border-graphite pl-[3mm] text-[9pt] font-semibold">{q.note.trim()}</p>}
        <SheetFooter left="Ask your class teacher or school coordinator if you have questions" />
      </div>
    </Sheet>
  );
}

export function WorkshopPoster({ q }: { q: Q }) {
  const copies = clampInt(q.pages, 1, 20, 1);
  return (
    <PrintShell title="Workshop announcement poster" back="/hq/printables" toolbar={<span className="text-xs text-blueprint">{copies} cop{copies === 1 ? "y" : "ies"} · A4 portrait</span>}>
      {Array.from({ length: copies }, (_, i) => (
        <Poster key={i} q={q} />
      ))}
    </PrintShell>
  );
}
