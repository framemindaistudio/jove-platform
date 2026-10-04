"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Check, Hand, MousePointerClick, RotateCcw, SlidersHorizontal, Trophy } from "lucide-react";
import { Missions, Readout, SimPanel, Slider, useLab } from "@/components/labs/framework/LabJourney";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { BLOCK, ELBOW_MAX, fk, ik, L1, L2, MIN_TIP_Y, planMove, REST_Y, SHOULDER_MAX, SHOULDER_MIN, TABLE_Y, type IkResult, type IkSolution, type Pose, type Pt } from "./kinematics";
import { Arm, BlockShape, INK, PAPER, S, Scene, sx, sy, Tag, TargetPad, VB } from "./Scene";

type Mode = "hands-on" | "challenge";
type Control = "fk" | "ik";

interface Block {
  id: string;
  x: number;
  y: number;
}
interface Sim extends Pose {
  closed: boolean;
  held: string | null;
  blocks: Block[];
}

const GRAB_R = 1.8; // the tip must be this close to a block's centre to grip it (cm)
const TOL = 1.5; // how far off-centre a block may sit on a target (cm)
const SNAP_R = 2.6; // taps in point-control snap to nearby blocks / targets (cm)
const PEDESTAL = 7.5; // blocks can't land on the robot's own base — 7.5 cm is the nearest spot the gripper can still reach
const BUDGET = 12;
const HOME: Pose = { t1: 90, t2: -90 };

const SCENES: Record<Mode, { blocks: Block[]; targets: { id: string; x: number }[]; point?: Pt }> = {
  "hands-on": {
    blocks: [
      { id: "A", x: 14, y: REST_Y },
      { id: "B", x: -13, y: REST_Y },
    ],
    targets: [
      { id: "T1", x: 23 },
      { id: "T2", x: -22 },
    ],
    point: { x: 18, y: 12 },
  },
  challenge: {
    blocks: [
      { id: "A", x: 11, y: REST_Y },
      { id: "B", x: -11, y: REST_Y },
      { id: "C", x: 17, y: REST_Y },
    ],
    targets: [
      { id: "T1", x: 24 },
      { id: "T2", x: -17 },
      { id: "T3", x: -24 },
    ],
  },
};

const MISSIONS = [
  { id: "reach", label: "Move the gripper tip onto point P (18, 12)." },
  { id: "pick", label: "Pick up block A — tip on the block, then close the gripper." },
  { id: "place", label: "Place block A on target T1." },
  { id: "ik", label: "Switch to Point control and send one IK move." },
  { id: "stack", label: "Stack one block on top of the other." },
];

const initSim = (mode: Mode): Sim => ({ ...HOME, closed: false, held: null, blocks: SCENES[mode].blocks.map((b) => ({ ...b })) });
const same = (a: number, b: number) => Math.abs(a - b) < 0.01;
const onTop = (blocks: Block[], b: Block) => blocks.find((o) => o.id !== b.id && same(o.x, b.x) && same(o.y, b.y + BLOCK));
const fmt = (v: number, d = 1) => (Math.abs(v) < 0.05 ? 0 : v).toFixed(d);

/** Where a released block comes to rest: on the table, or on top of whatever is beneath it. */
function landing(blocks: Block[], id: string, x: number): Pt {
  const lx = Math.abs(x) < PEDESTAL ? (x < 0 ? -PEDESTAL : PEDESTAL) : x;
  const column = blocks.filter((b) => b.id !== id && Math.abs(b.x - lx) < BLOCK);
  if (!column.length) return { x: lx, y: REST_Y };
  const top = column.reduce((a, b) => (b.y > a.y ? b : a));
  return { x: top.x, y: top.y + BLOCK };
}

export function ArmWorkbench({ mode }: { mode: Mode }) {
  const scene = SCENES[mode];
  const { completeStage } = useLab();
  const reduce = useReducedMotion();
  const [sim, setSim] = useState<Sim>(() => initSim(mode));
  const simRef = useRef(sim);
  const [control, setControl] = useState<Control>("fk");
  const [busy, setBusy] = useState(false);
  const [moves, setMoves] = useState(0);
  const movesRef = useRef(0);
  const lastCtl = useRef("");
  const [note, setNote] = useState("Turn the joints with the sliders — the read-outs show where the gripper tip ends up.");
  const [done, setDone] = useState<string[]>([]);
  const doneRef = useRef<string[]>([]);
  const [won, setWon] = useState<number | null>(null);
  const wonRef = useRef(false);
  const [target, setTarget] = useState<{ x: number; y: number; res: IkResult } | null>(null);
  const [ix, setIx] = useState("18");
  const [iy, setIy] = useState("12");
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const apply = useCallback((next: Sim) => {
    simRef.current = next;
    setSim(next);
  }, []);

  const countMove = useCallback((ctl: string, always = false) => {
    if (always || lastCtl.current !== ctl) {
      movesRef.current += 1;
      setMoves(movesRef.current);
    }
    lastCtl.current = ctl;
  }, []);

  const check = useCallback(
    (s: Sim, usedIk = false) => {
      const resting = s.blocks.filter((b) => b.id !== s.held);
      const filled = (x: number) => resting.some((b) => Math.abs(b.x - x) <= TOL && same(b.y, REST_Y));
      if (mode === "challenge") {
        if (!wonRef.current && scene.targets.every((t) => filled(t.x))) {
          wonRef.current = true;
          setWon(movesRef.current);
        }
        return;
      }
      const tip = fk(s).tip;
      const hits: string[] = [];
      if (scene.point && Math.hypot(tip.x - scene.point.x, tip.y - scene.point.y) <= TOL) hits.push("reach");
      if (s.held === "A") hits.push("pick");
      const a = resting.find((b) => b.id === "A");
      if (a && Math.abs(a.x - scene.targets[0].x) <= TOL && same(a.y, REST_Y)) hits.push("place");
      if (usedIk) hits.push("ik");
      if (resting.some((b) => onTop(resting, b))) hits.push("stack");
      const merged = Array.from(new Set([...doneRef.current, ...hits]));
      if (merged.length !== doneRef.current.length) {
        doneRef.current = merged;
        setDone(merged);
        if (merged.length >= 3) completeStage("hands-on");
      }
    },
    [mode, scene, completeStage],
  );

  /** Run a timed animation; `step` receives progress 0 → 1. */
  const run = useCallback(
    (ms: number, step: (p: number) => void, finish: () => void) => {
      cancelAnimationFrame(raf.current);
      if (reduce || ms <= 0) {
        step(1);
        finish();
        return;
      }
      setBusy(true);
      const t0 = performance.now();
      function tick(now: number) {
        const p = Math.min(1, (now - t0) / ms);
        step(p);
        if (p < 1) raf.current = requestAnimationFrame(tick);
        else {
          setBusy(false);
          finish();
        }
      }
      raf.current = requestAnimationFrame(tick);
    },
    [reduce],
  );

  const turn = (joint: "t1" | "t2", value: number) => {
    if (busy) return;
    const s = simRef.current;
    const next: Sim = { ...s, [joint]: value };
    if (fk(next).tip.y < MIN_TIP_Y - 1e-6) {
      setNote("Blocked — that angle would push the gripper into the table. Lift with the other joint first.");
      return;
    }
    apply(next);
    countMove(joint);
    setTarget(null);
    setNote(joint === "t1" ? "Shoulder turning — the whole arm swings around the base." : "Elbow bending — only the forearm moves.");
    check(next);
  };

  const toggleGrip = () => {
    if (busy) return;
    const s = simRef.current;
    const tip = fk(s).tip;
    lastCtl.current = "grip";
    if (!s.closed) {
      const near = s.blocks.map((b) => ({ b, d: Math.hypot(b.x - tip.x, b.y - tip.y) })).sort((p, q) => p.d - q.d)[0];
      if (near && near.d <= GRAB_R) {
        if (onTop(s.blocks, near.b)) {
          apply({ ...s, closed: true });
          setNote(`Block ${near.b.id} has another block on top of it — move the top one first.`);
          return;
        }
        const next = { ...s, closed: true, held: near.b.id };
        apply(next);
        setNote(`Gripped block ${near.b.id}. Carry it to a target, then open the gripper.`);
        check(next);
        return;
      }
      apply({ ...s, closed: true });
      setNote(near ? `Nothing to grip — the tip is ${near.d.toFixed(1)} cm from block ${near.b.id}. Get within ${GRAB_R} cm of its centre.` : "Gripper closed.");
      return;
    }
    if (!s.held) {
      apply({ ...s, closed: false });
      setNote("Gripper open.");
      return;
    }
    const id = s.held;
    const to = landing(s.blocks, id, tip.x);
    const place = (x: number, y: number): Sim => ({ ...simRef.current, closed: false, held: null, blocks: simRef.current.blocks.map((b) => (b.id === id ? { ...b, x, y } : b)) });
    run(
      Math.min(420, 140 + Math.abs(tip.y - to.y) * 22),
      (p) => apply(place(tip.x + (to.x - tip.x) * p, tip.y + (to.y - tip.y) * p * p)),
      () => {
        const t = scene.targets.find((q) => Math.abs(q.x - to.x) <= TOL && same(to.y, REST_Y));
        setNote(t ? `Block ${id} is on target ${t.id}.` : same(to.y, REST_Y) ? `Block ${id} released onto the table.` : `Block ${id} stacked.`);
        check(simRef.current);
      },
    );
  };

  const solveAt = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const res = ik(x, y);
    setTarget({ x, y, res });
    setIx(fmt(x));
    setIy(fmt(y));
    if (!res.reachable) setNote(res.reason ?? "Out of reach.");
    else if (y < MIN_TIP_Y - 1e-6) setNote(`That point is too low — the gripper tip can't go below y = ${MIN_TIP_Y} (2 cm above the table).`);
    else if (!res.solutions.some((q) => q.valid)) setNote("Inside the reach ring, but the joint limits stop the arm getting there.");
    else setNote(`IK solved: ${res.solutions.length === 2 ? "two ways" : "one way"} to reach (${fmt(x)}, ${fmt(y)}). Choose an elbow pose to move.`);
  };

  const snapPoints = (s: Sim): Pt[] => {
    const resting = s.blocks.filter((b) => b.id !== s.held);
    const pts: Pt[] = resting.filter((b) => !onTop(resting, b)).map((b) => (s.held ? { x: b.x, y: b.y + BLOCK } : { x: b.x, y: b.y }));
    if (s.held) for (const t of scene.targets) if (!resting.some((b) => Math.abs(b.x - t.x) < BLOCK)) pts.push({ x: t.x, y: REST_Y });
    if (scene.point && mode === "hands-on") pts.push(scene.point);
    return pts;
  };

  const onStage = (e: React.MouseEvent<SVGSVGElement>) => {
    if (control !== "ik" || busy) return;
    const r = e.currentTarget.getBoundingClientRect();
    const k = VB.w / r.width;
    let x = (VB.x + (e.clientX - r.left) * k) / S;
    let y = -(VB.y + (e.clientY - r.top) * k) / S;
    const snap = snapPoints(simRef.current)
      .map((p) => ({ p, d: Math.hypot(p.x - x, p.y - y) }))
      .sort((a, b) => a.d - b.d)[0];
    if (snap && snap.d <= SNAP_R) ({ x, y } = snap.p);
    else {
      x = Math.round(x * 10) / 10;
      y = Math.round(y * 10) / 10;
    }
    solveAt(x, y);
  };

  const go = (sol: IkSolution) => {
    if (busy || !sol.valid) return;
    const s = simRef.current;
    const frames = planMove(s, sol, MIN_TIP_Y);
    const from = fk(s).tip;
    const to = fk(sol).tip;
    countMove("ik", true);
    setNote(`Moving with the elbow ${sol.kind}: θ₁ = ${fmt(sol.t1)}°, θ₂ = ${fmt(sol.t2)}°.`);
    run(
      Math.min(1300, 450 + Math.hypot(to.x - from.x, to.y - from.y) * 22),
      (p) => {
        const f = frames[Math.round(p * (frames.length - 1))];
        apply({ ...simRef.current, t1: f.t1, t2: f.t2 });
      },
      () => {
        setTarget(null);
        check(simRef.current, true);
      },
    );
  };

  const reset = () => {
    cancelAnimationFrame(raf.current);
    setBusy(false);
    apply(initSim(mode));
    movesRef.current = 0;
    setMoves(0);
    lastCtl.current = "";
    wonRef.current = false;
    setWon(null);
    setTarget(null);
    setNote("Reset. The arm is back at its home pose.");
  };

  const { tip } = fk(sim);
  const heldBlock = sim.blocks.find((b) => b.id === sim.held);
  const resting = sim.blocks.filter((b) => b.id !== sim.held);
  const tipLabelX = Math.min(VB.x + VB.w - 70, Math.max(VB.x + 70, sx(tip.x)));
  const over = mode === "challenge" && moves > BUDGET;
  const blockedLow = !!target && target.y < MIN_TIP_Y - 1e-6;
  const a1 = fmt(sim.t1);
  const a12 = fmt(sim.t1 + sim.t2);

  const stage = (
    <div className={cn("relative flex min-h-[320px] flex-col justify-center", control === "ik" && !busy && "cursor-crosshair")}>
      <Scene label={`Side view of the robot arm. Shoulder ${a1} degrees, elbow ${fmt(sim.t2)} degrees, gripper tip at x ${fmt(tip.x)}, y ${fmt(tip.y)} centimetres. ${sim.held ? `Holding block ${sim.held}.` : sim.closed ? "Gripper closed." : "Gripper open."}`} onClick={onStage}>
        {scene.targets.map((t) => (
          <TargetPad key={t.id} x={t.x} label={t.id} filled={resting.some((b) => Math.abs(b.x - t.x) <= TOL && same(b.y, REST_Y))} />
        ))}
        {mode === "hands-on" && scene.point && (
          <g transform={`translate(${sx(scene.point.x)} ${sy(scene.point.y)})`}>
            <circle r={TOL * S} fill="none" stroke={INK} strokeWidth={1.3} strokeDasharray="4 3" />
            <path d="M-7 0H7M0 -7V7" stroke={INK} strokeWidth={1.6} />
            <Tag x={20} y={-12} size={13} bold={done.includes("reach")}>
              P (18, 12)
            </Tag>
          </g>
        )}
        {resting.map((b) => (
          <BlockShape key={b.id} x={b.x} y={b.y} label={b.id} />
        ))}
        {control === "ik" &&
          !busy &&
          snapPoints(sim).map((p, i) => (
            <g key={i} transform={`translate(${sx(p.x)} ${sy(p.y)})`} stroke={INK} strokeWidth={1.2}>
              <circle r={SNAP_R * S * 0.42} fill={PAPER} fillOpacity={0.6} strokeDasharray="2 3" />
              <path d="M-5 0H5M0 -5V5" />
            </g>
          ))}
        {target &&
          !busy &&
          target.res.solutions.map((q) => (
            <g key={q.kind} opacity={q.valid && !blockedLow ? 1 : 0.35}>
              <Arm pose={q} ghost tag={`elbow ${q.kind}`} />
            </g>
          ))}
        <Arm pose={sim} closed={sim.closed} showAngles held={heldBlock ? <BlockShape x={tip.x} y={tip.y} label={heldBlock.id} /> : undefined} />
        {target && !busy && (
          <g transform={`translate(${sx(target.x)} ${sy(target.y)})`} fill="none" stroke={INK} strokeWidth={2}>
            <circle r={9} fill={PAPER} fillOpacity={0.7} />
            <path d="M-15 0H-4M4 0H15M0 -15V-4M0 4V15" />
          </g>
        )}
        <Tag x={tipLabelX} y={Math.max(VB.y + 18, sy(tip.y) - 42)} anchor="middle" bold className="text-[17px] sm:text-[14px] lg:text-[12.5px]">
          ({fmt(tip.x)}, {fmt(tip.y)})
        </Tag>
      </Scene>
      <p className="annot pointer-events-none absolute left-3 top-3 text-[10px] text-blueprint">Side elevation · ruler in cm</p>
    </div>
  );

  const controls = (
    <>
      <div role="group" aria-label="Control mode" className="grid grid-cols-2 gap-1 rounded-[var(--radius-sm)] border border-graphite/15 p-1">
        {(
          [
            { v: "fk", label: "Joint control", Icon: SlidersHorizontal },
            { v: "ik", label: "Point control", Icon: MousePointerClick },
          ] as const
        ).map(({ v, label, Icon }) => (
          <button
            key={v}
            type="button"
            aria-pressed={control === v}
            onClick={() => {
              setControl(v);
              setTarget(null);
              setNote(v === "ik" ? "Point control: tap a spot on the drawing. The computer solves the joint angles — that's inverse kinematics." : "Joint control: you set the angles, the tip position follows — that's forward kinematics.");
            }}
            className={cn("inline-flex h-9 items-center justify-center gap-1.5 rounded-[2px] text-xs font-semibold transition-colors", control === v ? "bg-graphite text-paper" : "text-charcoal hover:bg-graphite/5")}
          >
            <Icon className="size-3.5" aria-hidden /> {label}
          </button>
        ))}
      </div>

      {control === "fk" ? (
        <div className="space-y-4">
          <Slider label="Shoulder angle" value={Math.round(sim.t1)} min={SHOULDER_MIN} max={SHOULDER_MAX} unit="°" disabled={busy} onChange={(v) => turn("t1", v)} />
          <Slider label="Elbow angle" value={Math.round(sim.t2)} min={-ELBOW_MAX} max={ELBOW_MAX} unit="°" disabled={busy} onChange={(v) => turn("t2", v)} />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-charcoal">Tap the drawing (it snaps to the + marks) or type a point, then pick an elbow pose.</p>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              solveAt(Number(ix), Number(iy));
            }}
          >
            {(
              [
                ["x", ix, setIx],
                ["y", iy, setIy],
              ] as const
            ).map(([name, value, set]) => (
              <label key={name} className="min-w-0 flex-1">
                <span className="annot text-[10px] text-blueprint">Target {name} (cm)</span>
                <input type="number" inputMode="decimal" step={0.5} min={-28} max={28} value={value} onChange={(e) => set(e.target.value)} className="mt-1 h-9 w-full rounded-[var(--radius-sm)] border border-graphite/25 bg-paper px-2 font-mono text-sm tabular-nums" />
              </label>
            ))}
            <Button type="submit" size="sm" variant="secondary" className="h-9" disabled={busy}>
              Solve
            </Button>
          </form>
          {target?.res.reachable && (
            <ul className="space-y-2">
              {target.res.solutions.map((q) => {
                const ok = q.valid && !blockedLow;
                return (
                  <li key={q.kind}>
                    <button type="button" disabled={!ok || busy} onClick={() => go(q)} className={cn("w-full rounded-[var(--radius-sm)] border px-3 py-2 text-left transition-colors", ok ? "border-graphite/40 hover:border-graphite hover:bg-graphite hover:text-paper" : "border-graphite/15 opacity-60")}>
                      <span className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                        Elbow {q.kind} <span className="font-mono font-medium normal-case tracking-normal">{ok ? "Move →" : "blocked"}</span>
                      </span>
                      <span className="mt-0.5 block font-mono text-xs tabular-nums">{ok ? `θ₁ ${fmt(q.t1)}° · θ₂ ${fmt(q.t2)}°` : blockedLow ? "Target is below the table limit." : q.reason}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {target && !target.res.reachable && <p className="rounded-[var(--radius-sm)] border border-dashed border-graphite/30 px-3 py-2 text-xs text-charcoal">{target.res.reason}</p>}
        </div>
      )}

      <Button variant={sim.closed ? "primary" : "secondary"} className="w-full" onClick={toggleGrip} disabled={busy} aria-pressed={sim.closed}>
        <Hand className="size-4" aria-hidden /> {sim.closed ? (sim.held ? `Release block ${sim.held}` : "Open gripper") : "Close gripper"}
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <Readout label="Shoulder" value={a1} unit="°" />
        <Readout label="Elbow" value={fmt(sim.t2)} unit="°" />
        <Readout label="Tip x" value={fmt(tip.x)} unit="cm" />
        <Readout label="Tip y" value={fmt(tip.y)} unit="cm" />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="annot text-charcoal">Moves</span>
          <span className={cn("font-mono text-sm font-semibold tabular-nums", over && "text-bad")}>
            {moves}
            {mode === "challenge" && ` / ${BUDGET}`}
          </span>
        </div>
        {mode === "challenge" && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-graphite/10" aria-hidden>
            <div className={cn("h-full transition-all", over ? "bg-bad" : "bg-graphite")} style={{ width: `${Math.min(100, (moves / BUDGET) * 100)}%` }} />
          </div>
        )}
        <p className="mt-2 text-[11px] leading-relaxed text-blueprint">Turning one joint = 1 move. One IK command = 1 move. The gripper is free.</p>
      </div>

      <Button variant="ghost" size="sm" onClick={reset}>
        <RotateCcw className="size-3.5" aria-hidden /> Reset arm &amp; blocks
      </Button>
    </>
  );

  const footer = (
    <div className="space-y-1.5">
      <p aria-live="polite" className="text-sm text-graphite">
        {note}
      </p>
      <p className="overflow-x-auto whitespace-nowrap font-mono text-[11px] text-blueprint no-scrollbar">
        x = {L1}·cos({a1}°) + {L2}·cos({a12}°) = {fmt(tip.x)} &nbsp;·&nbsp; y = {L1}·sin({a1}°) + {L2}·sin({a12}°) = {fmt(tip.y)}
      </p>
    </div>
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
      <SimPanel title={mode === "challenge" ? `Challenge cell — 3 blocks, 3 targets, ${BUDGET} moves` : "Workcell — 2-joint arm, gripper & blocks"} stage={stage} controls={controls} footer={footer} />
      <aside className="space-y-4">
        {mode === "hands-on" ? (
          <>
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-bold">Missions</h3>
              <span className="font-mono text-xs text-blueprint">
                {done.length} / {MISSIONS.length} · need 3
              </span>
            </div>
            <Missions items={MISSIONS.map((m) => ({ ...m, done: done.includes(m.id) }))} />
            {done.length >= 3 && (
              <p className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-graphite px-3 py-2.5 text-sm font-semibold text-paper">
                <Check className="mt-0.5 size-4 shrink-0" aria-hidden /> Hands-on complete. Finish the rest for practice or head to the Challenge.
              </p>
            )}
          </>
        ) : (
          <>
            <h3 className="text-base font-bold">The job</h3>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-charcoal">
              <li>Put one block on each of the targets T1, T2 and T3.</li>
              <li>
                Finish in <strong className="text-graphite">{BUDGET} moves or fewer</strong>.
              </li>
              <li>Plan before you move — which control mode costs fewer moves per trip?</li>
            </ol>
            <div role="status" className={cn("rounded-[var(--radius-md)] border p-4 text-sm", won !== null && won <= BUDGET ? "border-graphite bg-graphite text-paper" : "border-dashed border-graphite/30 text-charcoal")}>
              {won === null ? (
                <p>
                  Targets filled: <span className="font-mono font-semibold text-graphite">{scene.targets.filter((t) => resting.some((b) => Math.abs(b.x - t.x) <= TOL && same(b.y, REST_Y))).length} / 3</span>
                  {over && " · You are over budget — reset and plan a shorter sequence."}
                </p>
              ) : won <= BUDGET ? (
                <p className="flex items-start gap-2 font-semibold">
                  <Trophy className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    Job done in {won} moves — {won <= 6 ? "a perfect plan. That's the minimum possible." : won <= 9 ? "an efficient plan. The minimum is 6 — can you find it?" : "within budget. Reset and try to beat your own score."}
                  </span>
                </p>
              ) : (
                <p>
                  All three targets filled, but it took {won} moves (budget {BUDGET}). Reset and try again — one IK command replaces two joint moves.
                </p>
              )}
            </div>
          </>
        )}
        <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-4 text-xs leading-relaxed text-charcoal">
          <p className="annot mb-1.5 text-[10px] text-blueprint">Good to know</p>
          The origin (0, 0) is the shoulder joint; the table top is at y = {TABLE_Y}. A small wrist motor keeps the gripper pointing down, and its fingers reach 2 cm below the tip — so the tip stops at y = {MIN_TIP_Y}. The dashed ring is the reach envelope; joint limits and the table trim it a little.
        </div>
      </aside>
    </div>
  );
}
