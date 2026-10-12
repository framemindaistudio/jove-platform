"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig, useInView } from "motion/react";
import { cn } from "@/lib/utils";
import type { DayBlock, DayBlockKind, DayLane } from "./data";

const LANES: DayLane[] = ["Assembly", "Hall A", "Hall B", "Office"];
const LANE_NOTE: Record<DayLane, string> = {
  Assembly: "Whole school",
  "Hall A": "Founder-led · senior",
  "Hall B": "Trainer pair · junior",
  Office: "Principal & team",
};
const LANE_H = 76;

const pad = (n: number) => String(n).padStart(2, "0");
const clock = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

const KIND_LABEL: Record<DayBlockKind, string> = {
  session: "Student session",
  assembly: "Whole-school assembly",
  team: "Team operations",
  optional: "Optional batch (if booked)",
};

const barTone: Record<DayBlockKind, string> = {
  session: "bg-paper text-graphite shadow-[0_10px_30px_-12px_rgb(0_0_0/0.6)]",
  assembly: "hatch-light border border-paper/60 bg-paper/10 text-paper",
  team: "hatch-light border border-dashed border-paper/25 bg-transparent text-paper/75",
  optional: "border border-dashed border-paper/70 bg-paper/[0.04] text-paper",
};

function hallLabel(b: DayBlock) {
  return b.lanes.length > 1 ? "Hall A + Hall B" : b.hall;
}

/**
 * The JOVE Day as a blueprint Gantt chart: two halls in parallel plus whole-school assemblies.
 * Desktop: interactive time × hall chart with a detail readout. Mobile: a stacked run sheet.
 */
export function DaySchedule({ blocks, start, span }: { blocks: DayBlock[]; start: number; span: number }) {
  const firstSession = blocks.find((b) => b.kind === "session") ?? blocks[0];
  const [active, setActive] = useState(firstSession.index);
  const current = blocks.find((b) => b.index === active) ?? firstSession;
  const trackRef = useRef<HTMLDivElement>(null);
  const inView = useInView(trackRef, { once: true, margin: "0px 0px -80px 0px" });

  const ticks: number[] = [];
  for (let m = 0; m <= span; m += 30) ticks.push(m);

  return (
    <MotionConfig reducedMotion="user">
      {/* ── Desktop Gantt ── */}
      <div className="hidden lg:block">
        <div className="relative rounded-[var(--radius-lg)] border border-paper/15 bg-ink/40 p-6 shadow-[var(--shadow-lift)] xl:p-8">
          <div className="flex">
            {/* lane labels */}
            <div className="w-36 shrink-0 pt-10" aria-hidden>
              {LANES.map((lane) => (
                <div key={lane} className="flex flex-col justify-center border-t border-paper/10 pr-4" style={{ height: LANE_H }}>
                  <span className="text-sm font-semibold text-paper">{lane}</span>
                  <span className="annot mt-0.5 text-[9px] text-paper/45">{LANE_NOTE[lane]}</span>
                </div>
              ))}
            </div>

            {/* track */}
            <div className="relative min-w-0 flex-1">
              {/* time axis */}
              <div className="relative h-10" aria-hidden>
                {ticks.map((m) => {
                  const isHour = (start + m) % 60 === 0;
                  const edge = m === 0 || m === span;
                  // keep hour labels clear of the start/end labels
                  const crowded = !edge && (m < 45 || span - m < 45);
                  return (
                    (edge || (isHour && !crowded)) && (
                      <span
                        key={m}
                        className={cn("absolute top-1 font-mono text-[10px] tracking-wider text-paper/55", m === 0 ? "translate-x-0" : m === span ? "-translate-x-full" : "-translate-x-1/2")}
                        style={{ left: `${(m / span) * 100}%` }}
                      >
                        {clock(start + m)}
                      </span>
                    )
                  );
                })}
              </div>
              <div ref={trackRef} className="relative" style={{ height: LANE_H * LANES.length }}>
                {/* lanes + grid */}
                <div aria-hidden className="absolute inset-0">
                  {LANES.map((lane, i) => (
                    <div key={lane} className={cn("absolute inset-x-0 border-t border-paper/10", i % 2 === 1 && "bg-paper/[0.025]")} style={{ top: i * LANE_H, height: LANE_H }} />
                  ))}
                  {ticks.map((m) => {
                    const isHour = (start + m) % 60 === 0;
                    return (
                      <span
                        key={m}
                        className={cn("absolute inset-y-0 w-px", isHour ? "bg-paper/15" : "border-l border-dashed border-paper/[0.08]")}
                        style={{ left: `${(m / span) * 100}%` }}
                      />
                    );
                  })}
                </div>

                {/* bars */}
                <div role="list" aria-label="JOVE Day schedule by hall" className="absolute inset-0">
                  {blocks.map((b, i) => {
                    const laneIdx = LANES.indexOf(b.lanes[0]);
                    const rows = b.lanes.length;
                    const on = b.index === active;
                    return (
                      <div
                        key={b.index}
                        role="listitem"
                        className="absolute p-1"
                        style={{ left: `${(b.from / span) * 100}%`, width: `${((b.to - b.from) / span) * 100}%`, top: laneIdx * LANE_H, height: rows * LANE_H }}
                      >
                        <motion.button
                          type="button"
                          onMouseEnter={() => setActive(b.index)}
                          onFocus={() => setActive(b.index)}
                          onClick={() => setActive(b.index)}
                          aria-pressed={on}
                          aria-label={`${clock(start + b.from)} to ${clock(start + b.to)}, ${hallLabel(b)}: ${b.title}. ${b.detail} For: ${b.who}.`}
                          className={cn(
                            "@container relative flex h-full w-full origin-left flex-col justify-between overflow-hidden rounded-[var(--radius-sm)] px-2 py-1.5 text-left transition-[box-shadow,filter] duration-300",
                            barTone[b.kind],
                            on ? "ring-2 ring-paper ring-offset-2 ring-offset-graphite" : "hover:brightness-110",
                          )}
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={inView ? { scaleX: 1, opacity: 1 } : undefined}
                          transition={{ duration: 0.9, delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <span className="flex items-baseline gap-1.5">
                            <span className="font-mono text-[10px] opacity-60">{pad(b.index)}</span>
                            <span className="hidden truncate text-[12px] font-semibold leading-tight @min-[6.5rem]:block">{b.title}</span>
                          </span>
                          <span className="hidden truncate font-mono text-[10px] opacity-70 @min-[5rem]:block">
                            {b.time}–{b.end}
                          </span>
                        </motion.button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* readout */}
          <div className="mt-6 grid gap-6 border-t border-paper/10 pt-6 xl:grid-cols-12">
            <div className="xl:col-span-8" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={current.index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                  <p className="annot flex flex-wrap items-center gap-x-3 gap-y-1 text-paper/50">
                    <span className="font-mono text-paper/80">{pad(current.index)}</span>
                    <span>
                      {current.time} – {current.end}
                    </span>
                    <span className="text-paper/25">/</span>
                    <span>{hallLabel(current)}</span>
                    <span className="text-paper/25">/</span>
                    <span>{current.to - current.from} min</span>
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-paper">{current.title}</p>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-paper/70">{current.detail}</p>
                  <p className="annot mt-3 text-paper/50">
                    For: <span className="text-paper/80">{current.who}</span> · {KIND_LABEL[current.kind]}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 self-start xl:col-span-4" aria-label="Legend">
              {(Object.keys(KIND_LABEL) as DayBlockKind[]).map((k) => (
                <li key={k} className="flex items-center gap-2.5 text-xs text-paper/70">
                  <span aria-hidden className={cn("h-3.5 w-7 shrink-0 rounded-[3px]", barTone[k], "shadow-none")} />
                  {KIND_LABEL[k]}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="annot mt-3 text-paper/40">Hover, tap or tab through the chart to read each block.</p>
      </div>

      {/* ── Mobile / tablet run sheet ── */}
      <div className="lg:hidden">
        <p className="annot mb-5 text-paper/55">Hall A and Hall B run in parallel</p>
        <ol className="relative space-y-3 border-l border-paper/20 pl-5">
          {blocks.map((b) => (
            <li key={b.index} className="relative">
              <span aria-hidden className={cn("absolute -left-[25px] top-4 size-2.5 rounded-full border border-paper", b.kind === "session" ? "bg-paper" : "bg-graphite")} />
              <div className={cn("rounded-[var(--radius-md)] p-4", b.kind === "session" ? "bg-paper text-graphite" : b.kind === "optional" ? "border border-dashed border-paper/50 text-paper" : "hatch-light border border-paper/15 text-paper")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs tabular">
                    {b.time}–{b.end}
                  </span>
                  <span className={cn("annot rounded-full px-2 py-0.5 text-[9px]", b.kind === "session" ? "bg-graphite text-paper" : "border border-current/40")}>{hallLabel(b)}</span>
                </div>
                <p className="mt-2 text-base font-semibold leading-snug">{b.title}</p>
                <p className={cn("mt-1 text-sm leading-relaxed", b.kind === "session" ? "text-charcoal" : "opacity-75")}>{b.detail}</p>
                <p className={cn("annot mt-2 text-[10px]", b.kind === "session" ? "text-blueprint" : "opacity-60")}>For: {b.who}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </MotionConfig>
  );
}
