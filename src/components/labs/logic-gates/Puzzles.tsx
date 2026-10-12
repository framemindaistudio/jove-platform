"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, CircleCheck, Lightbulb, ListChecks, RotateCcw, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CornerMarks } from "@/components/brand/Blueprint";
import { useLab } from "@/components/labs/framework/LabJourney";
import { CircuitBoard, GateShape } from "./Circuit";
import { combos, emptyChoices, evaluate, GATE_INFO, rowIndex, slots, type Choices, type GateType, type InputId, type Inputs, type Puzzle } from "./logic";

const STORE = "jove-logic-solved";

function readSolved(): string[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(STORE) || "[]");
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}
function writeSolved(ids: string[]) {
  try {
    window.localStorage.setItem(STORE, JSON.stringify(ids));
  } catch {
    /* storage unavailable */
  }
}

export function PuzzleSet({ puzzles, mode }: { puzzles: Puzzle[]; mode: "hands-on" | "challenge" }) {
  const { completeStage, goTo } = useLab();
  // Lab components are client-only (ssr:false), so storage can be read on first render.
  const [solved, setSolved] = useState<string[]>(() => readSolved());
  const [idx, setIdx] = useState(() => {
    const s = readSolved();
    const i = puzzles.findIndex((p) => !s.includes(p.id));
    return i < 0 ? 0 : i;
  });
  const p = puzzles[idx];
  const stripRef = useRef<HTMLDivElement>(null);

  // keep the selected puzzle visible in the horizontal strip (scrolls the strip only, never the page)
  useEffect(() => {
    const strip = stripRef.current;
    const el = strip?.children[idx] as HTMLElement | undefined;
    if (!strip || !el) return;
    strip.scrollTo({ left: el.offsetLeft - (strip.clientWidth - el.clientWidth) / 2, behavior: "smooth" });
  }, [idx]);

  const onSolved = useCallback(
    (id: string) => {
      const next = Array.from(new Set([...readSolved(), id]));
      writeSolved(next);
      setSolved(next);
      if (mode === "hands-on" && puzzles.filter((q) => next.includes(q.id)).length >= 4) completeStage("hands-on");
    },
    [mode, puzzles, completeStage],
  );

  const count = puzzles.filter((q) => solved.includes(q.id)).length;
  const last = idx === puzzles.length - 1;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="annot text-charcoal">{mode === "challenge" ? "Challenge circuits" : "Pick a puzzle"}</p>
        <p className="font-mono text-xs text-charcoal">
          {count} / {puzzles.length} solved{mode === "hands-on" && count < 4 ? ` · solve 4 to finish this stage` : ""}
        </p>
      </div>
      <div ref={stripRef} className="no-scrollbar relative -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-2" role="tablist" aria-label="Puzzles">
        {puzzles.map((q, i) => {
          const on = i === idx;
          const done = solved.includes(q.id);
          return (
            <button
              key={q.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setIdx(i)}
              className={cn(
                "flex min-w-[8.5rem] shrink-0 flex-col items-start gap-1 rounded-[10px] border px-3 py-2 text-left transition-colors",
                on ? "border-graphite bg-graphite text-paper" : done ? "border-graphite/40 bg-paper-50 text-graphite hover:border-graphite" : "border-dashed border-graphite/30 bg-paper text-charcoal hover:border-graphite/60",
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-bold">{mode === "challenge" ? `C${i + 1}` : `P${i + 1}`}</span>
                {done && <CircleCheck className="size-3.5" aria-label="solved" />}
              </span>
              <span className="max-w-[10rem] truncate text-xs font-semibold">{q.title}</span>
            </button>
          );
        })}
      </div>
      <PuzzleRunner
        key={p.id}
        puzzle={p}
        number={idx + 1}
        mode={mode}
        alreadySolved={solved.includes(p.id)}
        onSolved={onSolved}
        next={!last ? { label: "Next puzzle", go: () => setIdx(idx + 1) } : mode === "hands-on" ? { label: "On to the Challenge", go: () => goTo("challenge") } : null}
      />
    </div>
  );
}

const ZERO: Inputs = { A: false, B: false, C: false };

function PuzzleRunner({ puzzle, number, mode, alreadySolved, onSolved, next }: { puzzle: Puzzle; number: number; mode: "hands-on" | "challenge"; alreadySolved: boolean; onSolved: (id: string) => void; next: { label: string; go: () => void } | null }) {
  const ids = useMemo(() => puzzle.inputs.map((i) => i.id), [puzzle]);
  const rows = useMemo(() => combos(ids), [ids]);
  const slotList = useMemo(() => slots(puzzle), [puzzle]);
  const slotNumbers = useMemo(() => Object.fromEntries(slotList.map((g, i) => [g.id, i + 1])), [slotList]);
  const [{ inputs, choices, tested }, setS] = useState<{ inputs: Inputs; choices: Choices; tested: Record<number, boolean> }>(() => ({ inputs: ZERO, choices: emptyChoices(puzzle), tested: {} }));
  const [auto, setAuto] = useState<number | null>(null);
  const [hint, setHint] = useState(false);

  const lampFor = useCallback((v: Inputs, c: Choices) => evaluate(puzzle, v, c).lamp, [puzzle]);

  const record = useCallback(
    (v: Inputs, c: Choices, base: Record<number, boolean>) => {
      const l = lampFor(v, c);
      return l === null ? base : { ...base, [rowIndex(ids, v)]: l };
    },
    [lampFor, ids],
  );

  const toggle = (id: InputId) => {
    if (auto !== null) return;
    setS((p) => {
      const v = { ...p.inputs, [id]: !p.inputs[id] };
      return { ...p, inputs: v, tested: record(v, p.choices, p.tested) };
    });
  };

  const setGate = (gateId: string, pick: (current: GateType | null) => GateType) => {
    if (auto !== null) return;
    setS((p) => {
      const c = { ...p.choices, [gateId]: pick(p.choices[gateId] ?? null) };
      return { ...p, choices: c, tested: record(p.inputs, c, {}) }; // a new circuit → start a fresh truth table
    });
  };
  const choose = (gateId: string, t: GateType) => setGate(gateId, () => t);
  const cycle = (gateId: string) => {
    const opts = slotList.find((g) => g.id === gateId)?.options;
    if (!opts?.length) return;
    setGate(gateId, (cur) => opts[((cur ? opts.indexOf(cur) : -1) + 1) % opts.length]);
  };

  // auto-test: walk through every row of the truth table
  useEffect(() => {
    if (auto === null) return;
    const t = window.setTimeout(() => {
      if (auto >= rows.length) {
        setAuto(null);
        return;
      }
      const v = rows[auto];
      setS((p) => ({ ...p, inputs: v, tested: record(v, p.choices, p.tested) }));
      setAuto(auto + 1);
    }, auto === 0 ? 60 : 480);
    return () => window.clearTimeout(t);
  }, [auto, rows, record]);

  const complete = slotList.every((g) => choices[g.id]);
  const lamp = lampFor(inputs, choices);
  const current = rowIndex(ids, inputs);
  const testedCount = Object.keys(tested).length;
  const allTested = testedCount === rows.length;
  const mismatches = rows.filter((r, i) => i in tested && tested[i] !== puzzle.target(r)).length;
  const solved = complete && allTested && mismatches === 0;

  useEffect(() => {
    if (solved) onSolved(puzzle.id);
  }, [solved, puzzle.id, onSolved]);

  const reset = () => {
    setAuto(null);
    setS({ inputs: ZERO, choices: emptyChoices(puzzle), tested: {} });
  };

  let status: { title: string; body: string; tone: "ok" | "bad" | "info" };
  if (!complete) status = { tone: "info", title: "Fill every slot", body: `Choose a gate for ${slotList.length > 1 ? "each slot" : "the slot"} — tap the slot on the board or use the buttons.` };
  else if (mismatches > 0) status = { tone: "bad", title: "Not quite — check the red rows", body: "Your lamp does something different from what the puzzle needs. Try another gate." };
  else if (!allTested) status = { tone: "info", title: `So far so good — ${testedCount} of ${rows.length} rows tested`, body: "Flip the switches to try every combination (or press Test all) to prove your circuit works." };
  else status = { tone: "ok", title: "Lamp lit — circuit proven!", body: "Every row of the truth table matches. That's exactly how engineers test real circuits." };

  return (
    <div className="mt-5">
      <div className="relative rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 p-5 sm:p-6">
        <CornerMarks size={8} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="annot text-blueprint">
              {mode === "challenge" ? "Challenge" : "Puzzle"} {number} · {puzzle.title}
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-charcoal">{puzzle.story}</p>
            <p className="mt-2 text-base font-bold text-graphite">Goal: {puzzle.goal}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setHint((h) => !h)} aria-expanded={hint} className="inline-flex items-center gap-1.5 rounded-full border border-graphite/25 px-3 py-1.5 text-xs font-semibold hover:border-graphite">
              <Lightbulb className="size-3.5" aria-hidden /> {hint ? "Hide hint" : "Hint"}
            </button>
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-full border border-graphite/25 px-3 py-1.5 text-xs font-semibold hover:border-graphite">
              <RotateCcw className="size-3.5" aria-hidden /> Reset
            </button>
          </div>
        </div>
        {hint && <p className="mt-3 rounded-[8px] border border-graphite/15 bg-paper px-3 py-2 text-sm text-charcoal">{puzzle.hint}</p>}
        {alreadySolved && !solved && <p className="mt-3 text-xs text-blueprint">You&apos;ve solved this one before — solve it again for practice, or pick another puzzle.</p>}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        {/* board */}
        <div className="lg:col-span-7">
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-graphite shadow-[var(--shadow-lift)]">
            <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-70" />
            <div className="relative flex items-center justify-between border-b border-paper/10 px-5 py-3">
              <p className="annot text-paper/60">Circuit board</p>
              <p className="font-mono text-[11px] text-paper/60">tap switches · tap slots</p>
            </div>
            <div className="relative px-2 py-4 sm:px-4">
              <CircuitBoard def={puzzle} inputs={inputs} choices={choices} onToggle={toggle} onSlot={cycle} slotNumbers={slotNumbers} className="mx-auto block h-auto w-full" label={`Circuit for ${puzzle.title}`} />
            </div>
          </div>

          <div aria-live="polite" className={cn("mt-4 flex items-start gap-3 rounded-[var(--radius-md)] border p-4", status.tone === "ok" ? "border-graphite bg-graphite text-paper" : status.tone === "bad" ? "border-bad/40 bg-bad/5" : "border-graphite/15 bg-paper")}>
            {status.tone === "ok" ? <Trophy className="mt-0.5 size-5 shrink-0" aria-hidden /> : status.tone === "bad" ? <X className="mt-0.5 size-5 shrink-0 text-bad" aria-hidden /> : <ListChecks className="mt-0.5 size-5 shrink-0" aria-hidden />}
            <div className="min-w-0 flex-1">
              <p className={cn("font-bold", status.tone === "bad" && "text-bad")}>{status.title}</p>
              <p className={cn("mt-0.5 text-sm", status.tone === "ok" ? "text-paper/75" : "text-charcoal")}>{status.body}</p>
              {solved && next && (
                <button type="button" onClick={next.go} className="mt-3 inline-flex h-11 items-center gap-2 rounded-[10px] bg-paper px-4 text-sm font-bold text-graphite hover:bg-white">
                  {next.label} <ArrowRight className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* controls + truth table */}
        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 p-4 sm:p-5">
            <p className="annot text-charcoal">Switches</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {puzzle.inputs.map((inp) => {
                const v = inputs[inp.id];
                return (
                  <button key={inp.id} type="button" role="switch" aria-checked={v} disabled={auto !== null} onClick={() => toggle(inp.id)} className={cn("flex min-h-14 flex-col items-start justify-center rounded-[10px] border-2 px-3 py-2 text-left transition-colors disabled:opacity-60", v ? "border-graphite bg-graphite text-paper" : "border-graphite/30 bg-paper text-graphite hover:border-graphite")}>
                    <span className="flex w-full items-center justify-between font-mono text-sm font-bold">
                      {inp.id} <span>{v ? "1" : "0"}</span>
                    </span>
                    <span className={cn("truncate text-[11px]", v ? "text-paper/70" : "text-blueprint")}>{inp.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="annot mt-5 text-charcoal">Gate slots</p>
            <div className="mt-3 space-y-3">
              {slotList.map((g, i) => (
                <div key={g.id} role="radiogroup" aria-label={`Slot ${i + 1}`}>
                  <span className="block font-mono text-[11px] font-bold text-blueprint">SLOT {i + 1}</span>
                  <div className={cn("mt-1.5 grid gap-2", (g.options ?? []).length === 2 ? "grid-cols-2" : "grid-cols-3")}>
                  {(g.options ?? []).map((t) => {
                    const sel = choices[g.id] === t;
                    return (
                      <button key={t} type="button" role="radio" aria-checked={sel} disabled={auto !== null} onClick={() => choose(g.id, t)} title={GATE_INFO[t].rule} className={cn("inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-[10px] border-2 px-2 text-xs font-bold transition-colors", sel ? "border-graphite bg-graphite text-paper" : "border-graphite/25 bg-paper hover:border-graphite")}>
                        <svg viewBox="-10 -24 82 48" className="h-5 w-8 shrink-0" aria-hidden>
                          <GateShape type={t} stroke={sel ? "#F5F1E8" : "#2B2B2B"} fill={sel ? "#2B2B2B" : "#F5F1E8"} label={false} />
                        </svg>
                        {GATE_INFO[t].name}
                      </button>
                    );
                  })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-graphite/15 bg-paper p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="annot text-charcoal">Truth table builder</p>
              <button type="button" onClick={() => complete && setAuto(0)} disabled={!complete || auto !== null} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-graphite px-3 text-xs font-bold text-paper hover:bg-ink disabled:opacity-40">
                <ListChecks className="size-3.5" aria-hidden /> {auto !== null ? "Testing…" : "Test all"}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-blueprint">Rows fill in as you try switch combinations. Change a gate and the table starts again.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[260px] border-collapse text-center font-mono text-sm tabular-nums">
                <thead>
                  <tr className="border-b-2 border-graphite text-[11px] text-charcoal">
                    {ids.map((id) => (
                      <th key={id} scope="col" className="px-2 py-2 font-bold">
                        {id}
                      </th>
                    ))}
                    <th scope="col" className="px-2 py-2 font-bold">
                      Needed
                    </th>
                    <th scope="col" className="px-2 py-2 font-bold">
                      Your lamp
                    </th>
                    <th scope="col" className="w-8 px-1 py-2">
                      <span className="sr-only">Match</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const has = i in tested;
                    const need = puzzle.target(r);
                    const ok = has && tested[i] === need;
                    return (
                      <tr key={i} aria-current={i === current ? "true" : undefined} className={cn("border-b border-graphite/10 transition-colors", i === current && "bg-graphite/[0.07]", has && !ok && "bg-bad/[0.07]")}>
                        {ids.map((id) => (
                          <td key={id} className={cn("px-2 py-1.5", i === current && "font-bold")}>
                            {r[id] ? 1 : 0}
                          </td>
                        ))}
                        <td className="px-2 py-1.5 text-charcoal">{need ? "ON" : "off"}</td>
                        <td className={cn("px-2 py-1.5 font-semibold", !has && "text-blueprint/60")}>{has ? (tested[i] ? "ON" : "off") : "—"}</td>
                        <td className="px-1 py-1.5">{has ? ok ? <Check className="mx-auto size-4 text-ok" aria-label="matches" /> : <X className="mx-auto size-4 text-bad" aria-label="does not match" /> : null}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-charcoal">
              Lamp right now: <strong className="font-mono">{lamp === null ? "circuit incomplete" : lamp ? "ON" : "off"}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
