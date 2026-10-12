"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Flag, Gem, Lightbulb, Pause, Play, Rabbit, RotateCcw, Star, StepForward, Trash2, Trophy, Turtle, Footprints } from "lucide-react";
import { cn } from "@/lib/utils";
import { CornerMarks } from "@/components/brand/Blueprint";
import { useLab } from "@/components/labs/framework/LabJourney";
import { Board, RoverSprite } from "./Board";
import { DEFAULT_MAX_BLOCKS, Palette, ProgramEditor, tryInsert, type PlaceRules } from "./Blocks";
import { countBlocks, findBlock, parseLevel, starsFor, type Block, type BlockKind, type LevelDef, type Sim } from "./engine";
import { SPEEDS, useRover, type SpeedId } from "./useRover";

const STORE = "jove-rover-stars";
type StarMap = Record<string, number>;

function readStars(): StarMap {
  try {
    return JSON.parse(window.localStorage.getItem(STORE) || "{}") as StarMap;
  } catch {
    return {};
  }
}
function writeStars(m: StarMap) {
  try {
    window.localStorage.setItem(STORE, JSON.stringify(m));
  } catch {
    /* storage unavailable — progress just won't persist */
  }
}

const cell = (x: number, y: number) => `${String.fromCharCode(65 + x)}${y + 1}`;

export function Stars({ n, size = "size-4", className }: { n: number; size?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${n} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <Star key={i} className={cn(size, i <= n ? "fill-current" : "opacity-30")} aria-hidden />
      ))}
    </span>
  );
}

/* ───────────────────────── level picker + persistence ───────────────────────── */

export function Playground({ levels, mode }: { levels: LevelDef[]; mode: "hands-on" | "challenge" }) {
  const { completeStage, goTo } = useLab();
  // Lab components are client-only (ssr:false), so reading storage on first render is safe.
  const [stars, setStars] = useState<StarMap>(() => readStars());
  const [idx, setIdx] = useState(() => {
    const s = readStars();
    const firstOpen = levels.findIndex((l) => !s[l.id]);
    return firstOpen < 0 ? 0 : firstOpen;
  });
  const [programs, setPrograms] = useState<Record<string, Block[]>>({});
  const def = levels[idx];
  const stripRef = useRef<HTMLDivElement>(null);

  // keep the selected level visible in the horizontal strip (scrolls the strip only, never the page)
  useEffect(() => {
    const strip = stripRef.current;
    const el = strip?.children[idx] as HTMLElement | undefined;
    if (!strip || !el) return;
    strip.scrollTo({ left: el.offsetLeft - (strip.clientWidth - el.clientWidth) / 2, behavior: "smooth" });
  }, [idx]);

  const onSolved = useCallback(
    (id: string, n: number) => {
      setStars((prev) => {
        if ((prev[id] ?? 0) >= n) return prev;
        const next = { ...prev, [id]: n };
        writeStars(next);
        return next;
      });
      if (mode === "hands-on") {
        const solved = new Set([...Object.keys(readStars()).filter((k) => levels.some((l) => l.id === k)), id]);
        if (solved.size >= 4) completeStage("hands-on");
      }
    },
    [mode, levels, completeStage],
  );

  const total = levels.reduce((s, l) => s + (stars[l.id] ?? 0), 0);

  return (
    <div>
      {/* level select */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="annot text-charcoal">{mode === "challenge" ? "Challenge levels" : "Pick a level"}</p>
        <p className="inline-flex items-center gap-2 font-mono text-xs text-charcoal">
          <Star className="size-3.5 fill-current" aria-hidden /> {total} / {levels.length * 3} stars
        </p>
      </div>
      <div ref={stripRef} className="no-scrollbar relative -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-2" role="tablist" aria-label="Levels">
        {levels.map((l, i) => {
          const on = i === idx;
          const s = stars[l.id] ?? 0;
          return (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setIdx(i)}
              className={cn(
                "flex min-w-[7.5rem] shrink-0 flex-col items-start gap-1 rounded-[10px] border-2 px-3 py-2 text-left transition-colors",
                on ? "border-graphite bg-graphite text-paper" : s ? "border-graphite/40 bg-paper-50 text-graphite hover:border-graphite" : "border-dashed border-graphite/30 bg-paper text-charcoal hover:border-graphite/60",
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-bold">{mode === "challenge" ? `C${i + 1}` : `L${i + 1}`}</span>
                <Stars n={s} size="size-3" />
              </span>
              <span className="max-w-[9rem] truncate text-xs font-semibold">{l.name}</span>
            </button>
          );
        })}
      </div>

      <LevelRunner
        key={def.id}
        def={def}
        mode={mode}
        levelNo={idx + 1}
        best={stars[def.id] ?? 0}
        initialProgram={programs[def.id]}
        remember={(p) => setPrograms((m) => ({ ...m, [def.id]: p }))}
        onSolved={onSolved}
        onNext={
          idx < levels.length - 1
            ? () => setIdx(idx + 1)
            : mode === "hands-on"
              ? () => goTo("challenge")
              : undefined
        }
        nextLabel={idx < levels.length - 1 ? "Next level" : mode === "hands-on" ? "On to the Challenge" : undefined}
      />
    </div>
  );
}

/* ───────────────────────── one level ───────────────────────── */

function feedback(sim: Sim, def: LevelDef, blocks: number, gemsLeft: number) {
  switch (sim.status) {
    case "success": {
      const s = starsFor(def, blocks);
      return {
        tone: "ok" as const,
        title: s === 3 ? "Perfect! Three stars!" : s === 2 ? "Great driving!" : "You did it!",
        body: s === 3 ? `${blocks} blocks — that's the shortest program we know. Brilliant coding!` : `You used ${blocks} blocks. Can you finish in ${def.par} for three stars?`,
      };
    }
    case "crash":
      return { tone: "bad" as const, title: "Bonk! A rock is in the way.", body: `The rover bumped into a rock at ${sim.blocked ? cell(sim.blocked.x, sim.blocked.y) : "the next square"}. The red block is where it went wrong — fix it and run again. That's debugging!` };
    case "edge":
      return { tone: "bad" as const, title: "Whoa — that's the edge of the map!", body: "The rover nearly drove off the map. Check your turns: is it facing the right way before it moves?" };
    case "short":
      return { tone: "info" as const, title: "Almost there!", body: `The program ended before the rover finished.${gemsLeft ? ` ${gemsLeft} gem${gemsLeft > 1 ? "s are" : " is"} still waiting.` : ""} Add more blocks and try again.` };
    case "missed":
      return { tone: "info" as const, title: "You reached the flag — but missed a gem!", body: "Collect every gem before you finish at the flag." };
    case "battery":
      return { tone: "bad" as const, title: "Battery empty!", body: "The rover made more than 200 moves. A Repeat number is probably too big." };
    case "empty":
      return { tone: "info" as const, title: "Your program is empty.", body: "Tap a block (or drag one) into your program first, then press Run." };
    default:
      return null;
  }
}

function LevelRunner({
  def,
  mode,
  levelNo,
  best,
  initialProgram,
  remember,
  onSolved,
  onNext,
  nextLabel,
}: {
  def: LevelDef;
  mode: "hands-on" | "challenge";
  levelNo: number;
  best: number;
  initialProgram?: Block[];
  remember: (p: Block[]) => void;
  onSolved: (id: string, stars: number) => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  const level = useMemo(() => parseLevel(def), [def]);
  const [program, setProgramState] = useState<Block[]>(() => initialProgram ?? []);
  const [target, setTarget] = useState<string | null>(null);
  const [speed, setSpeed] = useState<SpeedId>("normal");
  const [showHint, setShowHint] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const ms = SPEEDS.find((s) => s.id === speed)?.ms ?? 560;
  const rover = useRover(level, program, ms);
  const rules: PlaceRules = { allowed: def.allowed, maxBlocks: def.maxBlocks ?? DEFAULT_MAX_BLOCKS };
  const blocks = countBlocks(program);
  const gemsLeft = level.gems.length - rover.sim.collected.length;
  const fb = feedback(rover.sim, def, blocks, gemsLeft);
  const success = rover.sim.status === "success";
  const crashed = rover.sim.status === "crash" || rover.sim.status === "edge";

  // report a solve (once per run — editing the program resets the run)
  useEffect(() => {
    if (success) onSolved(def.id, starsFor(def, blocks));
  }, [success, rover.runId, def, blocks, onSolved]);

  const setProgram = (p: Block[]) => {
    setProgramState(p);
    remember(p);
    rover.reset();
    setNotice(null);
    // drop a stale insertion target
    if (target && !findBlock(p, target)) setTarget(null);
  };

  const add = (k: BlockKind) => {
    const container = target && findBlock(program, target) ? target : null;
    const r = tryInsert(program, k, container, Number.MAX_SAFE_INTEGER, rules);
    if ("error" in r) {
      setNotice(r.error);
      return;
    }
    setProgram(r.program);
    if (r.block.kind === "repeat") setTarget(r.block.id);
  };

  const targetLabel = target && findBlock(program, target) ? "the selected Repeat" : "the main program";
  const limitHit = blocks >= rules.maxBlocks;

  return (
    <div className="mt-5 grid gap-6 lg:grid-cols-12">
      {/* ── board ── */}
      <div className="lg:col-span-7">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)]">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-graphite/10 px-5 py-4">
            <div className="min-w-0">
              <p className="annot text-blueprint">
                {mode === "challenge" ? "Challenge" : "Level"} {levelNo} · {def.name}
              </p>
              <p className="mt-1 text-[15px] font-semibold leading-snug text-graphite">{def.mission}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1 rounded-full border border-graphite/20 bg-paper px-2.5 py-1 font-mono text-[11px] font-semibold" aria-label={`Gems collected: ${rover.sim.collected.length} of ${level.gems.length}`}>
                <Gem className="size-3" aria-hidden /> {rover.sim.collected.length}/{level.gems.length}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-graphite/20 bg-paper px-2.5 py-1 font-mono text-[11px] font-semibold" aria-label={`Flag at square ${cell(level.flag.x, level.flag.y)}`}>
                <Flag className="size-3" aria-hidden /> {cell(level.flag.x, level.flag.y)}
              </span>
              {best > 0 && <Stars n={best} className="text-graphite" />}
              <button type="button" onClick={() => setShowHint((v) => !v)} aria-expanded={showHint} className="inline-flex items-center gap-1.5 rounded-full border border-graphite/25 px-3 py-1.5 text-xs font-semibold hover:border-graphite">
                <Lightbulb className="size-3.5" aria-hidden /> {showHint ? "Hide hint" : "Hint"}
              </button>
            </div>
          </div>
          <AnimatePresence initial={false}>
            {showHint && (
              <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-graphite/10 bg-paper px-5 text-sm leading-relaxed text-charcoal">
                <span className="block py-3">{def.hint}</span>
              </motion.p>
            )}
          </AnimatePresence>

          <div className="relative bg-paper bp-grid p-3 sm:p-5">
            <CornerMarks size={8} className="text-graphite/40" />
            <Board level={level} sim={rover.sim} duration={Math.round(ms * 0.8)} className="mx-auto block h-auto max-h-[min(62vh,540px)] w-full" label={`Map for ${def.name}`} />
          </div>

          {/* run controls */}
          <div className="flex flex-wrap items-center gap-3 border-t border-graphite/10 px-4 py-4 sm:px-5">
            {rover.running ? (
              <button type="button" onClick={rover.pause} className="inline-flex h-14 min-w-[8.5rem] items-center justify-center gap-2 rounded-[14px] border-2 border-graphite bg-paper px-6 text-base font-bold shadow-[3px_3px_0_0_rgba(43,43,43,0.9)] active:translate-y-[2px] active:shadow-none">
                <Pause className="size-5" aria-hidden /> Pause
              </button>
            ) : (
              <button type="button" onClick={rover.run} className="inline-flex h-14 min-w-[8.5rem] items-center justify-center gap-2 rounded-[14px] border-2 border-graphite bg-graphite px-6 text-base font-bold text-paper shadow-[3px_3px_0_0_rgba(22,22,22,0.6)] transition-transform hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none">
                <Play className="size-5 fill-current" aria-hidden /> {rover.started && !rover.finished ? "Continue" : "Run"}
              </button>
            )}
            <button type="button" onClick={rover.step} className="inline-flex h-12 items-center gap-2 rounded-[12px] border-2 border-graphite/70 bg-paper px-4 text-sm font-bold hover:border-graphite">
              <StepForward className="size-4" aria-hidden /> Step
            </button>
            <button type="button" onClick={rover.reset} disabled={!rover.started} className="inline-flex h-12 items-center gap-2 rounded-[12px] border-2 border-graphite/70 bg-paper px-4 text-sm font-bold hover:border-graphite disabled:opacity-40">
              <RotateCcw className="size-4" aria-hidden /> Reset
            </button>
            <div className="ml-auto flex items-center gap-1 rounded-full border border-graphite/20 bg-paper p-1" role="radiogroup" aria-label="Rover speed">
              {SPEEDS.map((s) => {
                const Icon = s.id === "slow" ? Turtle : s.id === "fast" ? Rabbit : Footprints;
                return (
                  <button key={s.id} type="button" role="radio" aria-checked={speed === s.id} aria-label={s.label} title={s.label} onClick={() => setSpeed(s.id)} className={cn("grid size-9 place-items-center rounded-full transition-colors", speed === s.id ? "bg-graphite text-paper" : "text-charcoal hover:bg-graphite/10")}>
                    <Icon className="size-4" aria-hidden />
                  </button>
                );
              })}
            </div>
          </div>

          {/* feedback */}
          <div aria-live="polite" className="border-t border-graphite/10">
            {fb ? (
              <div className={cn("flex items-start gap-4 px-5 py-4", success ? "bg-graphite text-paper" : "bg-paper")}>
                <svg viewBox="-30 -32 60 60" className="size-14 shrink-0" aria-hidden>
                  <defs>
                    <pattern id={`fb-hatch-${def.id}`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                      <line x1="0" y1="0" x2="0" y2="5" stroke="#2B2B2B" strokeWidth="1" strokeOpacity="0.45" />
                    </pattern>
                  </defs>
                  <circle r="28" fill="#FBF9F4" stroke={success ? "#FBF9F4" : "#2B2B2B"} strokeOpacity="0.4" />
                  <RoverSprite hatchId={`fb-hatch-${def.id}`} happy={success || fb.tone === "info"} />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-base font-bold", fb.tone === "bad" && "text-bad")}>{fb.title}</p>
                  <p className={cn("mt-1 text-sm leading-relaxed", success ? "text-paper/75" : "text-charcoal")}>{fb.body}</p>
                  {success && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Stars n={starsFor(def, blocks)} size="size-6" />
                      {onNext && nextLabel && (
                        <button type="button" onClick={onNext} className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-paper px-4 text-sm font-bold text-graphite hover:bg-white">
                          {nextLabel === "On to the Challenge" ? <Trophy className="size-4" aria-hidden /> : null}
                          {nextLabel} <ArrowRight className="size-4" aria-hidden />
                        </button>
                      )}
                      <button type="button" onClick={rover.reset} className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-paper/40 px-4 text-sm font-semibold hover:bg-paper/10">
                        <RotateCcw className="size-4" aria-hidden /> Play again
                      </button>
                    </div>
                  )}
                  {(crashed || rover.sim.status === "battery") && (
                    <button type="button" onClick={rover.reset} className="mt-3 inline-flex h-10 items-center gap-2 rounded-[10px] border-2 border-graphite/70 px-3 text-sm font-semibold hover:border-graphite">
                      <RotateCcw className="size-4" aria-hidden /> Reset and fix it
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="px-5 py-4 text-sm text-charcoal">
                {rover.running || rover.started ? (
                  <>
                    Running… step <span className="font-mono font-semibold">{rover.cursor}</span> of <span className="font-mono">{rover.total}</span>
                  </>
                ) : (
                  <>Build your program with the blocks, then press <strong>Run</strong> — or <strong>Step</strong> to go one block at a time.</>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── code ── */}
      <div className="space-y-5 lg:col-span-5">
        <div className="rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 p-4 sm:p-5">
          <Palette allowed={def.allowed} onAdd={add} targetLabel={targetLabel} disabledReason={rover.running ? "Wait for the rover to stop" : limitHit ? `Block limit reached (${rules.maxBlocks})` : null} />
          {notice && (
            <p role="status" className="mt-3 rounded-[8px] border border-graphite/20 bg-paper px-3 py-2 text-xs text-charcoal">
              {notice}
            </p>
          )}
        </div>
        <div className="rounded-[var(--radius-lg)] border border-graphite/15 bg-paper p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="annot text-charcoal">Your program</p>
            <div className="flex items-center gap-3">
              <span className={cn("font-mono text-xs", def.maxBlocks && limitHit ? "font-bold text-graphite" : "text-blueprint")}>
                {blocks}
                {def.maxBlocks ? ` / ${def.maxBlocks}` : ""} blocks · <Star className="inline size-3 fill-current align-[-1px]" aria-hidden />×3 at ≤ {def.par}
              </span>
              {program.length > 0 && (
                <button type="button" disabled={rover.running} onClick={() => setProgram([])} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-charcoal hover:bg-graphite/10 disabled:opacity-40">
                  <Trash2 className="size-3.5" aria-hidden /> Clear
                </button>
              )}
            </div>
          </div>
          <ProgramEditor
            program={program}
            onChange={setProgram}
            locked={rover.running}
            activeId={rover.started ? rover.current?.blockId : undefined}
            errorId={crashed ? rover.current?.blockId : undefined}
            loopIters={rover.started && !rover.finished ? rover.loopIters : undefined}
            target={target && findBlock(program, target) ? target : null}
            onTarget={setTarget}
            rules={rules}
            onNotice={setNotice}
          />
        </div>
      </div>
    </div>
  );
}
