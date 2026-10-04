"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Pause, Play, SkipForward } from "lucide-react";
import { StageHeader } from "@/components/labs/framework/LabJourney";
import { cn } from "@/lib/utils";
import { CircuitBoard } from "./Circuit";
import { combos, DEMOS, evaluate, gateType, GATE_INFO, rowIndex, type InputId } from "./logic";

const STEP_MS = 330;
const HOLD_MS = 1700;

export function LogicDemo() {
  const reduce = useReducedMotion();
  const [demoId, setDemoId] = useState(DEMOS[0].id);
  const [row, setRow] = useState(0);
  const [wave, setWave] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const demo = DEMOS.find((d) => d.id === demoId) ?? DEMOS[0];
  const ids = useMemo(() => demo.def.inputs.map((i) => i.id), [demo]);
  const rows = useMemo(() => combos(ids), [ids]);
  const inputs = rows[row] ?? rows[0];
  const ev = useMemo(() => evaluate(demo.def, inputs, {}), [demo, inputs]);
  const settled = reduce || wave >= ev.maxDepth;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // current flows one gate-level at a time
  useEffect(() => {
    if (reduce || wave >= ev.maxDepth) return;
    const t = window.setTimeout(() => setWave((w) => w + 1), STEP_MS);
    return () => window.clearTimeout(t);
  }, [wave, ev.maxDepth, reduce]);

  // then the switches change automatically
  useEffect(() => {
    if (!playing || !inView || !settled) return;
    const t = window.setTimeout(() => {
      setRow((r) => (r + 1) % rows.length);
      setWave(0);
    }, HOLD_MS);
    return () => window.clearTimeout(t);
  }, [playing, inView, settled, rows.length, row]);

  const pick = (id: string) => {
    setDemoId(id);
    setRow(0);
    setWave(0);
  };
  const stepNext = () => {
    setPlaying(false);
    setRow((r) => (r + 1) % rows.length);
    setWave(0);
  };
  const toggle = (id: InputId) => {
    setPlaying(false);
    setRow(rowIndex(ids, { ...inputs, [id]: !inputs[id] }));
    setWave(0);
  };

  const gates = demo.def.gates.map((g) => ({ g, t: gateType(g, {}), v: ev.values[g.id] }));

  return (
    <div ref={ref}>
      <StageHeader
        index="02"
        kicker="Demo"
        title="Watch the current flow"
        intro="The switches flip by themselves. Follow the glowing wires: the signal travels through each gate, one step at a time, until it reaches the lamp. Pick a gate to watch — or the porch-light circuit that combines two."
      />

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Choose a demo circuit">
        {DEMOS.map((d) => (
          <button key={d.id} type="button" role="tab" aria-selected={d.id === demoId} onClick={() => pick(d.id)} className={cn("h-10 rounded-full border px-4 text-sm font-semibold transition-colors", d.id === demoId ? "border-graphite bg-graphite text-paper" : "border-graphite/25 hover:border-graphite")}>
            {d.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-graphite shadow-[var(--shadow-lift)]">
            <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-70" />
            <div className="relative flex items-center justify-between border-b border-paper/10 px-5 py-3">
              <p className="annot text-paper/60">Live circuit · {demo.label}</p>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setPlaying((p) => !p)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-paper px-3 text-xs font-bold text-graphite hover:bg-white">
                  {playing ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5 fill-current" aria-hidden />}
                  {playing ? "Pause" : "Play"}
                </button>
                <button type="button" onClick={stepNext} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-paper/40 px-3 text-xs font-bold text-paper hover:bg-paper/10">
                  <SkipForward className="size-3.5" aria-hidden /> Next
                </button>
              </div>
            </div>
            <div className="relative px-2 py-4 sm:px-4">
              <CircuitBoard def={demo.def} inputs={inputs} choices={{}} wave={reduce ? Infinity : wave} onToggle={toggle} className="mx-auto block h-auto w-full" label={`${demo.label} demo circuit`} />
            </div>
            <p aria-live="polite" className="relative border-t border-paper/10 px-5 py-3 font-mono text-xs text-paper/80">
              {ids.map((id) => `${id}=${inputs[id] ? 1 : 0}`).join("  ")}
              {gates.map(({ g, t, v }) => (t && (settled || (ev.depth[g.id] ?? 0) <= wave) ? `  →  ${GATE_INFO[t].name} gives ${v ? 1 : 0}` : "")).join("")}
              {settled ? `  →  lamp ${ev.lamp ? "ON" : "OFF"}` : "  …"}
            </p>
          </div>
          <p className="mt-3 text-sm text-charcoal">{demo.about} Tap a switch on the board to try your own combination.</p>
        </div>

        <div className="lg:col-span-4">
          <div className="rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 p-5">
            <p className="annot text-charcoal">Truth table</p>
            <table className="mt-3 w-full border-collapse text-center font-mono text-sm tabular-nums">
              <thead>
                <tr className="border-b-2 border-graphite text-[11px] text-charcoal">
                  {ids.map((id) => (
                    <th key={id} scope="col" className="py-2">
                      {id}
                    </th>
                  ))}
                  <th scope="col" className="py-2">
                    Lamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const l = evaluate(demo.def, r, {}).lamp;
                  const cur = i === row;
                  return (
                    <tr key={i} className={cn("border-b border-graphite/10 transition-colors duration-300", cur && "bg-graphite text-paper")}>
                      {ids.map((id) => (
                        <td key={id} className="py-1.5">
                          {r[id] ? 1 : 0}
                        </td>
                      ))}
                      <td className="py-1.5 font-bold">{cur && !settled ? "…" : l ? "ON" : "off"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-4 text-xs leading-relaxed text-charcoal">
              {rows.length} rows because {ids.length === 1 ? "1 switch has 2 positions" : `${ids.length} switches give ${ids.map(() => 2).join(" × ")} = ${rows.length} combinations`}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
