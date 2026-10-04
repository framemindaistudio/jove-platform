import { BatteryLow, Camera, ShieldCheck, Users } from "lucide-react";
import { gradeBands, joveDayRules } from "@/lib/content/business";
import { CornerMarks } from "@/components/brand/Blueprint";
import { Reveal } from "@/components/site/Reveal";
import { cn, pad2 } from "@/lib/utils";
import { shortGrades } from "./data";

/* ── Curriculum alignment ─────────────────────────────────────────────── */

const frameworks = [
  {
    code: "NEP",
    title: "NEP 2020",
    sub: "National Education Policy",
    points: [
      "Experiential, hands-on learning — every student builds and tests something real",
      "Play- and toy-based discovery for the foundational years",
      "Coding and computational thinking introduced early, as NEP recommends",
      "Teamwork, problem-solving and communication at every station",
    ],
  },
  {
    code: "BRD",
    title: "CBSE · ICSE · State Boards",
    sub: "Science & computer outcomes",
    points: [
      "Science: electricity and simple circuits, light, motion, energy and sensing",
      "Computing: algorithms, sequencing, block and text coding",
      "Grades 9–10: complements AI and computer-applications coursework with real models",
      "Mapped grade by grade, so it supports the syllabus rather than repeating it",
    ],
  },
  {
    code: "ATL",
    title: "Atal Tinkering Labs",
    sub: "ATL framework",
    points: [
      "Uses the same building blocks: electronics, sensors, microcontrollers and robotics",
      "A strong warm-up for schools with an ATL — students arrive knowing the tools",
      "A practical first step for schools still planning a lab",
      "Projects end in a showcase, in the ATL spirit of making and sharing",
    ],
  },
];

/** NEP 2020, boards and ATL — phrased as alignment, never as endorsement. */
export function CurriculumAlignment() {
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-3">
        {frameworks.map((f, i) => (
          <Reveal key={f.code} delay={i * 0.08} className="h-full">
            <article className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 p-6 shadow-[var(--shadow-paper)] sm:p-7">
              <div aria-hidden className="bp-grid-fine absolute inset-0 opacity-50" />
              <CornerMarks className="m-3 text-graphite/35" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-14 place-items-center rounded-full border border-graphite/30 font-mono text-xs tracking-[0.14em] text-graphite">{f.code}</span>
                  <span className="font-mono text-[11px] text-blueprint">{pad2(i + 1)}</span>
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-tight text-graphite">{f.title}</h3>
                <p className="annot mt-1 text-blueprint">{f.sub}</p>
                <ul className="mt-5 space-y-3">
                  {f.points.map((p) => (
                    <li key={p} className="flex gap-3 text-sm leading-relaxed text-charcoal">
                      <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-graphite/60" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[var(--radius-md)] border border-dashed border-graphite/25 px-5 py-4">
          <span className="annot text-blueprint">Grade groups</span>
          {gradeBands.map((b) => (
            <a key={b.id} href={`#${b.id}`} className="text-sm font-semibold text-graphite underline-offset-4 hover:underline">
              {shortGrades(b)} · {b.name}
            </a>
          ))}
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-blueprint">
          JOVE is an independent programme. References to NEP 2020, CBSE, CISCE, State Boards and the Atal Tinkering Lab framework describe how our sessions support their stated learning goals — they do not imply affiliation with or endorsement by any of these bodies.
        </p>
      </Reveal>
    </div>
  );
}

/* ── Safety ───────────────────────────────────────────────────────────── */

const RATIO = 60;
const team = joveDayRules.teamSize;

const safety = [
  { icon: BatteryLow, title: "Low-voltage kits", detail: "Every build runs on battery packs or 5 V USB power — students never handle mains wiring. Tools are checked and counted in and out." },
  { icon: ShieldCheck, title: "Verified trainers", detail: "Every JOVE trainer is background-verified, trained on our safety SOP and child-protection policy, and works under a founder's supervision." },
  { icon: Users, title: `1 trainer : ~${RATIO} students`, detail: `Plus a school teacher in every batch. On a JOVE Day the team on site is ${team.founders} founders, ${team.trainers} trainers and ${team.media} media lead.` },
  { icon: Camera, title: "Consent-first filming", detail: "Photo and drone shots only with the school's permission and under local drone rules. Consent forms are collected and faces are blurred on request." },
];

/** Safety promises + a ratio figure drawn as a station plan: one trainer, ~60 students, one teacher. */
export function SafetyPanel() {
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
        {safety.map(({ icon: Icon, title, detail }, i) => (
          <Reveal key={title} delay={i * 0.07} className="h-full">
            <div className="relative h-full rounded-[var(--radius-md)] border border-paper/15 bg-paper/[0.04] p-5">
              <span className="grid size-10 place-items-center rounded-[var(--radius-sm)] border border-paper/20 bg-paper/5">
                <Icon className="size-[18px] text-paper" strokeWidth={1.6} aria-hidden />
              </span>
              <p className="mt-4 text-base font-semibold text-paper">{title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-paper/65">{detail}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.15} className="lg:col-span-5">
        <figure className="relative rounded-[var(--radius-lg)] border border-paper/15 bg-ink/40 p-6 shadow-[var(--shadow-lift)] sm:p-8">
          <CornerMarks className="m-3 text-paper/35" />
          <div className="flex items-baseline justify-between">
            <span className="annot text-paper/55">Fig. — Supervision ratio</span>
            <span className="font-mono text-3xl font-medium tracking-tight text-paper">1 : {RATIO}</span>
          </div>
          <div aria-hidden className="mt-6 grid grid-cols-10 gap-2">
            {Array.from({ length: RATIO }, (_, i) => (
              <span key={i} className="aspect-square rounded-full border border-paper/35" />
            ))}
          </div>
          <div aria-hidden className="mt-5 flex items-center gap-6 border-t border-dashed border-paper/20 pt-5">
            <span className="flex items-center gap-2 text-xs text-paper/75">
              <span className="size-4 rounded-full bg-paper" /> JOVE trainer
            </span>
            <span className="flex items-center gap-2 text-xs text-paper/75">
              <span className="hatch-light size-4 rounded-full border border-paper/70" /> School teacher
            </span>
            <span className="flex items-center gap-2 text-xs text-paper/75">
              <span className="size-4 rounded-full border border-paper/35" /> Student
            </span>
          </div>
          <figcaption className={cn("mt-4 text-xs leading-relaxed text-paper/55")}>
            About {RATIO} students per JOVE trainer, with a school teacher in every batch for class management. Larger grade groups run as extra batches.
          </figcaption>
        </figure>
      </Reveal>
    </div>
  );
}
