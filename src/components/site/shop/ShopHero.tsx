import Image from "next/image";
import { ConstructionCircle, CornerMarks, Crosshair, DimensionLine, GridBackdrop, SectionLabel } from "@/components/brand/Blueprint";
import { Button } from "@/components/ui/Button";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { FREE_SHIPPING_ABOVE } from "@/lib/shop";
import { formatINR } from "@/lib/utils";
import { Parallax } from "./Parallax";

/** Shop hero: headline + "drawing title block" spec card + the knolled-components sketch with parallax. */
export function ShopHero({ kitCount, minPrice, maxPrice, labCount }: { kitCount: number; minPrice: number; maxPrice: number; labCount: number }) {
  const spec: [string, React.ReactNode][] = [
    ["Kits", <span key="k" className="font-mono">{String(kitCount).padStart(2, "0")}</span>],
    ["Grades", "1 – 10 · Ages 6–16"],
    ["Price", minPrice === maxPrice ? `${formatINR(minPrice)} incl. GST` : `${formatINR(minPrice)} – ${formatINR(maxPrice)} · incl. GST`],
    ["Shipping", `Free above ${formatINR(FREE_SHIPPING_ABOVE)}`],
    ["Free labs", `${labCount} online journeys paired with the kits`],
  ];

  return (
    <section className="relative overflow-hidden pb-16 pt-28 sm:pb-20 sm:pt-36">
      <GridBackdrop />
      <ConstructionCircle className="absolute -right-48 -top-40 hidden text-graphite/10 lg:block" size={620} />
      <Crosshair className="absolute left-[5%] top-32 hidden md:block" />

      <div className="container-bp relative">
        <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <Reveal>
              <SectionLabel index="00">JOVE Kit Store</SectionLabel>
            </Reveal>
            <h1 className="mt-6 text-[clamp(2.4rem,6vw,5.2rem)] font-bold leading-[0.98] tracking-[-0.03em] text-graphite">
              <RevealLines lines={["Robotics & AI kits,", "designed by", "the JOVE team."]} />
            </h1>
            <Reveal delay={0.25}>
              <p className="mt-7 max-w-xl text-base leading-relaxed text-charcoal sm:text-lg">
                The same builds our trainers teach in school workshops — boxed for home. Every kit pairs with a{" "}
                <strong className="font-semibold text-graphite">free JOVE Virtual Lab</strong>, so your child learns the idea online first, then builds it for real on the kitchen table.
              </p>
            </Reveal>
            <Reveal delay={0.35}>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button href="#kits" size="lg" arrow>
                  Browse the kits
                </Button>
                <Button href="/labs" size="lg" variant="secondary">
                  Try a free lab
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.3} className="lg:col-span-5">
            <div className="relative rounded-[var(--radius-md)] border border-graphite/25 bg-paper-50/85 shadow-[var(--shadow-paper)] backdrop-blur-[2px]">
              <CornerMarks inset={-6} />
              <div className="annot flex items-center justify-between gap-4 border-b border-graphite/20 px-4 py-2.5 text-blueprint">
                <span>Store spec</span>
                <span className="font-mono tracking-[0.12em]">DRG · JOVE-STORE-01</span>
              </div>
              <dl className="divide-y divide-graphite/10">
                {spec.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[96px_1fr] items-baseline gap-3 px-4 py-3 sm:grid-cols-[120px_1fr]">
                    <dt className="annot text-blueprint">{k}</dt>
                    <dd className="text-sm font-semibold text-graphite">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="hatch h-2.5 rounded-b-[var(--radius-md)] border-t border-graphite/20" aria-hidden />
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2} y={40}>
          <figure className="mt-14 sm:mt-20">
            <DimensionLine label="Fig. 01 — every part, laid out" />
            <div className="relative mt-5 rounded-[var(--radius-lg)] border border-graphite/15 bg-paper shadow-[var(--shadow-lift)]">
              <CornerMarks inset={-7} size={14} />
              <Parallax travel={36} className="aspect-[4/3] rounded-[var(--radius-lg)] sm:aspect-[16/9] lg:aspect-[1600/893]">
                <Image
                  src="/images/kits/kit-knolling.webp"
                  alt="Pencil blueprint sketch of robotics kit components laid out in a grid: a microcontroller board, breadboard, geared motors, wheels, ultrasonic sensor, servo, battery holder, LEDs, resistors, jumper wires, a screwdriver and screws."
                  fill
                  preload
                  quality={85}
                  sizes="(max-width: 1440px) 100vw, 1280px"
                  className="object-cover mix-blend-multiply"
                />
              </Parallax>
              <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] shadow-[inset_0_0_80px_rgb(245_241_232/0.65)]" aria-hidden />
            </div>
            <figcaption className="annot mt-4 flex flex-col gap-1 text-blueprint sm:flex-row sm:justify-between">
              <span>Fig. 01 · Components, knolled · Illustrative sketch</span>
              <span>Contents vary by kit — see &ldquo;In the box&rdquo; on each kit</span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
