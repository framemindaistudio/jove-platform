import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CornerMarks } from "@/components/brand/Blueprint";
import { Reveal } from "@/components/site/Reveal";
import { labStages, labs } from "@/lib/content/labs";
import { SectionHeading } from "./SectionHeading";
import { RAIL, RAIL_HINT, RAIL_ITEM } from "./rail";
import { LabArt } from "@/components/site/LabArt";

/** How a build on the 3D bench goes, drawn as a blueprint flow diagram. */
function JourneyDiagram() {
  return (
    <div className="relative mt-14 rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50/80 p-6 shadow-[var(--shadow-paper)] sm:p-8 lg:mt-16">
      <CornerMarks />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="annot text-blueprint">Fig. 05 — Every build on the 3D bench</p>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-charcoal">Same parts as our kits · free · no sign-up</p>
      </div>
      <ol className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:gap-0">
        {labStages.map((s, i) => (
          <Reveal as="li" key={s.id} delay={i * 0.1} className="relative lg:pr-10">
            <div className="flex items-center">
              <span className="relative grid size-12 shrink-0 place-items-center rounded-full border border-graphite bg-paper font-mono text-sm text-graphite">
                {s.index}
                <span aria-hidden className="absolute -inset-[5px] rounded-full border border-dashed border-graphite/25" />
              </span>
              {i < labStages.length - 1 && (
                <span aria-hidden className="relative ml-4 hidden h-px flex-1 bg-graphite/30 lg:block">
                  <span className="absolute -right-px -top-[3px] border-y-[3.5px] border-l-[6px] border-y-transparent border-l-graphite/50" />
                </span>
              )}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-graphite">{s.label}</h3>
            <p className="mt-1 text-sm leading-relaxed text-charcoal">{s.blurb}</p>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}

/** Virtual Labs teaser: the 3D bench steps and the free builds. */
export function LabsTeaser() {
  return (
    <section aria-labelledby="labs-title" className="relative overflow-hidden bg-paper py-24 sm:py-32">
      <div aria-hidden className="bp-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_top,#000_20%,transparent_70%)]" />
      <div className="container-bp relative">
        <SectionHeading
          id="labs-title"
          index="05"
          eyebrow="Virtual Labs · free"
          title={["Try the workshop", "before we arrive."]}
          intro="A free 3D bench with the same parts as our kits: wire a circuit pin by pin, switch on and see it work. No sign-up, no install. At home or on the classroom projector."
          action={
            <Button href="/labs" variant="secondary" arrow>
              Open the 3D bench
            </Button>
          }
        />

        <JourneyDiagram />

        <ul className={`mt-8 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 ${RAIL}`}>
          {labs.map((lab, i) => (
            <Reveal as="li" key={lab.slug} delay={(i % 3) * 0.08} className={RAIL_ITEM}>
              <Link
                href={`/labs#${lab.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)] transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden border-b border-graphite/10 bg-paper">
                  <LabArt lab={lab} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw" className="transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]" />
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <span className="bg-graphite px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-paper">{lab.topic}</span>
                    <span className="border border-graphite/20 bg-paper/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-graphite">{lab.level}</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-blueprint">
                    {lab.grades} · {lab.minutes} min
                  </p>
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-graphite">{lab.title}</h3>
                  <p className="text-sm font-medium text-charcoal">{lab.subtitle}</p>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-charcoal/90">{lab.summary}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-graphite">
                    Start free
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
        <p aria-hidden className={`${RAIL_HINT} text-blueprint`}>
          <span className="h-px w-6 bg-graphite/30" /> Swipe · {labs.length} free builds
        </p>
      </div>
    </section>
  );
}
