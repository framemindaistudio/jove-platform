import Image from "next/image";
import { School } from "lucide-react";
import { CornerMarks, SectionLabel } from "@/components/brand/Blueprint";
import { Button } from "@/components/ui/Button";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { kits } from "@/lib/content/business";
import { formatINR } from "@/lib/utils";
import { BULK_DISCOUNT_PCT, BULK_MIN_KITS } from "./catalog";

/** "For schools" band — bulk pricing (10% off MRP, min. 30 kits) straight from business.ts. */
export function SchoolsBulk({ index = "03" }: { index?: string }) {
  return (
    <section className="relative py-24 sm:py-32" aria-labelledby="schools-bulk-title">
      <div className="container-bp">
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-lift)]">
          <CornerMarks inset={10} size={14} className="text-graphite/35" />
          <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div className="pointer-events-none absolute -bottom-16 -right-10 hidden w-[340px] opacity-[0.06] lg:block" aria-hidden>
            <Image src="/brand/jove-mark.png" alt="" width={1024} height={1178} className="h-auto w-full" />
          </div>

          <div className="relative grid gap-12 p-6 sm:p-10 lg:grid-cols-12 lg:p-14">
            <div className="lg:col-span-5">
              <Reveal>
                <SectionLabel index={index}>For schools</SectionLabel>
              </Reveal>
              <h2 id="schools-bulk-title" className="mt-6 text-[clamp(2rem,4.4vw,3.6rem)] font-bold leading-[1] tracking-[-0.03em] text-graphite">
                <RevealLines lines={["Kits for the", "whole class."]} />
              </h2>
              <Reveal delay={0.15}>
                <p className="mt-6 max-w-md leading-relaxed text-charcoal">
                  <strong className="font-semibold text-graphite">
                    {BULK_DISCOUNT_PCT}% off MRP when your school orders {BULK_MIN_KITS} or more kits
                  </strong>{" "}
                  — take-home kits after a JOVE Day, a robotics club, or stock for your Atal Tinkering Lab. Every kit pairs with a free Virtual Lab your teachers can project in class.
                </p>
              </Reveal>
              <Reveal delay={0.25}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button href="/contact" arrow>
                    <School className="size-4" aria-hidden /> Request a school quote
                  </Button>
                  <Button href="/packages" variant="secondary">
                    Workshop packages
                  </Button>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.1} className="lg:col-span-7">
              <div className="overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-paper">
                <div className="annot hidden grid-cols-[1.6fr_1fr_1fr_1.1fr] gap-4 border-b border-graphite/15 bg-graphite px-5 py-3 text-paper/70 sm:grid">
                  <span>Kit</span>
                  <span className="text-right">MRP</span>
                  <span className="text-right">School price</span>
                  <span className="text-right">Class of {BULK_MIN_KITS}</span>
                </div>
                <ul className="divide-y divide-graphite/10">
                  {kits.map((k) => (
                    <li key={k.id} className="grid grid-cols-2 gap-x-4 gap-y-1 px-5 py-4 sm:grid-cols-[1.6fr_1fr_1fr_1.1fr] sm:items-center">
                      <div className="col-span-2 sm:col-span-1">
                        <p className="font-semibold text-graphite">{k.name.replace(/^JOVE\s+/, "")}</p>
                        <p className="annot mt-0.5 text-blueprint">{k.grades.split("·")[0].trim()}</p>
                      </div>
                      <p className="tabular text-sm text-blueprint sm:text-right">
                        <span className="annot mr-2 sm:hidden">MRP</span>
                        <s>{formatINR(k.mrp)}</s>
                      </p>
                      <p className="tabular text-right text-sm font-bold text-graphite">
                        <span className="annot mr-2 font-medium text-blueprint sm:hidden">School</span>
                        {formatINR(k.schoolPrice)}
                      </p>
                      <p className="tabular col-span-2 text-sm text-charcoal sm:col-span-1 sm:text-right">
                        <span className="annot mr-2 text-blueprint sm:hidden">Class of {BULK_MIN_KITS}</span>
                        {formatINR(k.schoolPrice * BULK_MIN_KITS)}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="annot border-t border-dashed border-graphite/20 px-5 py-3 text-blueprint">All prices incl. GST · Final quote confirmed in writing</p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
