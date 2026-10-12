"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { KeyIdea, Readout, SimPanel, StageHeader } from "@/components/labs/framework/LabJourney";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { fk, L1, L2, type Pose } from "./kinematics";
import { Arm, INK, Scene, sx, sy, Tag, VB } from "./Scene";

const KEYS: (Pose & { name: string; why: string })[] = [
  { name: "Home", t1: 90, t2: -90, why: "Upper arm straight up, forearm level — a safe parking pose." },
  { name: "Reach out", t1: 30, t2: -30, why: "The forearm is level again, but the shoulder has tilted the whole arm outward." },
  { name: "Stretch up", t1: 75, t2: 0, why: "Elbow at 0° — both links in one line. The tip touches the outer edge of the envelope." },
  { name: "Fold in", t1: 120, t2: -140, why: "A sharp elbow bend tucks the tip close to the base." },
  { name: "Low pick", t1: 20, t2: -95, why: "Shoulder low, forearm pointing down — the pose for picking parts off the table." },
  { name: "Other side", t1: 150, t2: 60, why: "A positive elbow angle bends the other way: the arm now works to the left of its base." },
];
const SEG_MS = 2400;
const MOVE = 0.72; // share of each segment spent moving (the rest is a pause on the keyframe)
const ease = (s: number) => (s < 0.5 ? 2 * s * s : 1 - (-2 * s + 2) ** 2 / 2);

function poseAt(t: number): Pose {
  const n = KEYS.length;
  const i = Math.floor(t) % n;
  const a = KEYS[i];
  const b = KEYS[(i + 1) % n];
  const s = ease(Math.min(1, (t - Math.floor(t)) / MOVE));
  return { t1: a.t1 + (b.t1 - a.t1) * s, t2: a.t2 + (b.t2 - a.t2) * s };
}
const f1 = (v: number) => (Math.abs(v) < 0.05 ? 0 : v).toFixed(1);

export function ArmDemo() {
  const reduce = useReducedMotion();
  const [t, setT] = useState(0);
  const [userPlay, setUserPlay] = useState<boolean | null>(null);
  const playing = userPlay ?? !reduce;
  const last = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let id = 0;
    last.current = 0;
    function tick(now: number) {
      const dt = last.current ? Math.min(64, now - last.current) : 0;
      last.current = now;
      setT((v) => v + dt / SEG_MS);
      id = requestAnimationFrame(tick);
    }
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing]);

  const pose = poseAt(t);
  const { tip } = fk(pose);
  const frac = t - Math.floor(t);
  const from = Math.floor(t) % KEYS.length;
  const to = (from + 1) % KEYS.length;
  const arrived = frac >= MOVE;
  const current = arrived ? to : from;

  // the pencil trail of the tip over the last few segments
  const trail: string[] = [];
  for (let u = Math.max(0, t - 3.2); u <= t; u += 0.02) {
    const p = fk(poseAt(u)).tip;
    trail.push(`${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`);
  }
  const a12 = pose.t1 + pose.t2;
  const labelX = Math.min(VB.x + VB.w - 70, Math.max(VB.x + 70, sx(tip.x)));

  return (
    <div>
      <StageHeader
        index="02"
        kicker="Demo"
        title="Watch two angles draw a path"
        intro="The arm runs through six saved poses, called keyframes. Nothing moves except two numbers — the shoulder angle and the elbow angle — yet the gripper tip sweeps a smooth path through the workspace. Watch the read-outs while it moves."
      />
      <SimPanel
        title="Keyframe playback — forward kinematics, live"
        stage={
          <div className="relative flex min-h-[320px] flex-col justify-center">
            <Scene label={`Robot arm moving between keyframes. Shoulder ${f1(pose.t1)} degrees, elbow ${f1(pose.t2)} degrees, tip at x ${f1(tip.x)}, y ${f1(tip.y)} centimetres.`}>
              {trail.length > 1 && <polyline points={trail.join(" ")} fill="none" stroke={INK} strokeOpacity={0.55} strokeWidth={1.6} strokeDasharray="2 5" strokeLinecap="round" />}
              {KEYS.map((k, i) => {
                const p = fk(k).tip;
                return (
                  <g key={k.name} transform={`translate(${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)})`}>
                    <circle r={i === current ? 15 : 11} fill="none" stroke={INK} strokeOpacity={i === current ? 0.9 : 0.35} strokeWidth={i === current ? 1.8 : 1.2} strokeDasharray={i === current ? undefined : "3 3"} />
                    <Tag x={0} y={-20} anchor="middle" size={12} muted={i !== current} bold={i === current}>
                      {String(i + 1)}
                    </Tag>
                  </g>
                );
              })}
              <Arm pose={pose} closed={current === 4 && arrived} showAngles />
              <Tag x={labelX} y={Math.max(VB.y + 18, sy(tip.y) + 46)} anchor="middle" bold className="text-[17px] sm:text-[14px] lg:text-[12.5px]">
                ({f1(tip.x)}, {f1(tip.y)})
              </Tag>
            </Scene>
            <p className="annot pointer-events-none absolute left-3 top-3 text-[10px] text-blueprint">Dotted line = path of the tip</p>
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
                  setT((v) => Math.floor(v) + (v - Math.floor(v) >= MOVE ? 1 : 0) + MOVE);
                }}
              >
                <SkipForward className="size-3.5" aria-hidden /> Next pose
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setUserPlay(false);
                  setT(0);
                }}
                aria-label="Restart from the home pose"
              >
                <RotateCcw className="size-3.5" aria-hidden />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Readout label="Shoulder" value={f1(pose.t1)} unit="°" />
              <Readout label="Elbow" value={f1(pose.t2)} unit="°" />
              <Readout label="Tip x" value={f1(tip.x)} unit="cm" />
              <Readout label="Tip y" value={f1(tip.y)} unit="cm" />
            </div>
            <ol className="space-y-1">
              {KEYS.map((k, i) => (
                <li key={k.name} className={cn("flex items-center justify-between rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-xs transition-colors", i === current ? "border-graphite bg-graphite text-paper" : "border-graphite/12 text-charcoal")}>
                  <span>
                    <span className="mr-2 font-mono opacity-60">{i + 1}</span>
                    {k.name}
                  </span>
                  <span className="font-mono tabular-nums">
                    {k.t1}°, {k.t2}°
                  </span>
                </li>
              ))}
            </ol>
          </>
        }
        footer={
          <div className="space-y-1.5">
            <p className="text-sm text-graphite" aria-live={playing ? "off" : "polite"}>
              <strong>{arrived ? KEYS[to].name : `${KEYS[from].name} → ${KEYS[to].name}`}.</strong> {arrived ? KEYS[to].why : "Both joints turn at the same time, each by its own amount."}
            </p>
            <p className="no-scrollbar overflow-x-auto whitespace-nowrap font-mono text-[11px] text-blueprint">
              x = {L1}·cos({f1(pose.t1)}°) + {L2}·cos({f1(a12)}°) = {f1(tip.x)} &nbsp;·&nbsp; y = {L1}·sin({f1(pose.t1)}°) + {L2}·sin({f1(a12)}°) = {f1(tip.y)}
            </p>
          </div>
        }
      />
      <KeyIdea title="What to notice">A robot never stores “where the hand is”. It stores joint angles — and the hand position is calculated from them, many times a second. That calculation is forward kinematics.</KeyIdea>
    </div>
  );
}
