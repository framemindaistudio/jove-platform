import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock, Laptop, Package, Users } from "lucide-react";
import type { GradeBand } from "@/lib/content/business";
import { CornerMarks, GridBackdrop } from "@/components/brand/Blueprint";
import { Reveal } from "@/components/site/Reveal";
import { cn, formatINR, pad2 } from "@/lib/utils";
import { SESSIONS, fmtDuration, kitFor, kitSlug, labsFor, runSheet } from "./data";
import { ParallaxPlate } from "./ParallaxPlate";
import { KITS_MIN } from "./quote";
import { SessionTimeline } from "./SessionTimeline";

/** One grade group, drawn as a full spec sheet: plate, prices, outcomes, run sheet, skills, kit and labs. */
export function BandSection({ band, n, total }: { band: GradeBand; n: number; total: number }) {
  const mirrored = n % 2 === 1;
  const kit = kitFor(band);
  const bandLabs = labsFor(band);
  const steps = runSheet(band);
  const idx = pad2(n + 1);
  const titleId = `${band.id}-title`;

  const prices = [
    { k: "JOVE Day", v: band.pricePerStudent, sub: "1 full day" },
    { k: "JOVE Quarter", v: band.quarterPricePerStudent, sub: `${SESSIONS["jove-quarter"]} JOVE Days · ≈ ${formatINR(band.quarterPricePerStudent / SESSIONS["jove-quarter"])} each` },
    { k: "JOVE Year", v: band.yearPricePerStudent, sub: `${SESSIONS["jove-year"]} sessions · ≈ ${formatINR(band.yearPricePerStudent / SESSIONS["jove-year"])} each` },
  ];

  return (
    <section
      id={band.id}
      aria-labelledby={titleId}
      className={cn("relative scroll-mt-40 overflow-clip border-b border-graphite/10 py-20 sm:py-28", mirrored ? "bg-paper-200/60" : "bg-paper")}
    >
      {mirrored ? <div aria-hidden className="bp-grid absolute inset-0 opacity-60" /> : <GridBackdrop />}
      {/* oversized outline index, a drafting-sheet flourish */}
      <span
        aria-hidden
        className={cn(
          "text-stroke pointer-events-none absolute top-6 select-none font-mono text-[clamp(8rem,22vw,20rem)] font-medium leading-none text-graphite/[0.07]",
          mirrored ? "left-[2%]" : "right-[2%]",
        )}
      >
        {idx}
      </span>

      <div className="container-bp relative grid grid-cols-1 gap-x-14 gap-y-10 lg:grid-cols-12">
        {/* ── Header ── */}
        <header className={cn("self-start lg:col-span-7 lg:row-start-1", mirrored ? "lg:col-start-1" : "lg:col-start-6")}>
          <Reveal>
            <p className="annot flex flex-wrap items-center gap-x-3 gap-y-1 text-blueprint">
              <span className="font-mono tracking-[0.12em] text-graphite">
                {idx} / {pad2(total)}
              </span>
              <span className="h-px w-8 bg-graphite/40" />
              <span>{band.grades}</span>
              <span className="text-graphite/30">·</span>
              <span>{band.theme}</span>
            </p>
          </Reveal>
          <h2 id={titleId} tabIndex={-1} className="mt-5 focus:outline-none text-[clamp(2.4rem,5.6vw,4.4rem)] font-bold leading-[0.95] tracking-[-0.035em] text-graphite">
            {band.name}
          </h2>
          <Reveal delay={0.1}>
            <p className="mt-4 max-w-xl text-lg font-medium leading-snug text-charcoal sm:text-xl">“{band.tagline}”</p>
          </Reveal>
          <Reveal delay={0.15}>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Session format">
              <li className="inline-flex items-center gap-1.5 rounded-full bg-graphite px-3 py-1 text-xs font-semibold text-paper">
                <Clock className="size-3.5" aria-hidden /> {fmtDuration(band.durationMin)} session
              </li>
              <li className="inline-flex items-center gap-1.5 rounded-full border border-graphite/25 px-3 py-1 text-xs font-semibold text-charcoal">
                <Users className="size-3.5" aria-hidden /> {band.studentsPerStation} students per build station
              </li>
              <li className="inline-flex items-center gap-1.5 rounded-full border border-graphite/25 px-3 py-1 text-xs font-semibold text-charcoal">
                Up to {band.maxPerSession} per batch
              </li>
            </ul>
          </Reveal>
        </header>

        {/* ── Plate + prices (sticky on desktop) ── */}
        <div className={cn("lg:col-span-5 lg:row-span-2 lg:row-start-1", mirrored ? "lg:col-start-8" : "lg:col-start-1")}>
          <div className="space-y-6 lg:sticky lg:top-40">
            <Reveal>
              <ParallaxPlate
                src={band.image}
                alt={`Pencil blueprint sketch for ${band.name} (${band.grades}): ${kit?.project ?? band.theme}`}
                width={1600}
                height={1195}
                figure={`FIG. ${idx} — ${band.grades.toUpperCase()}`}
                caption={kit ? kit.project : band.theme}
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </Reveal>
            <Reveal delay={0.1}>
              <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)]">
                <CornerMarks />
                <dl className="grid grid-cols-3 divide-x divide-graphite/10">
                  {prices.map((p, i) => (
                    <div key={p.k} className={cn("px-3 py-4 sm:px-4", i === 0 && "bg-graphite text-paper")}>
                      <dt className={cn("annot text-[10px]", i === 0 ? "text-paper/60" : "text-blueprint")}>{p.k}</dt>
                      <dd className="mt-1.5 font-mono text-xl font-medium tracking-tight tabular sm:text-2xl">{formatINR(p.v)}</dd>
                      <dd className={cn("mt-1 text-[11px] leading-snug", i === 0 ? "text-paper/60" : "text-blueprint")}>{p.sub}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-graphite/10 px-4 py-3">
                  <p className="text-[11px] text-blueprint">Per student · ex-GST · kits &amp; certificates included</p>
                  <Link href="/packages#estimate" className="group inline-flex items-center gap-1 text-xs font-semibold text-graphite underline-offset-4 hover:underline">
                    Estimate for your school
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ── Body ── */}
        <div className={cn("self-start lg:col-span-7 lg:row-start-2", mirrored ? "lg:col-start-1" : "lg:col-start-6")}>
          {/* Outcomes */}
          <Reveal>
            <h3 className="annot text-charcoal">Learning outcomes — by the end, students can</h3>
          </Reveal>
          <ol className="mt-4 grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-graphite/10 sm:grid-cols-2">
            {band.outcomes.map((o, i) => (
              <Reveal as="li" key={o} delay={i * 0.05} className={cn("flex gap-3 bg-paper-50 p-4", band.outcomes.length % 2 === 1 && i === band.outcomes.length - 1 && "sm:col-span-2")}>
                <span className="font-mono text-[11px] text-blueprint">{pad2(i + 1)}</span>
                <span className="text-sm leading-relaxed text-graphite">{o}</span>
              </Reveal>
            ))}
          </ol>

          {/* Run sheet */}
          <div className="mt-14">
            <SessionTimeline steps={steps} total={band.durationMin} label={`Session run sheet — ${fmtDuration(band.durationMin)}`} />
          </div>

          {/* Skills */}
          <div className="mt-12">
            <h3 className="annot text-charcoal">Skills they practise</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {band.skills.map((s) => (
                <li key={s} className="rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 px-3 py-1.5 text-[13px] font-medium text-graphite">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Kit + labs */}
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
            {kit && (
              <Link
                href={`/shop/${kitSlug(kit.id)}`}
                className="group relative flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)] transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
              >
                <CornerMarks />
                <div className="relative aspect-[16/10] overflow-hidden bg-paper-200">
                  <Image src={kit.image} alt={`${kit.name} box`} fill sizes="(max-width: 768px) 100vw, 30vw" className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="annot flex items-center gap-1.5 text-blueprint">
                    <Package className="size-3.5" aria-hidden /> Kit used in this session
                  </p>
                  <p className="mt-2 text-base font-semibold text-graphite">{kit.name}</p>
                  <p className="mt-1 text-sm leading-snug text-charcoal">{kit.project}</p>
                  <p className="mt-3 text-xs leading-relaxed text-blueprint">
                    Students build on JOVE&apos;s reusable station kits. Take one home: {formatINR(kit.mrp)} MRP online, {formatINR(kit.schoolPrice)} for school orders of {KITS_MIN}+.
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-semibold text-graphite">
                    View in the shop <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </div>
              </Link>
            )}
            <div className="relative flex flex-col rounded-[var(--radius-md)] border border-dashed border-graphite/25 p-4">
              <p className="annot flex items-center gap-1.5 text-blueprint">
                <Laptop className="size-3.5" aria-hidden /> Free Virtual Lab{bandLabs.length > 1 ? "s" : ""} to try first
              </p>
              <p className="mt-2 text-sm leading-relaxed text-charcoal">The same idea online — theory, demo, simulation and a challenge. Free, right in the browser.</p>
              <ul className="mt-4 space-y-2.5">
                {bandLabs.map((lab) => (
                  <li key={lab.slug}>
                    <Link href={`/labs/${lab.slug}`} className="group flex items-center gap-3 rounded-[var(--radius-sm)] border border-graphite/12 bg-paper-50 p-2 transition-colors hover:border-graphite/40">
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-[3px] border border-graphite/10 bg-paper">
                        <Image src={lab.image} alt="" fill sizes="56px" className="object-cover mix-blend-multiply" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-graphite">{lab.title}</span>
                        <span className="block truncate text-xs text-blueprint">
                          {lab.subtitle} · ~{lab.minutes} min
                        </span>
                      </span>
                      <ArrowRight className="mr-1 size-4 shrink-0 text-blueprint transition-transform group-hover:translate-x-0.5 group-hover:text-graphite" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
