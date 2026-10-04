import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/site/Reveal";
import { kits, type KitId } from "@/lib/content/business";
import { formatINR } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";
import { RAIL, RAIL_HINT, RAIL_ITEM } from "./rail";

/** Shop product slugs for each kit (matches the store catalogue). */
const KIT_SLUG: Record<KitId, string> = {
  spark: "spark-kit",
  explorer: "explorer-kit",
  builder: "builder-kit",
  innovator: "innovator-ai-kit",
};

/** Robotics kit store teaser. */
export function KitsTeaser() {
  return (
    <section aria-labelledby="kits-title" className="relative overflow-hidden bg-paper-100 py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-paper-200/60" />
      <div aria-hidden className="bp-grid pointer-events-none absolute inset-x-0 bottom-0 h-[55%] opacity-60" />
      <div className="container-bp relative">
        <SectionHeading
          id="kits-title"
          index="07"
          eyebrow="Robotics & AI kits"
          title={["Take the robot", "home."]}
          intro="The same kits we build with in the workshop, boxed for home. Every kit comes with an illustrated guide and free Virtual Labs — shipped to your door."
          action={
            <Button href="/shop" variant="secondary" arrow>
              Visit the kit store
            </Button>
          }
        />

        <ul className={`mt-10 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:mt-20 xl:grid-cols-4 ${RAIL}`}>
          {kits.map((k, i) => (
            <Reveal as="li" key={k.id} delay={i * 0.08} className={RAIL_ITEM}>
              <Link
                href={`/shop/${KIT_SLUG[k.id]}`}
                className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)] transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-paper-200">
                  <Image
                    src={k.image}
                    alt={`${k.name} box — ${k.project}`}
                    fill
                    sizes="(min-width: 1280px) 22vw, (min-width: 640px) 46vw, 92vw"
                    quality={75}
                    className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
                  />
                  <span className="absolute left-3 top-3 bg-paper/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-graphite">{k.sku}</span>
                </div>
                <div className="flex flex-1 flex-col border-t border-graphite/10 p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-blueprint">{k.grades}</p>
                  <h3 className="mt-2 text-lg font-bold tracking-tight text-graphite">{k.name}</h3>
                  <p className="mt-1 text-sm leading-snug text-charcoal">{k.project}</p>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                    <span>
                      <span className="block font-mono text-xl font-medium text-graphite">{formatINR(k.mrp)}</span>
                      <span className="text-[11px] text-blueprint">MRP · incl. GST</span>
                    </span>
                    <span className="grid size-9 place-items-center rounded-full border border-graphite/20 text-graphite transition-all duration-500 group-hover:rotate-45 group-hover:bg-graphite group-hover:text-paper">
                      <ArrowUpRight className="size-4" aria-hidden />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
        <p aria-hidden className={`${RAIL_HINT} text-blueprint`}>
          <span className="h-px w-6 bg-graphite/30" /> Swipe · {kits.length} kits
        </p>
      </div>
    </section>
  );
}
