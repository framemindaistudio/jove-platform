"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Crosshair, Play, RotateCcw } from "lucide-react";
import { Missions, Readout, SimPanel, Slider, StageHeader, useLab } from "@/components/labs/framework/LabJourney";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { brakingDistance, CAR_DT, DEFAULT_CAR, newCar, RUNWAY, runToEnd, stepCar, ZONE, type CarConfig, type CarSim, type Floor } from "./car";
import { Arcs, Arrow, B, BAD, Dim, G, HatchDefs, P50, PencilRect, SensorRight } from "./parts";
import { echoTimeUs, fmt, SENSOR_MAX_CM, SENSOR_MIN_CM, speedOfSound } from "./physics";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* ───────────────────────── missions ───────────────────────── */

type MissionId = "target" | "park" | "fast" | "top" | "wet" | "slow";

const MISSIONS: { id: MissionId; label: string }[] = [
  { id: "target", label: "Echo ruler — place the wall so the echo takes about 2,000 µs, then press Check." },
  { id: "park", label: "First safe stop — park the robot car inside the safe zone." },
  { id: "fast", label: "Faster — park safely at 60 cm/s or more." },
  { id: "top", label: "Top speed — park safely at 100 cm/s." },
  { id: "wet", label: "Wet floor — park safely on the wet floor at 60 cm/s or more." },
  { id: "slow", label: "Slow sensor — park safely with only 5 readings a second, at 50 cm/s or more." },
];
const NEEDED = 3;

/** Missions survive hopping between stages (until the page is reloaded). */
const session: { done: Partial<Record<MissionId, boolean>> } = { done: {} };
const remember = (done: Partial<Record<MissionId, boolean>>) => {
  session.done = done;
};

/* ───────────────────────── experiment A · the echo ruler ───────────────────────── */

const RX0 = 74;
const RPX = 1.45;
const TARGET_US = 2000;
const TARGET_TOL = 60;

function EchoRuler({ onTarget }: { onTarget: () => void }) {
  const [dist, setDist] = useState(120);
  const [temp, setTemp] = useState(20);
  const [verdict, setVerdict] = useState<null | "hit" | "short" | "long">(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const speed = Math.round(speedOfSound(temp));
  const t = echoTimeUs(dist, speed);
  const wallX = RX0 + dist * RPX;
  const cone = Math.min(46, dist * RPX * 0.27);

  const move = (d: number) => {
    setDist(clamp(Math.round(d), SENSOR_MIN_CM, SENSOR_MAX_CM));
    setVerdict(null);
  };
  const fromPointer = (clientX: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    move((((clientX - r.left) / r.width) * 680 - RX0) / RPX);
  };
  const check = () => {
    const diff = t - TARGET_US;
    if (Math.abs(diff) <= TARGET_TOL) {
      setVerdict("hit");
      onTarget();
    } else setVerdict(diff < 0 ? "short" : "long");
  };

  return (
    <SimPanel
      title="Experiment A · the echo ruler"
      stage={
        <div className="flex h-full min-h-[320px] flex-col justify-center">
          <svg ref={svgRef} viewBox="0 0 680 270" role="group" aria-label={`A sensor facing a movable wall ${dist} centimetres away. Echo time ${fmt(t)} microseconds.`} className="block h-auto w-full select-none">
            <HatchDefs id="echo-ruler-wall" />
            {/* ruler */}
            <line x1={RX0} y1={214} x2={RX0 + 400 * RPX} y2={214} stroke={G} strokeWidth={1.4} />
            {Array.from({ length: 9 }, (_, i) => i * 50).map((cm) => (
              <g key={cm}>
                <line x1={RX0 + cm * RPX} y1={cm % 100 ? 210 : 207} x2={RX0 + cm * RPX} y2={cm % 100 ? 218 : 221} stroke={G} strokeWidth={1.3} />
                {cm % 100 === 0 && (
                  <text x={RX0 + cm * RPX} y={238} textAnchor="middle" fontSize={15} fill={B} className="font-mono">
                    {cm}
                  </text>
                )}
              </g>
            ))}
            <text x={RX0 + 400 * RPX} y={258} textAnchor="end" fontSize={13} fill={B} className="font-mono">
              distance (cm)
            </text>

            {/* the cone of sound */}
            <path d={`M${RX0} 112L${wallX} ${112 - cone}V${112 + cone}Z`} fill={G} opacity={0.06} />
            {dist * RPX > 44 && (
              <>
                <Arrow x1={RX0 + 8} y1={96} x2={wallX - 6} y2={96} width={1.8} />
                <Arrow x1={wallX - 6} y1={128} x2={RX0 + 8} y2={128} dashed color={B} width={1.8} />
              </>
            )}
            <SensorRight x={RX0} y={112} s={1.15} />
            <Arcs x={RX0 + 4} y={112} n={2} r0={9} gap={7} width={1.4} opacity={0.6} />

            {/* draggable wall */}
            <g
              role="slider"
              tabIndex={0}
              aria-label="Wall distance"
              aria-valuemin={SENSOR_MIN_CM}
              aria-valuemax={SENSOR_MAX_CM}
              aria-valuenow={dist}
              aria-valuetext={`${dist} centimetres`}
              className="group/wall cursor-ew-resize outline-none"
              style={{ touchAction: "none" }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                dragging.current = true;
                fromPointer(e.clientX);
              }}
              onPointerMove={(e) => {
                if (dragging.current) fromPointer(e.clientX);
              }}
              onPointerUp={() => {
                dragging.current = false;
              }}
              onPointerCancel={() => {
                dragging.current = false;
              }}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 10 : 1;
                if (e.key === "ArrowRight" || e.key === "ArrowUp") move(dist + step);
                else if (e.key === "ArrowLeft" || e.key === "ArrowDown") move(dist - step);
                else if (e.key === "Home") move(SENSOR_MIN_CM);
                else if (e.key === "End") move(SENSOR_MAX_CM);
                else return;
                e.preventDefault();
              }}
            >
              <rect x={wallX - 18} y={20} width={56} height={180} fill="transparent" />
              <rect x={wallX - 6} y={24} width={32} height={172} rx={4} fill="none" strokeDasharray="4 4" strokeWidth={1.5} className="stroke-transparent group-focus-visible/wall:stroke-[#2B2B2B]" />
              <rect x={wallX} y={30} width={18} height={160} fill="url(#echo-ruler-wall)" stroke={G} strokeWidth={2} />
              <g stroke={P50} strokeWidth={5} strokeLinecap="round">
                <line x1={wallX + 9} y1={98} x2={wallX + 9} y2={126} />
              </g>
              <g stroke={G} strokeWidth={1.6} strokeLinecap="round">
                <line x1={wallX + 6} y1={100} x2={wallX + 6} y2={124} />
                <line x1={wallX + 12} y1={100} x2={wallX + 12} y2={124} />
              </g>
            </g>
            <text x={clamp(wallX + 9, 60, 620)} y={16} textAnchor="middle" fontSize={13} fill={G} className="pointer-events-none font-mono font-bold">
              ◂ DRAG THE WALL ▸
            </text>
            <Dim x1={RX0} x2={wallX} y={170} label={`${dist} cm`} size={15} color={G} bg="#F5F1E8" />
          </svg>
        </div>
      }
      controls={
        <>
          <Slider label="Wall distance" value={dist} min={SENSOR_MIN_CM} max={SENSOR_MAX_CM} unit=" cm" onChange={move} />
          <Slider
            label="Air temperature"
            value={temp}
            min={0}
            max={45}
            unit=" °C"
            onChange={(v) => {
              setTemp(v);
              setVerdict(null);
            }}
          />
          <div className="grid grid-cols-2 gap-2">
            <Readout label="Echo time" value={fmt(t)} unit="µs" />
            <Readout label="Speed of sound" value={speed} unit="m/s" />
          </div>
          <p className="text-xs leading-relaxed text-blueprint">
            The HC-SR04 works from about {SENSOR_MIN_CM} cm to {SENSOR_MAX_CM} cm. Warm air carries sound faster — the same wall gives a slightly shorter echo on a 45 °C afternoon than on a cold morning.
          </p>
        </>
      }
      footer={
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <p className="font-mono text-[13px] leading-relaxed text-charcoal">
            <span className="text-blueprint">distance = speed × time ÷ 2</span>
            <br />= {speed} m/s × {(t / 1e6).toFixed(6)} s ÷ 2 = <strong className="text-graphite">{(dist / 100).toFixed(2)} m</strong>
          </p>
          <div className="flex flex-wrap items-center gap-3" aria-live="polite">
            <Button variant="secondary" onClick={check}>
              <Crosshair className="size-4" aria-hidden /> Check: 2,000 µs?
            </Button>
            {verdict && (
              <p className={cn("text-sm font-semibold", verdict === "hit" ? "text-ok" : "text-charcoal")}>
                {verdict === "hit" ? `On target — ${fmt(t)} µs.` : verdict === "short" ? "Echo too short — move the wall further away." : "Echo too long — bring the wall closer."}
              </p>
            )}
          </div>
        </div>
      }
    />
  );
}

/* ───────────────────────── experiment B · robot car programmer ───────────────────────── */

const WALL = 610;
const CPX = 2.6;
const CAR_Y = 118;
const RATES = [5, 10, 20];

interface Report {
  tone: "ok" | "warn" | "bad";
  title: string;
  body: string;
}

function reportOf(s: CarSim, c: CarConfig): Report {
  const brake = brakingDistance(c.speed, c.floor);
  if (s.outcome === "parked")
    return { tone: "ok", title: "Parked safely", body: `The sensor said STOP at ${fmt(s.triggerGap ?? 0, 1)} cm and the car rolled to a halt ${fmt(s.gap, 1)} cm from the wall — inside the ${ZONE} cm safe zone.` };
  if (s.outcome === "far")
    return { tone: "warn", title: "Stopped too far away", body: `The car stopped ${fmt(s.gap, 1)} cm from the wall, so the loading dock is out of reach. At this speed it only needs about ${fmt(brake)} cm to brake — the threshold can be smaller.` };
  if (s.triggerGap === null)
    return { tone: "bad", title: "Crash — the sensor never said STOP", body: `No reading was at or below ${c.threshold} cm before the bumper hit. At ${c.speed} cm/s the car moves ${fmt(c.speed / c.rate, 1)} cm between two readings — more than your threshold.` };
  return { tone: "bad", title: `Crash at ${fmt(s.impact)} cm/s`, body: `The sensor said STOP at ${fmt(s.triggerGap, 1)} cm, but braking from ${c.speed} cm/s on a ${c.floor} floor needs about ${fmt(brake)} cm. Use a bigger threshold — or slow down.` };
}

function Segmented<T extends string | number>({ label, options, value, onChange, disabled }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div>
      <p className="annot mb-2 text-charcoal">{label}</p>
      <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-[var(--radius-sm)] border border-graphite/20 bg-paper p-1">
        {options.map((o) => (
          <button key={String(o.value)} type="button" role="radio" aria-checked={value === o.value} disabled={disabled} onClick={() => onChange(o.value)} className={cn("min-h-11 rounded-[3px] px-2 text-sm font-semibold transition-colors disabled:opacity-50", value === o.value ? "bg-graphite text-paper" : "text-charcoal hover:bg-graphite/5")}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CarProgrammer({ onResult }: { onResult: (s: CarSim, cfg: CarConfig) => void }) {
  const reduce = useReducedMotion();
  const [cfg, setCfg] = useState<CarConfig>(DEFAULT_CAR);
  const [view, setView] = useState<CarSim>(newCar);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [attempts, setAttempts] = useState(0);
  const sim = useRef<CarSim | null>(null);
  const live = useRef({ cfg, onResult });

  useEffect(() => {
    live.current = { cfg, onResult };
  }, [cfg, onResult]);

  // fixed-timestep physics, drawn once per animation frame
  useEffect(() => {
    if (!running) return;
    const s = sim.current;
    if (!s) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const frame = (now: number) => {
      acc += Math.min(0.05, (now - last) / 1000);
      last = now;
      const c = live.current.cfg;
      while (acc >= CAR_DT && !s.outcome) {
        stepCar(s, c);
        acc -= CAR_DT;
      }
      setView({ ...s });
      if (s.outcome) {
        setRunning(false);
        setReport(reportOf(s, c));
        live.current.onResult(s, c);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const start = () => {
    setAttempts((a) => a + 1);
    setReport(null);
    if (reduce) {
      const s = runToEnd(cfg);
      setView(s);
      setReport(reportOf(s, cfg));
      onResult(s, cfg);
      return;
    }
    sim.current = newCar();
    setView(newCar());
    setRunning(true);
  };
  const reset = () => {
    setRunning(false);
    setView(newCar());
  };
  const patch = (p: Partial<CarConfig>) => {
    setCfg((c) => ({ ...c, ...p }));
    if (view.outcome) setView(newCar());
  };

  const bumper = WALL - view.gap * CPX;
  const stopX = WALL - cfg.threshold * CPX;
  const pingAge = view.lastReadAt < 0 ? 1 : (view.t - view.lastReadAt) * 7;
  const crashed = view.outcome === "crash";
  const status = crashed ? "Crashed" : view.outcome === "parked" ? "Parked" : view.outcome === "far" ? "Stopped short" : view.braking ? "Braking" : running ? "Driving" : "Ready";

  return (
    <SimPanel
      title="Experiment B · robot car programmer"
      stage={
        <div className="flex h-full min-h-[320px] flex-col justify-center">
          <svg viewBox="0 0 680 240" role="img" aria-label={`Top view of a robot car driving towards a wall. Status: ${status}. Bumper is ${fmt(view.gap)} centimetres from the wall.`} className="block h-auto w-full select-none">
            <HatchDefs id="echo-car-zone" gap={7} opacity={0.3} />
            <HatchDefs id="echo-car-wall" gap={5} opacity={0.6} />
            {/* lane */}
            <line x1={20} y1={66} x2={WALL} y2={66} stroke={B} strokeWidth={1.2} strokeDasharray="10 8" />
            <line x1={20} y1={170} x2={WALL} y2={170} stroke={B} strokeWidth={1.2} strokeDasharray="10 8" />
            {/* distance scale (to the wall) */}
            {[200, 150, 100, 50, 0].map((cm) => (
              <g key={cm}>
                <line x1={WALL - cm * CPX} y1={196} x2={WALL - cm * CPX} y2={204} stroke={G} strokeWidth={1.3} />
                <text x={WALL - cm * CPX} y={222} textAnchor="middle" fontSize={14} fill={B} className="font-mono">
                  {cm}
                </text>
              </g>
            ))}
            <line x1={WALL - RUNWAY * CPX} y1={200} x2={WALL} y2={200} stroke={G} strokeWidth={1.3} />
            <text x={WALL + 14} y={222} fontSize={12} fill={B} className="font-mono">
              cm
            </text>
            {/* safe zone */}
            <rect x={WALL - ZONE * CPX} y={70} width={ZONE * CPX} height={96} fill="url(#echo-car-zone)" stroke={G} strokeWidth={1.2} strokeDasharray="3 3" />
            <text x={WALL - 4} y={186} textAnchor="end" fontSize={12} fill={G} className="font-mono font-bold">
              SAFE ZONE
            </text>
            {/* the program's stop line */}
            <line x1={stopX} y1={44} x2={stopX} y2={174} stroke={G} strokeWidth={1.8} strokeDasharray="7 5" />
            <text x={stopX > 400 ? stopX - 8 : stopX + 8} y={38} textAnchor={stopX > 400 ? "end" : "start"} fontSize={14} fill={G} className="font-mono font-bold">
              STOP IF ≤ {cfg.threshold} cm
            </text>
            {/* wall */}
            <rect x={WALL} y={34} width={20} height={162} fill="url(#echo-car-wall)" stroke={G} strokeWidth={2} />
            {crashed && (
              <motion.g initial={reduce ? false : { opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} style={{ transformBox: "fill-box", transformOrigin: "center" }} stroke={BAD} strokeWidth={2.4} strokeLinecap="round">
                {Array.from({ length: 9 }, (_, i) => {
                  const a = Math.PI / 2 + (i * Math.PI) / 8;
                  const r1 = 12;
                  const r2 = i % 2 ? 26 : 38;
                  return <line key={i} x1={WALL + Math.cos(a) * r1} y1={CAR_Y + Math.sin(a) * r1} x2={WALL + Math.cos(a) * r2} y2={CAR_Y + Math.sin(a) * r2} />;
                })}
              </motion.g>
            )}

            {/* sensor ping + what the car believes */}
            {running && pingAge < 1 && view.gap > 8 && <Arcs x={bumper + 5} y={CAR_Y} n={3} r0={8} gap={7} width={1.6} opacity={1 - pingAge} />}
            {(running || view.outcome) && view.gap > 24 && <Dim x1={bumper} x2={WALL} y={84} label={`${fmt(view.reading)} cm`} size={13} color={G} bg="#F5F1E8" />}

            {/* the car (origin = front bumper) */}
            <g transform={`translate(${bumper.toFixed(2)} ${CAR_Y})`}>
              <motion.g animate={crashed && !reduce ? { x: [0, -9, 5, -3, 1, 0] } : { x: 0 }} transition={{ duration: 0.45 }}>
                {[
                  [-47, -24],
                  [-47, 18],
                  [-19, -24],
                  [-19, 18],
                ].map(([wx, wy]) => (
                  <rect key={`${wx}${wy}`} x={wx} y={wy} width={15} height={6} rx={2} fill={G} />
                ))}
                <PencilRect x={-56} y={-19} w={53} h={38} r={8} />
                <rect x={-44} y={-12} width={19} height={24} rx={4} fill="none" stroke={G} strokeWidth={1.2} opacity={0.7} />
                <line x1={-19} y1={-13} x2={-19} y2={13} stroke={G} strokeWidth={1} opacity={0.4} />
                <rect x={-5} y={-12} width={6} height={24} rx={2} fill={P50} stroke={G} strokeWidth={1.5} />
                <circle cx={0} cy={-6} r={3.2} fill={G} />
                <circle cx={0} cy={6} r={3.2} fill={G} />
                {view.braking && (
                  <g fill={BAD}>
                    <rect x={-60} y={-15} width={4} height={8} rx={1} />
                    <rect x={-60} y={7} width={4} height={8} rx={1} />
                  </g>
                )}
              </motion.g>
            </g>
          </svg>
          <p className={cn("pointer-events-none absolute right-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold", crashed ? "border-bad bg-bad text-white" : view.outcome === "parked" ? "border-ok bg-ok text-white" : running ? "border-graphite bg-graphite text-paper" : "border-graphite/30 bg-paper/85 text-charcoal")}>{status}</p>
        </div>
      }
      controls={
        <div className="flex flex-col gap-5">
          <Slider label="Stop threshold" value={cfg.threshold} min={5} max={150} unit=" cm" disabled={running} onChange={(v) => patch({ threshold: v })} />
          <Slider label="Speed" value={cfg.speed} min={20} max={100} step={5} unit=" cm/s" disabled={running} onChange={(v) => patch({ speed: v })} />
          <Segmented label="Sensor readings per second" value={cfg.rate} disabled={running} onChange={(rate) => patch({ rate })} options={RATES.map((r) => ({ value: r, label: String(r) }))} />
          <Segmented<Floor>
            label="Floor"
            value={cfg.floor}
            disabled={running}
            onChange={(floor) => patch({ floor })}
            options={[
              { value: "dry", label: "Dry" },
              { value: "wet", label: "Wet" },
            ]}
          />
          <div className="order-first grid grid-cols-2 gap-2 lg:order-none lg:pt-1">
            <Button onClick={start} disabled={running} className="w-full">
              <Play className="size-4" aria-hidden /> Run
            </Button>
            <Button variant="secondary" onClick={reset} className="w-full">
              <RotateCcw className="size-4" aria-hidden /> Reset
            </Button>
          </div>
        </div>
      }
      footer={
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Readout label="Sensor reading" value={fmt(view.reading)} unit="cm" />
            <Readout label="Echo time" value={fmt(echoTimeUs(view.reading))} unit="µs" />
            <Readout label="Car speed" value={fmt(view.v)} unit="cm/s" />
            <Readout label="Readings taken" value={view.readings} />
          </div>
          <p className="font-mono text-xs leading-relaxed text-charcoal">
            <span className="text-blueprint">Engineer’s notes ·</span> braking distance at {cfg.speed} cm/s on a {cfg.floor} floor ≈ <strong>{fmt(brakingDistance(cfg.speed, cfg.floor))} cm</strong> · the car moves <strong>{fmt(cfg.speed / cfg.rate, 1)} cm</strong> between two readings · attempts: {attempts}
          </p>
          <div aria-live="polite">
            {report && (
              <p className={cn("rounded-[var(--radius-sm)] border px-4 py-3 text-sm leading-relaxed", report.tone === "ok" ? "border-ok/40 bg-ok/10 text-ok" : report.tone === "bad" ? "border-bad/40 bg-bad/10 text-bad" : "border-warn/40 bg-warn/10 text-warn")}>
                <strong>{report.title}.</strong> {report.body}
              </p>
            )}
          </div>
        </div>
      }
    />
  );
}

/* ───────────────────────── the stage ───────────────────────── */

export function EchoHandsOn() {
  const { completeStage, progress } = useLab();
  const [done, setDone] = useState<Partial<Record<MissionId, boolean>>>(() => session.done);
  const count = MISSIONS.filter((m) => done[m.id]).length;
  const stageDone = progress.done.includes("hands-on");

  const award = (ids: MissionId[]) => {
    const fresh = ids.filter((id) => !done[id]);
    if (fresh.length === 0) return;
    const next = { ...done };
    for (const id of fresh) next[id] = true;
    setDone(next);
    remember(next);
    if (MISSIONS.filter((m) => next[m.id]).length >= NEEDED) completeStage("hands-on");
  };

  const onCarResult = (s: CarSim, cfg: CarConfig) => {
    if (s.outcome !== "parked") return;
    const ids: MissionId[] = ["park"];
    if (cfg.speed >= 60) ids.push("fast");
    if (cfg.speed >= 100) ids.push("top");
    if (cfg.floor === "wet" && cfg.speed >= 60) ids.push("wet");
    if (cfg.rate <= 5 && cfg.speed >= 50) ids.push("slow");
    award(ids);
  };

  return (
    <div>
      <StageHeader
        index="03"
        kicker="Hands-on"
        title="Measure with sound, then program the brakes"
        intro={`Two experiments. First use the sensor as a ruler. Then write the one line of logic that stops a robot car before it hits the wall — and discover why speed, a wet floor and a slow sensor all change the right answer. Complete any ${NEEDED} missions to finish this stage.`}
      />

      <div className="mb-8 rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold">Missions</h3>
          <p className="font-mono text-sm tabular-nums text-charcoal">
            {count} / {MISSIONS.length} done · need {NEEDED}
          </p>
        </div>
        <Missions items={MISSIONS.map((m) => ({ ...m, done: !!done[m.id] }))} />
        {(stageDone || count >= NEEDED) && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-graphite px-4 py-2 text-sm font-semibold text-paper">
            <Check className="size-4" aria-hidden /> Hands-on complete — finish the rest for practice, or take on the Challenge.
          </p>
        )}
      </div>

      <div className="space-y-8">
        <EchoRuler onTarget={() => award(["target"])} />
        <div>
          <p className="mb-3 max-w-3xl text-sm leading-relaxed text-charcoal">
            <strong>The job:</strong> the car must pull up to the loading dock — bumper inside the hatched {ZONE} cm safe zone, never touching the wall. Its whole program is one line: <code className="rounded bg-graphite/8 px-1.5 py-0.5 font-mono text-[13px]">if (reading ≤ threshold) brake();</code> Choose the threshold, then press Run.
          </p>
          <CarProgrammer onResult={onCarResult} />
        </div>
      </div>
    </div>
  );
}
