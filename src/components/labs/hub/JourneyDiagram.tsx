import { Award, BookOpen, CirclePlay, Hand, Trophy } from "lucide-react";
import { labStages } from "@/lib/content/labs";
import { CornerMarks, SectionLabel } from "@/components/brand/Blueprint";
import { Reveal, RevealLines } from "@/components/site/Reveal";

const ICONS = { theory: BookOpen, demo: CirclePlay, "hands-on": Hand, challenge: Trophy } as const;
const DETAIL: Record<string, string> = {
  theory: "Blueprint sketches and real-life examples explain the big idea in a few minutes.",
  demo: "An animated run shows the idea working — step by step, pause and replay any time.",
  "hands-on": "Drive the simulation yourself: code, wire, tune and test until it works.",
  challenge: "Harder missions plus a short quiz. Score 60% or more to finish the lab.",
};

/** The 4-stage lab journey (+ certificate), drawn as an engineering flow on a graphite sheet. */
export function JourneyDiagram() {
  return (
    <section className="relative overflow-hidden bg-graphite py-20 text-paper sm:py-28" aria-labelledby="journey-title">
      <div className="bp-grid-dark absolute inset-0 opacity-80" />
      <div className="hatch-light pointer-events-none absolute -right-32 top-0 h-full w-1/2 opacity-40 [mask-image:linear-gradient(to_left,black,transparent)]" />
      <div className="container-bp relative">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Reveal>
              <SectionLabel index="01" light>
                The journey
              </SectionLabel>
            </Reveal>
            <h2 id="journey-title" className="mt-6 text-[clamp(2rem,4.6vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.03em]">
              <RevealLines lines={["Every lab is a", "four-stage journey."]} />
            </h2>
          </div>
          <Reveal delay={0.15} className="lg:col-span-5">
            <p className="text-base leading-relaxed text-paper/70">
              The same rhythm we use in a JOVE classroom: understand it, see it, do it, prove it. Each lab takes about 15–20 minutes and saves progress in your browser, so students can stop and pick up again after school.
            </p>
          </Reveal>
        </div>

        <ol className="relative mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-5 lg:gap-0">
          {/* connector (desktop) */}
          <span aria-hidden className="absolute left-[10%] right-[10%] top-[38px] hidden border-t border-dashed border-paper/30 lg:block" />
          {labStages.map((s, i) => {
            const Icon = ICONS[s.id];
            return (
              <Reveal as="li" key={s.id} delay={0.08 * i} className="relative lg:px-3">
                <div className="relative h-full rounded-[var(--radius-md)] border border-paper/15 bg-graphite/80 p-5 backdrop-blur-sm lg:bg-transparent lg:p-0 lg:border-0 lg:backdrop-blur-none">
                  <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                    <span className="relative grid size-[76px] shrink-0 place-items-center rounded-full border border-paper/35 bg-graphite">
                      <span className="absolute inset-[6px] rounded-full border border-dashed border-paper/20" />
                      <Icon className="size-7" strokeWidth={1.6} aria-hidden />
                    </span>
                    <div className="lg:mt-5">
                      <p className="font-mono text-xs text-paper/50">{s.index}</p>
                      <p className="text-xl font-bold">{s.label}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-paper/65">{DETAIL[s.id] ?? s.blurb}</p>
                </div>
              </Reveal>
            );
          })}
          <Reveal as="li" delay={0.34} className="relative lg:px-3">
            <div className="relative h-full rounded-[var(--radius-md)] bg-paper p-5 text-graphite shadow-[var(--shadow-lift)]">
              <CornerMarks size={8} />
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-graphite text-paper">
                  <Award className="size-6" strokeWidth={1.6} aria-hidden />
                </span>
                <div>
                  <p className="font-mono text-xs text-blueprint">✓</p>
                  <p className="text-lg font-bold leading-tight">Certificate</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-charcoal">Pass the challenge and print a JOVE Virtual Lab certificate with your name on it.</p>
            </div>
          </Reveal>
        </ol>
      </div>
    </section>
  );
}
