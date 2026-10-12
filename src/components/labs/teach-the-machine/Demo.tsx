"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { KeyIdea, SimPanel, StageHeader } from "@/components/labs/framework/LabJourney";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { CLASS, GRAMS, knnPredict, makePreset, MM, nearest, type Label } from "./ml";
import { Plot, type KnnOverlay } from "./Plot";

const QUERIES = [
  { x: 0.98, y: 0.74 },
  { x: 0.66, y: 0.5 },
  { x: 0.42, y: 0.3 },
  { x: 0.74, y: 0.4 },
];
const STEPS = ["A new part arrives", "Measure every distance", "Keep the k nearest", "Let them vote", "Majority wins"];
const STEP_MS = 2100;

export function KnnDemo() {
  const reduce = useReducedMotion();
  const data = useMemo(() => makePreset("overlap").filter((s) => !s.test), []);
  const [qi, setQi] = useState(0);
  const [phase, setPhase] = useState(0);
  const [k, setK] = useState(3);
  const [userPlay, setUserPlay] = useState<boolean | null>(null);
  const [map, setMap] = useState(false);
  const playing = userPlay ?? !reduce;

  const advance = () => {
    if (phase < STEPS.length - 1) setPhase(phase + 1);
    else {
      setPhase(0);
      setQi((qi + 1) % QUERIES.length);
    }
  };

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => {
      if (phase < STEPS.length - 1) setPhase(phase + 1);
      else {
        setPhase(0);
        setQi((q) => (q + 1) % QUERIES.length);
      }
    }, STEP_MS);
    return () => window.clearTimeout(id);
  }, [playing, phase, qi]);

  const q = QUERIES[qi];
  const near = useMemo(() => nearest(data, q.x, q.y, k), [data, q, k]);
  const votes = [near.filter((i) => data[i].label === 0).length, near.filter((i) => data[i].label === 1).length];
  const result = knnPredict(data, q.x, q.y, k) as Label;
  const overlay: KnnOverlay = useMemo(() => ({ x: q.x, y: q.y, lines: phase === 1 ? "all" : phase >= 2 ? "near" : "none", near: phase >= 2 ? near : [], result: phase >= 4 ? result : null }), [q, phase, near, result]);
  const classify = useMemo(() => (map ? (x: number, y: number) => knnPredict(data, x, y, k) : null), [map, data, k]);

  const captions = [
    `Part ${qi + 1} of ${QUERIES.length}: ${Math.round(q.x * MM)} mm long, ${Math.round(q.y * GRAMS)} g. The machine has never seen it — is it a bolt or a nut?`,
    `The machine measures the distance from the new part to all ${data.length} training examples.`,
    `It keeps only the ${k} closest example${k === 1 ? "" : "s"} — the ones inside the dashed circle.`,
    `The neighbours vote: ${votes[0]} say bolt, ${votes[1]} say nut.`,
    `Majority wins — the machine labels the new part a ${CLASS[result].name.toUpperCase()}.`,
  ];

  return (
    <div>
      <StageHeader
        index="02"
        kicker="Demo"
        title="k-NN: ask the nearest neighbours"
        intro="The simplest learning machine there is. It doesn't calculate a rule — it just remembers every training example. When a new part arrives, it finds the examples most like it and lets them vote. Watch it classify four mystery parts, step by step."
      />
      <SimPanel
        title="k-nearest neighbours — one prediction, five steps"
        stage={
          <div className="bg-paper p-2 sm:p-3">
            <Plot samples={data} split={false} classify={classify} overlay={overlay} label={`k-nearest-neighbours demo. ${captions[phase]}`} />
          </div>
        }
        controls={
          <>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setUserPlay(!playing)} aria-pressed={playing}>
                {playing ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />} {playing ? "Pause" : "Play"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setUserPlay(false);
                  advance();
                }}
              >
                <StepForward className="size-3.5" aria-hidden /> Next step
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Restart the demo"
                onClick={() => {
                  setUserPlay(false);
                  setQi(0);
                  setPhase(0);
                }}
              >
                <RotateCcw className="size-3.5" aria-hidden />
              </Button>
            </div>

            <ol className="space-y-1">
              {STEPS.map((label, i) => (
                <li key={label} className={cn("flex items-center gap-2.5 rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-xs transition-colors", i === phase ? "border-graphite bg-graphite text-paper" : i < phase ? "border-graphite/30 text-graphite" : "border-graphite/12 text-blueprint")}>
                  <span className="font-mono opacity-70">{i + 1}</span>
                  {label}
                </li>
              ))}
            </ol>

            <div>
              <p className="annot text-charcoal">Neighbours that vote (k)</p>
              <div role="group" aria-label="Number of neighbours" className="mt-2 flex gap-1 rounded-[var(--radius-sm)] border border-graphite/15 p-1">
                {[1, 3, 5, 7].map((v) => (
                  <button key={v} type="button" aria-pressed={k === v} onClick={() => setK(v)} className={cn("h-8 flex-1 rounded-[2px] font-mono text-xs font-semibold transition-colors", k === v ? "bg-graphite text-paper" : "text-charcoal hover:bg-graphite/5")}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className={cn("rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-3 py-2.5 transition-opacity", phase >= 3 ? "opacity-100" : "opacity-40")}>
              <p className="annot text-[10px] text-blueprint">Vote count</p>
              {([0, 1] as const).map((c) => (
                <div key={c} className="mt-1.5 flex items-center gap-2 text-xs">
                  <span className="w-10">{CLASS[c].Plural}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-graphite/10" aria-hidden>
                    <span className="block h-full bg-graphite transition-all duration-500" style={{ width: phase >= 3 ? `${(votes[c] / k) * 100}%` : "0%" }} />
                  </span>
                  <span className="w-4 text-right font-mono tabular-nums">{phase >= 3 ? votes[c] : "·"}</span>
                </div>
              ))}
            </div>

            <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-charcoal">
              <input type="checkbox" className="mt-0.5 size-4 accent-graphite" checked={map} onChange={(e) => setMap(e.target.checked)} />
              <span>
                <strong className="text-graphite">Show the whole map.</strong> Repeat the vote for every spot on the chart and you get the decision regions.
              </span>
            </label>
          </>
        }
        footer={
          <p className="text-sm text-graphite" aria-live={playing ? "off" : "polite"}>
            <strong>Step {phase + 1}.</strong> {captions[phase]}
          </p>
        }
      />
      <KeyIdea title="What to notice">Change k and replay part 2 or part 4 — the answer can flip. With k = 1 one odd neighbour decides everything; with a bigger k the crowd smooths it out.</KeyIdea>
    </div>
  );
}
