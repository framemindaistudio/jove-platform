import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GridBackdrop } from "@/components/brand/Blueprint";
import { Reveal } from "@/components/site/Reveal";
import { packages } from "@/lib/content/business";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";
import { RAIL, RAIL_HINT, RAIL_ITEM } from "./rail";

/** Four engagement models; the Quarter is the recommended one. */
export function PackagesTeaser() {
  return (
    <section aria-labelledby="packages-title" className="relative overflow-hidden bg-graphite py-24 text-paper sm:py-32">
      <GridBackdrop dark />
      <div className="container-bp relative">
        <SectionHeading
          id="packages-title"
          index="06"
          eyebrow="Packages"
          light
          title={["Start with a day.", "Stay for the journey."]}
          intro="One festival-style JOVE Day, a progressive quarter, a full academic year or a weekly after-school club — every package includes kits, certificates and our film crew."
        />

        <ul className={`mt-10 sm:mt-14 sm:gap-5 md:grid-cols-2 lg:mt-20 xl:grid-cols-4 ${RAIL}`}>
          {packages.map((p, i) => {
            const hi = !!p.highlight;
            return (
              <Reveal as="li" key={p.id} delay={i * 0.08} className={RAIL_ITEM}>
                <article
                  className={cn(
                    "relative flex h-full flex-col rounded-[var(--radius-md)] border p-6 transition-transform duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 sm:p-7",
                    hi ? "border-paper bg-paper text-graphite shadow-[0_30px_60px_-30px_rgb(0_0_0/0.7)] xl:-translate-y-4 xl:hover:-translate-y-5" : "border-paper/15 bg-paper/[0.03] text-paper",
                  )}
                >
                  {hi && (
                    <span className="absolute -top-3 left-6 bg-graphite px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-paper ring-1 ring-paper">
                      Recommended
                    </span>
                  )}
                  <p className={cn("annot", hi ? "text-blueprint" : "text-paper/50")}>{p.cadence}</p>
                  <h3 className="mt-3 text-2xl font-bold tracking-tight">{p.name}</h3>
                  <p className={cn("mt-2 text-sm leading-relaxed", hi ? "text-charcoal" : "text-paper/70")}>{p.headline}</p>
                  <p className={cn("mt-5 border-y py-3 font-mono text-[12px] leading-relaxed", hi ? "border-graphite/15 text-graphite" : "border-paper/15 text-paper")}>
                    {p.priceNote}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {p.includes.slice(0, 4).map((inc) => (
                      <li key={inc} className={cn("flex gap-2.5 text-sm leading-snug", hi ? "text-charcoal" : "text-paper/75")}>
                        <Check className={cn("mt-0.5 size-4 shrink-0", hi ? "text-graphite" : "text-paper/60")} aria-hidden />
                        {inc}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/packages#${p.id}`}
                    className={cn("group mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold", hi ? "text-graphite" : "text-paper")}
                  >
                    See what&apos;s included
                    <span className="sr-only"> in {p.name}</span>
                    <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </ul>
        <p aria-hidden className={`${RAIL_HINT} text-paper/45`}>
          <span className="h-px w-6 bg-paper/30" /> Swipe · {packages.length} packages
        </p>

        <Reveal className="mt-12 flex flex-col items-start justify-between gap-6 border-t border-paper/15 pt-8 sm:flex-row sm:items-center">
          <p className="max-w-2xl text-sm leading-relaxed text-paper/60">
            Add-ons from FrameMind AI Studio — social media management, admissions films — plus teacher training and turnkey lab setups are available with any
            package.
          </p>
          <Button href="/packages" variant="light" arrow>
            Compare packages
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
