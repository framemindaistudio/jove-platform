import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { SectionLabel } from "@/components/brand/Blueprint";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { labStages } from "@/lib/content/labs";
import { labsFor, splitGrades, type ShopProduct } from "./catalog";

/** Dark band: how each kit pairs with the free Virtual Labs (learn online → build for real). */
export function LabPairings({ products }: { products: ShopProduct[] }) {
  const paired = products.filter((p) => p.kitId && p.labSlugs.length);
  if (!paired.length) return null;

  return (
    <section className="relative overflow-hidden bg-graphite py-24 text-paper sm:py-32" aria-labelledby="kit-lab-title">
      <div className="bp-grid-dark absolute inset-0 opacity-90" aria-hidden />
      <div className="paper-grain absolute inset-0 opacity-20 mix-blend-overlay" aria-hidden />
      <div className="container-bp relative">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Reveal>
              <SectionLabel index="02" light>
                Kit + Virtual Lab
              </SectionLabel>
            </Reveal>
            <h2 id="kit-lab-title" className="mt-6 text-[clamp(2.2rem,5vw,4.2rem)] font-bold leading-[0.98] tracking-[-0.03em]">
              <RevealLines lines={["Learn it online.", "Build it for real."]} />
            </h2>
          </div>
          <Reveal delay={0.15} className="lg:col-span-5">
            <p className="text-base leading-relaxed text-paper/70 sm:text-lg">
              Every JOVE Virtual Lab is free and runs in the browser. Do the lab first — then open the box. The idea is already in their head; now it goes into their hands.
            </p>
          </Reveal>
        </div>

        {/* The journey */}
        <Reveal delay={0.1}>
          <ol className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-md)] border border-paper/15 bg-paper/15 sm:grid-cols-5">
            {[...labStages.map((s) => ({ index: s.index, label: s.label, blurb: s.blurb, online: true })), { index: "05", label: "Build the kit", blurb: "The real thing — wires, motors, code and all.", online: false }].map((s, i) => (
              <li key={s.index} className={`relative px-5 py-5 ${i === 4 ? "col-span-2 bg-paper text-graphite sm:col-span-1" : "bg-graphite"}`}>
                <p className={`annot font-mono ${s.online ? "text-paper/45" : "text-blueprint"}`}>
                  {s.index} · {s.online ? "Online" : "At home"}
                </p>
                <p className="mt-2 text-base font-bold">{s.label}</p>
                <p className={`mt-1 text-xs leading-relaxed ${s.online ? "text-paper/55" : "text-charcoal"}`}>{s.blurb}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* Pairings */}
        <ul className="mt-14 divide-y divide-paper/12 border-y border-paper/12">
          {paired.map((p, i) => {
            const [gradeLine] = splitGrades(p.grades);
            return (
              <Reveal as="li" key={p.slug} delay={i * 0.05} className="grid gap-6 py-8 md:grid-cols-12 md:items-center">
                <div className="md:col-span-4">
                  <p className="annot font-mono text-paper/45">Kit {String(i + 1).padStart(2, "0")}</p>
                  <Link href={`/shop/${p.slug}`} className="group mt-2 inline-flex items-center gap-2 text-2xl font-bold tracking-[-0.02em] hover:underline hover:decoration-paper/40 hover:underline-offset-4">
                    {p.name}
                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
                  </Link>
                  <p className="mt-1 text-sm text-paper/60">
                    {gradeLine} · {p.short}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row md:col-span-8 md:justify-end">
                  {labsFor(p.kitId).map((lab) => (
                    <Link
                      key={lab.slug}
                      href={`/labs/${lab.slug}`}
                      className="group flex items-center gap-4 rounded-[var(--radius-md)] border border-paper/15 bg-paper/[0.04] p-2.5 pr-5 transition-colors hover:border-paper/40 hover:bg-paper/[0.08] sm:w-[300px]"
                    >
                      <span className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-paper">
                        <Image src={lab.image} alt="" fill sizes="96px" quality={60} className="object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105" />
                      </span>
                      <span className="min-w-0">
                        <span className="annot block text-paper/45">Free lab · {lab.topic}</span>
                        <span className="mt-1 block font-semibold leading-tight">{lab.title}</span>
                        <span className="mt-1 flex items-center gap-1.5 text-xs text-paper/55">
                          <Clock className="size-3" aria-hidden /> ~{lab.minutes} min · {lab.grades}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
