"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { clockOffset, fmtDuration } from "./data";

export interface TimelineStep {
  index: number;
  title: string;
  minutes: number;
  detail: string;
  start: number;
  end: number;
}

/**
 * Minute-by-minute session run sheet drawn as a vertical blueprint timeline.
 * The graphite rule "draws" down as you scroll; each step shows its clock offset,
 * duration bar (share of the session) and cumulative time.
 */
export function SessionTimeline({ steps, total, label }: { steps: TimelineStep[]; total: number; label: string }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 55%"] });
  const draw = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });

  return (
    <div>
      <div className="flex items-end justify-between gap-4 border-b border-graphite/15 pb-3">
        <p className="annot text-charcoal">{label}</p>
        <p className="font-mono text-[11px] tracking-[0.12em] text-blueprint">
          T+00:00 → T+{clockOffset(total)} · {fmtDuration(total)}
        </p>
      </div>
      <ol ref={ref} className="relative mt-6 space-y-7 pl-10 sm:pl-12">
        {/* construction rule + scroll-drawn ink rule */}
        <span aria-hidden className="absolute bottom-2 left-[11px] top-2 w-px border-l border-dashed border-graphite/25 sm:left-[15px]" />
        <motion.span aria-hidden className="absolute bottom-2 left-[11px] top-2 w-px origin-top bg-graphite motion-reduce:transform-none! sm:left-[15px]" style={{ scaleY: draw }} />
        {steps.map((s) => {
          const share = (s.minutes / total) * 100;
          return (
            <motion.li
              key={s.index}
              className="relative"
              initial="hidden"
              whileInView="shown"
              viewport={{ once: true, margin: "-40px" }}
              variants={{ hidden: { opacity: 0, x: 16 }, shown: { opacity: 1, x: 0 } }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <span aria-hidden className="absolute -left-10 top-0 grid size-6 place-items-center rounded-full border border-graphite bg-paper font-mono text-[10px] font-medium text-graphite sm:-left-12 sm:size-8 sm:text-[11px]">
                {String(s.index).padStart(2, "0")}
              </span>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h4 className="text-[15px] font-semibold leading-snug text-graphite sm:text-base">{s.title}</h4>
                <span className="font-mono text-xs text-charcoal tabular">
                  <span className="sr-only">From minute {s.start} to minute {s.end}: </span>
                  {clockOffset(s.start)}–{clockOffset(s.end)}
                </span>
              </div>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-charcoal">{s.detail}</p>
              <div className="mt-3 flex items-center gap-3">
                <div aria-hidden className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-graphite/[0.07]">
                  <motion.span
                    className="absolute inset-y-0 left-0 origin-left rounded-full bg-graphite/75"
                    style={{ width: `${share}%` }}
                    variants={{ hidden: { scaleX: 0 }, shown: { scaleX: 1, transition: { duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] } } }}
                  />
                </div>
                <span className="w-28 shrink-0 text-right font-mono text-[11px] text-blueprint tabular">
                  <span aria-hidden>
                    {s.minutes}′ · Σ {s.end}′
                  </span>
                  <span className="sr-only">
                    {s.minutes} minutes, {s.end} minutes cumulative
                  </span>
                </span>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
