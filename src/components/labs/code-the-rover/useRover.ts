"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { applyAction, compile, endStatus, initSim, type Block, type Level, type Sim, type Step } from "./engine";

/**
 * Runs a rover program one step at a time (Run / Pause / Step / Reset).
 * Consumers should remount (key) the component that owns this hook when the level changes.
 */
interface RunState {
  sim: Sim;
  steps: Step[];
  truncated: boolean;
  /** number of steps already executed */
  cursor: number;
  running: boolean;
  finished: boolean;
  /** increments on every fresh start (used to restart animations / callbacks) */
  runId: number;
}

function fresh(level: Level, runId = 0): RunState {
  return { sim: initSim(level), steps: [], truncated: false, cursor: 0, running: false, finished: false, runId };
}

function start(level: Level, program: Block[], runId: number, running: boolean): RunState {
  const { steps, truncated } = compile(program);
  const base = fresh(level, runId + 1);
  if (!steps.length) return { ...base, sim: { ...base.sim, status: "empty" }, finished: true };
  return { ...base, steps, truncated, running };
}

function advance(level: Level, s: RunState): RunState {
  if (s.finished) return { ...s, running: false };
  if (s.cursor >= s.steps.length) {
    return { ...s, sim: { ...s.sim, status: endStatus(level, s.sim, s.truncated) }, running: false, finished: true };
  }
  const sim = applyAction(level, s.sim, s.steps[s.cursor].action);
  const cursor = s.cursor + 1;
  if (sim.status !== "moving") return { ...s, sim, cursor, running: false, finished: true };
  // last block done → settle the final status right away (keeps "Step" snappy)
  if (cursor >= s.steps.length) {
    return { ...s, sim: { ...sim, status: endStatus(level, sim, s.truncated) }, cursor, running: false, finished: true };
  }
  return { ...s, sim, cursor };
}

export function useRover(level: Level, program: Block[], delay: number) {
  const [state, setState] = useState<RunState>(() => fresh(level));

  useEffect(() => {
    if (!state.running) return;
    const t = window.setTimeout(() => setState((s) => advance(level, s)), state.cursor === 0 ? 120 : delay);
    return () => window.clearTimeout(t);
  }, [state.running, state.cursor, delay, level]);

  const run = useCallback(() => {
    setState((s) => {
      if (s.running) return s;
      if (s.finished || s.cursor === 0) return start(level, program, s.runId, true);
      return { ...s, running: true };
    });
  }, [level, program]);

  const pause = useCallback(() => setState((s) => ({ ...s, running: false })), []);

  const step = useCallback(() => {
    setState((s) => {
      if (s.running) return { ...s, running: false };
      const base = s.finished || s.cursor === 0 ? start(level, program, s.runId, false) : s;
      if (base.finished) return base;
      return advance(level, base);
    });
  }, [level, program]);

  const reset = useCallback(() => setState((s) => fresh(level, s.runId + 1)), [level]);

  const current: Step | undefined = state.cursor > 0 ? state.steps[state.cursor - 1] : undefined;
  const loopIters = useMemo(() => {
    const m = new Map<string, string>();
    current?.loops.forEach((l) => m.set(l.id, `${l.iter}/${l.times}`));
    return m;
  }, [current]);

  return {
    sim: state.sim,
    running: state.running,
    finished: state.finished,
    started: state.cursor > 0 || state.finished,
    cursor: state.cursor,
    total: state.steps.length,
    runId: state.runId,
    current,
    loopIters,
    run,
    pause,
    step,
    reset,
  };
}

export const SPEEDS = [
  { id: "slow", label: "Slow", ms: 950 },
  { id: "normal", label: "Normal", ms: 560 },
  { id: "fast", label: "Fast", ms: 260 },
] as const;
export type SpeedId = (typeof SPEEDS)[number]["id"];
