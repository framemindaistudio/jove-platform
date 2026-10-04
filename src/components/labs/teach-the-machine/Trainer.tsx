"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Dices, RotateCcw, Undo2 } from "lucide-react";
import { Missions, Readout, SimPanel, Slider, useLab } from "@/components/labs/framework/LabJourney";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { addNoise, CLASS, evaluate, GRAMS, makeClassifier, makePreset, MM, pct, PRESET_INFO, trainEpoch, trainingSet, UNTRAINED, XMAX, type Algo, type Label, type Metrics, type Perceptron, type PresetId, type Sample } from "./ml";
import { Plot } from "./Plot";

export type TrainerMode = "lab" | "diet" | "noise" | "xor";

interface TState {
  mode: TrainerMode;
  preset: PresetId;
  samples: Sample[];
  algo: Algo;
  k: number;
  lr: number;
  split: boolean;
  cls: Label;
  p: Perceptron;
  epochs: number;
  noise: number;
  m: Metrics;
  done: string[];
}

interface Goal {
  id: string;
  label: string;
  test: (s: TState) => boolean;
}

interface Config {
  title: string;
  preset: PresetId;
  presets: PresetId[];
  algos: Algo[];
  algo: Algo;
  k: number;
  canAdd: boolean;
  maxTrain?: number;
  /** Learner's points always go to the training set (otherwise every third one is held back for testing). */
  trainOnly?: boolean;
  split: boolean;
  lockSplit?: boolean;
  experiments?: boolean;
  goals: Goal[];
}

const acc = (s: TState) => s.m.testAcc ?? 0;
const fitted = (s: TState) => s.algo === "knn" || s.epochs >= 1;
const mine = (s: TState, label: Label) => s.samples.filter((q) => q.user && q.label === label).length;

export const TRAINER: Record<TrainerMode, Config> = {
  lab: {
    title: "Sorting-robot trainer — bolts vs nuts",
    preset: "clean",
    presets: ["clean", "overlap", "biased", "xor", "blank"],
    algos: ["knn", "perceptron"],
    algo: "knn",
    k: 3,
    canAdd: true,
    split: false,
    experiments: true,
    goals: [
      { id: "add", label: "Add 4 examples of your own — at least 2 bolts and 2 nuts.", test: (s) => mine(s, 0) >= 2 && mine(s, 1) >= 2 },
      { id: "knn", label: "Switch on the Train / Test split and reach 85%+ test accuracy with k-NN.", test: (s) => s.split && s.algo === "knn" && s.m.nTest >= 6 && acc(s) >= 0.85 },
      { id: "perc", label: "Train a perceptron to 85%+ test accuracy.", test: (s) => s.split && s.algo === "perceptron" && s.epochs >= 1 && s.m.nTest >= 6 && acc(s) >= 0.85 },
      {
        id: "noise",
        label: "Add noisy labels, then find a k that beats k = 1 on the test set.",
        test: (s) => s.noise >= 1 && s.split && s.algo === "knn" && s.k > 1 && s.m.testAcc !== null && s.m.testAcc > (evaluate(s.samples, true, makeClassifier("knn", trainingSet(s.samples, true), 1, s.p)).testAcc ?? 1),
      },
      {
        id: "bias",
        label: "Load the Biased dataset and fix it: add examples until bolts AND nuts both score 85%+.",
        test: (s) => s.preset === "biased" && s.split && s.samples.some((q) => q.user) && s.m.nTest >= 6 && (s.m.byClass[0] ?? 0) >= 0.85 && (s.m.byClass[1] ?? 0) >= 0.85,
      },
    ],
  },
  diet: {
    title: "Challenge 1 — small data, smart data",
    preset: "diet",
    presets: ["diet"],
    algos: ["knn", "perceptron"],
    algo: "knn",
    k: 1,
    canAdd: true,
    maxTrain: 12,
    trainOnly: true,
    split: true,
    lockSplit: true,
    goals: [
      { id: "diet", label: "Reach 90%+ test accuracy using 12 training examples or fewer.", test: (s) => fitted(s) && s.m.nTrain >= 2 && s.m.nTrain <= 12 && acc(s) >= 0.9 },
      { id: "two", label: "Bonus — do it with only 2 training examples.", test: (s) => fitted(s) && s.m.nTrain === 2 && acc(s) >= 0.9 },
    ],
  },
  noise: {
    title: "Challenge 2 — beat the noise",
    preset: "noisy",
    presets: ["noisy"],
    algos: ["knn"],
    algo: "knn",
    k: 1,
    canAdd: false,
    split: true,
    lockSplit: true,
    goals: [{ id: "k", label: "Find a value of k that reaches 95%+ test accuracy.", test: (s) => acc(s) >= 0.95 }],
  },
  xor: {
    title: "Challenge 3 — the XOR wall",
    preset: "clean",
    presets: ["clean", "xor"],
    algos: ["perceptron", "knn"],
    algo: "perceptron",
    k: 3,
    canAdd: false,
    split: true,
    lockSplit: true,
    goals: [
      { id: "line", label: "Clean dataset: train the perceptron to 90%+ test accuracy.", test: (s) => s.preset === "clean" && s.algo === "perceptron" && s.epochs >= 1 && acc(s) >= 0.9 },
      { id: "wall", label: "XOR dataset: train the perceptron for 20+ epochs and watch it stay stuck.", test: (s) => s.preset === "xor" && s.algo === "perceptron" && s.epochs >= 20 && acc(s) <= 0.8 },
      { id: "bend", label: "XOR dataset: switch to k-NN and reach 90%+ test accuracy.", test: (s) => s.preset === "xor" && s.algo === "knn" && acc(s) >= 0.9 },
    ],
  },
};

type Action =
  | { type: "load"; preset: PresetId }
  | { type: "add"; x: number; y: number }
  | { type: "undo" }
  | { type: "algo"; algo: Algo }
  | { type: "k"; k: number }
  | { type: "lr"; lr: number }
  | { type: "split"; on: boolean }
  | { type: "cls"; cls: Label }
  | { type: "model"; p: Perceptron }
  | { type: "trained"; p: Perceptron; epochs: number }
  | { type: "resetModel" }
  | { type: "noise" };

/** Re-score the model and tick off any goal that has just been met. */
function settle(s: TState): TState {
  const m = evaluate(s.samples, s.split, makeClassifier(s.algo, trainingSet(s.samples, s.split), s.k, s.p));
  const next = { ...s, m };
  const hits = TRAINER[s.mode].goals.filter((g) => !s.done.includes(g.id) && g.test(next)).map((g) => g.id);
  return hits.length ? { ...next, done: [...s.done, ...hits] } : next;
}

function init(mode: TrainerMode, done: string[] = []): TState {
  const c = TRAINER[mode];
  const samples = makePreset(c.preset);
  return settle({ mode, preset: c.preset, samples, algo: c.algo, k: c.k, lr: 0.1, split: c.split, cls: 0, p: UNTRAINED, epochs: 0, noise: 0, m: evaluate([], false, () => null), done });
}

function reducer(s: TState, a: Action): TState {
  const c = TRAINER[s.mode];
  switch (a.type) {
    case "load":
      return settle({ ...s, preset: a.preset, samples: makePreset(a.preset), p: UNTRAINED, epochs: 0, noise: 0 });
    case "add": {
      if (!c.canAdd || (c.maxTrain !== undefined && s.samples.filter((q) => !q.test).length >= c.maxTrain)) return s;
      const test = !c.trainOnly && mine(s, s.cls) % 3 === 2;
      return settle({ ...s, samples: [...s.samples, { x: a.x, y: a.y, label: s.cls, test, user: true }] });
    }
    case "undo": {
      const i = s.samples.map((q) => !!q.user).lastIndexOf(true);
      return i < 0 ? s : settle({ ...s, samples: s.samples.filter((_, j) => j !== i) });
    }
    case "algo":
      return settle({ ...s, algo: a.algo });
    case "k":
      return settle({ ...s, k: a.k });
    case "lr":
      return { ...s, lr: a.lr };
    case "split":
      return c.lockSplit ? s : settle({ ...s, split: a.on });
    case "cls":
      return { ...s, cls: a.cls };
    case "model":
      return settle({ ...s, p: a.p });
    case "trained":
      return settle({ ...s, p: a.p, epochs: s.epochs + a.epochs });
    case "resetModel":
      return settle({ ...s, p: UNTRAINED, epochs: 0 });
    case "noise":
      return settle({ ...s, samples: addNoise(s.samples, s.noise + 1), noise: s.noise + 1 });
  }
}

const seg = (on: boolean) => cn("inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[2px] px-2 text-xs font-semibold transition-colors", on ? "bg-graphite text-paper" : "text-charcoal hover:bg-graphite/5");

function Glyph({ label, className }: { label: Label; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={cn("size-3", className)} aria-hidden>
      {label === 0 ? <circle cx={6} cy={6} r={4.6} fill="currentColor" /> : <rect x={1.6} y={1.6} width={8.8} height={8.8} fill="none" stroke="currentColor" strokeWidth={1.8} />}
    </svg>
  );
}

function Legend({ split }: { split: boolean }) {
  const item = "inline-flex items-center gap-1.5";
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-3 pb-3 pt-1 text-[11px] text-charcoal">
      <span className={item}>
        <Glyph label={0} /> bolt
      </span>
      <span className={item}>
        <Glyph label={1} /> nut
      </span>
      <span className={item}>
        <span className="hatch inline-block h-3 w-5 border border-graphite/40" aria-hidden /> machine says “bolt”
      </span>
      <span className={item}>
        <span className="inline-block h-3 w-5 border border-graphite/40 [background-image:radial-gradient(rgb(43_43_43/0.5)_1px,transparent_1.2px)] [background-size:5px_5px]" aria-hidden /> machine says “nut”
      </span>
      {split && (
        <span className={item}>
          <span className="inline-block size-3 rounded-full border border-dashed border-graphite" aria-hidden /> test part
        </span>
      )}
      <span className={item}>
        <span className="font-mono font-bold" aria-hidden>
          ✕
        </span>{" "}
        machine got it wrong
      </span>
    </div>
  );
}

/** `initialDone` restores goals already ticked off earlier (the challenge tabs remount the trainer). */
export function Trainer({ mode, onDone, initialDone, children }: { mode: TrainerMode; onDone?: (ids: string[]) => void; initialDone?: string[]; children?: React.ReactNode }) {
  const cfg = TRAINER[mode];
  const { completeStage } = useLab();
  const reduce = useReducedMotion();
  const [s, dispatch] = useReducer(reducer, undefined, () => init(mode, initialDone));
  const [busy, setBusy] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [status, setStatus] = useState(cfg.canAdd ? "Tap or click the plot to add an example. The shaded regions show what the machine would answer anywhere on the chart." : "The shaded regions show what the machine would answer anywhere on the chart.");
  const [kx, setKx] = useState("30");
  const [ky, setKy] = useState("20");
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    onDone?.(s.done);
    if (mode === "lab" && (s.done.includes("knn") || s.done.includes("perc"))) completeStage("hands-on");
  }, [s.done, mode, onDone, completeStage]);

  const train = useMemo(() => trainingSet(s.samples, s.split), [s.samples, s.split]);
  const classify = useMemo(() => makeClassifier(s.algo, train, s.k, s.p), [s.algo, train, s.k, s.p]);
  const nTrain = s.m.nTrain;
  const full = cfg.maxTrain !== undefined && nTrain >= cfg.maxTrain;
  const users = s.samples.filter((q) => q.user).length;
  const flipped = s.samples.filter((q) => q.flipped).length;
  const hasBoth = train.some((q) => q.label === 0) && train.some((q) => q.label === 1);
  const headline = s.split ? s.m.testAcc : s.m.trainAcc;
  const gap = s.m.byClass[0] !== null && s.m.byClass[1] !== null ? Math.abs(s.m.byClass[0] - s.m.byClass[1]) : 0;

  const stop = () => {
    window.clearTimeout(timer.current);
    setBusy(false);
    setHighlight(null);
  };

  const add = (x: number, y: number) => {
    if (busy || !cfg.canAdd) return;
    if (full) {
      setStatus(`Training budget used up: ${cfg.maxTrain} examples. Undo one to move it.`);
      return;
    }
    dispatch({ type: "add", x, y });
    setStatus(`Added a ${CLASS[s.cls].name}: ${Math.round(x * MM)} mm, ${Math.round(y * GRAMS)} g.${!cfg.trainOnly && mine(s, s.cls) % 3 === 2 ? " This one is held back as a test part." : ""}`);
  };

  const runTraining = (epochs: number) => {
    if (busy) return;
    if (!hasBoth) {
      setStatus("The perceptron needs at least one bolt and one nut to learn from.");
      return;
    }
    const where = s.samples.map((_, i) => i).filter((i) => !s.split || !s.samples[i].test);
    let p = s.p;
    let lastNudges = 0;
    const frames: { p: Perceptron; i: number | null }[] = [];
    for (let e = 1; e <= epochs; e++) {
      const r = trainEpoch(p, train, s.lr, s.epochs + e);
      if (epochs === 1) frames.push(...r.steps.map((st) => ({ p: st.p, i: where[st.i] })));
      else frames.push({ p: r.p, i: null });
      p = r.p;
      lastNudges = r.steps.length;
    }
    const finish = () => {
      dispatch({ type: "trained", p, epochs });
      setStatus(
        lastNudges === 0
          ? `Epoch ${s.epochs + epochs}: no mistakes on the training data — the line has settled.`
          : `Epoch ${s.epochs + epochs} done — the line was nudged ${lastNudges} time${lastNudges === 1 ? "" : "s"}${epochs > 1 ? " in the last pass" : ""}. ${lastNudges > 6 && s.epochs + epochs >= 20 ? "Still making mistakes after many passes: one straight line may not fit this data." : "Train again to keep improving."}`,
      );
    };
    if (reduce || !frames.length) {
      finish();
      return;
    }
    setBusy(true);
    setStatus(epochs === 1 ? "Training: each circled part is on the wrong side, so the line is nudged towards it." : `Training ${epochs} epochs — watch the boundary move.`);
    const ms = epochs === 1 ? Math.max(110, Math.min(300, 1800 / frames.length)) : 100;
    let n = 0;
    function next() {
      if (n >= frames.length) {
        stop();
        finish();
        return;
      }
      const f = frames[n++];
      dispatch({ type: "model", p: f.p });
      setHighlight(f.i);
      timer.current = window.setTimeout(next, ms);
    }
    next();
  };

  const load = (preset: PresetId) => {
    stop();
    dispatch({ type: "load", preset });
    setStatus(PRESET_INFO[preset].blurb);
  };

  const controls = (
    <>
      {cfg.canAdd && (
        <div>
          <p className="annot text-charcoal">Tap the plot to add a…</p>
          <div role="group" aria-label="Class of the next example" className="mt-2 flex gap-1 rounded-[var(--radius-sm)] border border-graphite/15 p-1">
            {([0, 1] as const).map((c) => (
              <button key={c} type="button" aria-pressed={s.cls === c} onClick={() => dispatch({ type: "cls", cls: c })} className={seg(s.cls === c)}>
                <Glyph label={c} /> {CLASS[c].Name}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-blueprint">{cfg.maxTrain !== undefined ? `Training examples: ${nTrain} / ${cfg.maxTrain}` : `Your examples: ${users}`}</span>
            <button type="button" disabled={!users || busy} onClick={() => dispatch({ type: "undo" })} className="inline-flex items-center gap-1 text-xs font-semibold text-graphite underline-offset-2 hover:underline disabled:opacity-40">
              <Undo2 className="size-3.5" aria-hidden /> Undo
            </button>
          </div>
          <details className="mt-2 text-xs text-charcoal">
            <summary className="cursor-pointer select-none text-blueprint hover:text-graphite">Add by typing instead</summary>
            <form
              className="mt-2 flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const x = Number(kx) / MM;
                const y = Number(ky) / GRAMS;
                if (Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= XMAX && y >= 0 && y <= 1) add(x, y);
                else setStatus("Length must be 0–60 mm and weight 0–40 g.");
              }}
            >
              <label className="min-w-0 flex-1">
                <span className="annot text-[10px] text-blueprint">Length mm</span>
                <input type="number" min={0} max={60} value={kx} onChange={(e) => setKx(e.target.value)} className="mt-1 h-8 w-full rounded-[var(--radius-sm)] border border-graphite/25 bg-paper px-2 font-mono text-xs" />
              </label>
              <label className="min-w-0 flex-1">
                <span className="annot text-[10px] text-blueprint">Weight g</span>
                <input type="number" min={0} max={40} value={ky} onChange={(e) => setKy(e.target.value)} className="mt-1 h-8 w-full rounded-[var(--radius-sm)] border border-graphite/25 bg-paper px-2 font-mono text-xs" />
              </label>
              <Button type="submit" size="sm" variant="secondary" disabled={busy}>
                Add
              </Button>
            </form>
          </details>
        </div>
      )}

      {cfg.algos.length > 1 && (
        <div>
          <p className="annot text-charcoal">Algorithm</p>
          <div role="group" aria-label="Learning algorithm" className="mt-2 flex gap-1 rounded-[var(--radius-sm)] border border-graphite/15 p-1">
            {cfg.algos.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={s.algo === a}
                disabled={busy}
                onClick={() => {
                  dispatch({ type: "algo", algo: a });
                  setStatus(a === "knn" ? "k-NN: no training step — it simply remembers every example and lets the nearest ones vote." : s.epochs ? "Perceptron: one straight line, moved a little after every mistake." : "Perceptron: this line was drawn before seeing any data. Press Train to let it learn.");
                }}
                className={seg(s.algo === a)}
              >
                {a === "knn" ? "k-NN" : "Perceptron"}
              </button>
            ))}
          </div>
        </div>
      )}

      {s.algo === "knn" ? (
        <Slider label="Neighbours (k)" value={s.k} min={1} max={15} step={2} onChange={(k) => dispatch({ type: "k", k })} />
      ) : (
        <div className="space-y-3">
          <Slider label="Learning rate" value={s.lr} min={0.05} max={1} step={0.05} disabled={busy} onChange={(lr) => dispatch({ type: "lr", lr })} />
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" onClick={() => runTraining(1)} disabled={busy}>
              Train 1 epoch
            </Button>
            <Button size="sm" variant="secondary" onClick={() => runTraining(20)} disabled={busy}>
              Train 20 epochs
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-blueprint">Epochs trained: {s.epochs}</span>
            <button
              type="button"
              onClick={() => {
                stop();
                dispatch({ type: "resetModel" });
                setStatus("Model reset: back to a line drawn before seeing any data.");
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-graphite underline-offset-2 hover:underline"
            >
              <RotateCcw className="size-3.5" aria-hidden /> Reset model
            </button>
          </div>
        </div>
      )}

      <label className={cn("flex items-start gap-3 rounded-[var(--radius-sm)] border border-graphite/15 px-3 py-2.5", cfg.lockSplit ? "opacity-80" : "cursor-pointer")}>
        <input type="checkbox" className="mt-0.5 size-4 accent-graphite" checked={s.split} disabled={cfg.lockSplit || busy} onChange={(e) => dispatch({ type: "split", on: e.target.checked })} />
        <span className="text-xs leading-relaxed text-charcoal">
          <strong className="block text-sm text-graphite">Train / Test split</strong>
          {cfg.lockSplit ? "Locked on: ringed parts are for testing only." : s.split ? "On: ringed parts are hidden from the machine and used only to test it." : "Off: the machine is marked on the same parts it learned from."}
        </span>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <Readout label={s.split ? "Test accuracy" : "Accuracy"} value={hasBoth || s.algo === "perceptron" ? pct(headline) : "—"} className={s.split ? "border-graphite/50" : undefined} />
        <Readout label={s.split ? "Train accuracy" : "Examples"} value={s.split ? (hasBoth || s.algo === "perceptron" ? pct(s.m.trainAcc) : "—") : s.samples.length} />
      </div>
      <p className="-mt-2 font-mono text-[11px] text-blueprint">
        {s.split ? `${nTrain} training · ${s.m.nTest} test` : "No test set — switch on the split for an honest score."}
        {flipped > 0 && ` · ${flipped} wrong labels`}
      </p>

      <div>
        <p className="annot text-charcoal">Fairness check</p>
        <div className="mt-2 space-y-1.5">
          {([0, 1] as const).map((c) => (
            <div key={c} className="flex items-center gap-2 text-xs">
              <span className="w-10 text-charcoal">{CLASS[c].Plural}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-graphite/10" aria-hidden>
                <span className="block h-full bg-graphite transition-all duration-300" style={{ width: `${(s.m.byClass[c] ?? 0) * 100}%` }} />
              </span>
              <span className="w-9 text-right font-mono tabular-nums">{pct(s.m.byClass[c])}</span>
            </div>
          ))}
        </div>
        {gap >= 0.2 && <p className="mt-2 text-[11px] leading-relaxed text-charcoal">Unfair: the machine is much better at {(s.m.byClass[0] ?? 0) > (s.m.byClass[1] ?? 0) ? "bolts than nuts" : "nuts than bolts"}. Check how many examples of each kind it was given.</p>}
      </div>

      {cfg.experiments && (
        <div>
          <p className="annot text-charcoal">Experiments</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || train.length < 4}
              onClick={() => {
                dispatch({ type: "noise" });
                setStatus("About 1 in 5 training labels just got flipped. Compare k = 1 with a bigger k — which one is fooled by the bad labels?");
              }}
            >
              <Dices className="size-3.5" aria-hidden /> Add noisy labels
            </Button>
            <Button size="sm" variant="ghost" onClick={() => load(s.preset)}>
              <RotateCcw className="size-3.5" aria-hidden /> Reset data
            </Button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div>
      {cfg.presets.length > 1 && (
        <div role="group" aria-label="Dataset" className="mb-3 flex flex-wrap items-center gap-2">
          <span className="annot mr-1 text-blueprint">Dataset</span>
          {cfg.presets.map((id) => (
            <button key={id} type="button" aria-pressed={s.preset === id} onClick={() => load(id)} className={cn("h-8 rounded-full border px-3.5 text-xs font-semibold transition-colors", s.preset === id ? "border-graphite bg-graphite text-paper" : "border-graphite/25 text-charcoal hover:border-graphite")}>
              {PRESET_INFO[id].name}
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <SimPanel
          title={cfg.title}
          stage={
            <div className="bg-paper">
              <div className="p-2 sm:p-3">
                <Plot
                  samples={s.samples}
                  split={s.split}
                  classify={classify}
                  line={s.algo === "perceptron" ? s.p : null}
                  wrong={hasBoth || s.algo === "perceptron" ? s.m.wrong : undefined}
                  highlight={highlight}
                  onAdd={cfg.canAdd ? add : undefined}
                  label={`Scatter plot of parts by length and weight: ${s.samples.filter((q) => q.label === 0).length} bolts and ${s.samples.filter((q) => q.label === 1).length} nuts. ${s.split ? `Test accuracy ${pct(s.m.testAcc)}.` : `Accuracy on the training data ${pct(s.m.trainAcc)}.`}`}
                />
              </div>
              <Legend split={s.split} />
            </div>
          }
          controls={controls}
          footer={
            <p aria-live="polite" className="text-sm text-graphite">
              {status}
            </p>
          }
        />
        <aside className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-base font-bold">{mode === "lab" ? "Experiments to try" : "Goals"}</h3>
            <span className="font-mono text-xs text-blueprint">
              {s.done.length} / {cfg.goals.length}
            </span>
          </div>
          <Missions items={cfg.goals.map((g) => ({ id: g.id, label: g.label, done: s.done.includes(g.id) }))} />
          {children}
        </aside>
      </div>
    </div>
  );
}
