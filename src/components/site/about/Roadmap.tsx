"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { Reveal } from "@/components/site/Reveal";
import { usePrefersReducedMotion } from "@/components/site/studio/LazyVideo";
import { cn } from "@/lib/utils";

export interface RoadmapStep {
  when: string;
  period: string;
  status: string;
  title: string;
  goals: string[];
  /** Current phase — drawn solid. */
  current?: boolean;
}

const LINE_X = "left-[19px] md:left-[calc(180px_+_2rem_+_19px)]";

/** Vertical goal timeline. The graphite line draws itself as the reader scrolls through it. */
export function Roadmap({ steps }: { steps: RoadmapStep[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

  return (
    <div ref={ref} className="relative">
      <span aria-hidden className={cn("pointer-events-none absolute bottom-6 top-6 w-px bg-graphite/15", LINE_X)} />
      <motion.span
        aria-hidden
        className={cn("pointer-events-none absolute bottom-6 top-6 w-[2px] -translate-x-[0.5px] origin-top bg-graphite", LINE_X)}
        style={{ scaleY: reduced ? 1 : scaleY }}
      />
      <ol className="relative space-y-6 sm:space-y-8">
      {steps.map((s, i) => (
        <Reveal as="li" key={s.when} delay={0.05 * i} className="relative grid grid-cols-[40px_1fr] gap-x-4 md:grid-cols-[180px_40px_1fr] md:gap-x-8">
          <div className="hidden pt-2 text-right md:block">
            <p className="font-mono text-2xl font-medium tracking-tight text-graphite">{s.when}</p>
            <p className="annot mt-1 text-blueprint">{s.period}</p>
          </div>
          <div className="relative flex justify-center pt-1">
            <span
              className={cn(
                "relative z-10 grid size-10 place-items-center rounded-full border font-mono text-xs",
                s.current ? "border-graphite bg-graphite text-paper shadow-[var(--shadow-lift)]" : "border-graphite/30 bg-paper-50 text-graphite",
              )}
            >
              {String(i + 1).padStart(2, "0")}
              {s.current && <span aria-hidden className="absolute -inset-1.5 rounded-full border border-graphite/30 motion-safe:animate-ping [animation-duration:2.4s]" />}
            </span>
          </div>
          <article
            className={cn(
              "relative rounded-[var(--radius-md)] border p-5 sm:p-7",
              s.current ? "border-graphite/25 bg-paper-50 shadow-[var(--shadow-lift)]" : "border-graphite/12 bg-paper-50/70 shadow-[var(--shadow-paper)]",
            )}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="font-mono text-sm font-medium text-graphite md:hidden">{s.when}</span>
              <span className="annot text-blueprint md:hidden">{s.period}</span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
                  s.current ? "bg-graphite text-paper" : "border border-graphite/25 text-charcoal",
                )}
              >
                {s.status}
              </span>
            </div>
            <h3 className="mt-3 text-xl font-bold tracking-[-0.02em] text-graphite sm:text-2xl">{s.title}</h3>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {s.goals.map((g) => (
                <li key={g} className="flex gap-2.5 text-[14px] leading-relaxed text-charcoal">
                  <span aria-hidden className="mt-[9px] h-px w-3 shrink-0 bg-graphite/50" />
                  {g}
                </li>
              ))}
            </ul>
          </article>
        </Reveal>
      ))}
      </ol>
    </div>
  );
}
