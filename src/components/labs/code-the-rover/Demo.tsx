"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { StageHeader } from "@/components/labs/framework/LabJourney";
import { cn } from "@/lib/utils";
import { Board } from "./Board";
import { ProgramEditor } from "./Blocks";
import { DIR_NAMES, fromSpec, parseLevel, type Step } from "./engine";
import { DEMO_LEVEL, DEMO_PROGRAM } from "./levels";
import { useRover } from "./useRover";

const SPEED = 900;

function narrate(step: Step | undefined, dir: number): string {
  if (!step) return "Press play to watch the rover read the program from top to bottom.";
  const loop = step.loops.length ? ` (Repeat — round ${step.loops[step.loops.length - 1].iter} of ${step.loops[step.loops.length - 1].times})` : "";
  if (step.action === "forward") return `Forward: the rover drives one square ${DIR_NAMES[dir]}${loop}.`;
  if (step.action === "left") return `Turn Left: the rover spins on the spot and now faces ${DIR_NAMES[dir]}${loop}.`;
  return `Turn Right: the rover spins on the spot and now faces ${DIR_NAMES[dir]}${loop}.`;
}

export function RoverDemo() {
  const level = useMemo(() => parseLevel(DEMO_LEVEL), []);
  const [program] = useState(() => fromSpec(DEMO_PROGRAM));
  const rover = useRover(level, program, SPEED);
  const [userPaused, setUserPaused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { run, reset } = rover;

  // auto-play once the demo scrolls into view
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [run]);

  // loop the demo after a short pause
  useEffect(() => {
    if (!rover.finished || userPaused) return;
    const t = window.setTimeout(() => run(), 2600);
    return () => window.clearTimeout(t);
  }, [rover.finished, rover.runId, userPaused, run]);

  const toggle = () => {
    if (rover.running) {
      setUserPaused(true);
      rover.pause();
    } else {
      setUserPaused(false);
      run();
    }
  };

  return (
    <div>
      <StageHeader
        index="02"
        kicker="Demo"
        title="Watch the rover read a program"
        intro="Here's a finished program. Follow the highlighted block — that's the instruction the rover is doing right now. Notice how the Repeat block runs its inside twice."
      />
      <div ref={wrapRef} className="overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)]">
        <div className="flex items-center justify-between border-b border-graphite/10 px-5 py-3">
          <p className="annot text-charcoal">Demo run · collect both gems, reach the flag</p>
          <span className="font-mono text-xs text-blueprint">
            step {rover.cursor}/{rover.total || 8}
          </span>
        </div>
        <div className="grid lg:grid-cols-[1fr_340px]">
          <div className="relative border-b border-graphite/10 bg-paper bp-grid p-4 lg:border-b-0 lg:border-r">
            <Board level={level} sim={rover.sim} duration={Math.round(SPEED * 0.8)} className="mx-auto block h-auto max-h-[460px] w-full" label="Demo map: the rover drives to two gems and a flag" />
          </div>
          <div className="space-y-4 p-5">
            <ProgramEditor program={program} activeId={rover.current?.blockId} loopIters={rover.finished ? undefined : rover.loopIters} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={toggle} className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-graphite px-4 text-sm font-bold text-paper hover:bg-ink">
                {rover.running ? <Pause className="size-4" aria-hidden /> : <Play className="size-4 fill-current" aria-hidden />}
                {rover.running ? "Pause" : rover.started && !rover.finished ? "Resume" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserPaused(false);
                  reset();
                  run();
                }}
                className="inline-flex h-11 items-center gap-2 rounded-[10px] border-2 border-graphite/70 px-4 text-sm font-bold hover:border-graphite"
              >
                <RotateCcw className="size-4" aria-hidden /> Replay
              </button>
            </div>
          </div>
        </div>
        <p aria-live="polite" className={cn("border-t border-graphite/10 px-5 py-4 text-sm font-medium", rover.sim.status === "success" ? "bg-graphite text-paper" : "text-charcoal")}>
          {rover.sim.status === "success" ? "Mission complete! 8 blocks: both gems collected and the rover is home at the flag. Replaying in a moment…" : narrate(rover.current, rover.sim.dir)}
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Top to bottom", "The rover always starts with block 1 and works its way down — that's a sequence."],
          ["One block, one action", "Every arrow block is exactly one move or one turn. Nothing more, nothing less."],
          ["Repeat = shortcut", "“Repeat 2 × Forward” saves a block. In bigger levels, loops save a lot of blocks."],
        ].map(([t, d], i) => (
          <div key={t} className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper p-5">
            <p className="font-mono text-xs text-blueprint">{String(i + 1).padStart(2, "0")}</p>
            <p className="mt-2 font-bold">{t}</p>
            <p className="mt-1 text-sm leading-relaxed text-charcoal">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
