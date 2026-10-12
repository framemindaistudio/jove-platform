"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GridBackdrop, SectionLabel } from "@/components/brand/Blueprint";
import { RevealLines } from "@/components/site/Reveal";
import { faqs } from "@/lib/content/business";
import { cn } from "@/lib/utils";

/** Accessible accordion (button + aria-expanded + labelled region) with smooth height. */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();

  return (
    <section aria-labelledby="faq-title" className="relative overflow-hidden bg-graphite py-24 text-paper sm:py-32">
      <GridBackdrop dark />
      <div className="container-bp relative grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <SectionLabel index="10" light>
              FAQ
            </SectionLabel>
            <h2 id="faq-title" className="mt-5 text-[clamp(2rem,1.2rem+3vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.03em]">
              <RevealLines lines={["Questions", "principals ask."]} />
            </h2>
            <p className="mt-6 max-w-sm leading-relaxed text-paper/65">Anything else? A founder reads every message and replies personally.</p>
            <Button href="/contact" variant="outline-light" className="mt-8" arrow>
              Ask a question
            </Button>
          </div>
        </div>

        <div className="lg:col-span-8">
          <ul className="border-t border-paper/15">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              const btn = `${base}-q${i}`;
              const panel = `${base}-a${i}`;
              return (
                <li key={f.q} className="border-b border-paper/15">
                  <h3>
                    <button
                      id={btn}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={isOpen ? panel : undefined}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="group flex w-full items-start gap-5 py-6 text-left focus-visible:outline-paper sm:gap-8"
                    >
                      <span className="mt-1 font-mono text-xs tracking-[0.14em] text-paper/40">{String(i + 1).padStart(2, "0")}</span>
                      <span className="flex-1 text-lg font-semibold leading-snug transition-colors group-hover:text-white sm:text-xl">{f.q}</span>
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-paper/25 transition-all duration-500 ease-[var(--ease-out-expo)]",
                          isOpen && "rotate-45 border-paper bg-paper text-graphite",
                        )}
                      >
                        <Plus className="size-4" />
                      </span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panel}
                        role="region"
                        aria-labelledby={btn}
                        key="panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-2xl pb-7 pl-10 leading-relaxed text-paper/70 sm:pl-14">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
