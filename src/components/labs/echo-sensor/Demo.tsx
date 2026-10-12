"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Radio } from "lucide-react";
import { SimPanel, StageHeader } from "@/components/labs/framework/LabJourney";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Arcs, B, Dim, G, HatchDefs, SensorRight } from "./parts";
import { echoTimeUs, fmt, soundTravelCm } from "./physics";

const PRESETS = [50, 100, 200];
/** Slow motion: the round trip to a wall 100 cm away is stretched to 3 seconds (≈ 500× slower than real life). */
const MS_PER_CM = 30;
const X0 = 86;
const PX = 2.6;
const WALL_MAX = X0 + 200 * PX;
const FULL_SCALE_US = echoTimeUs(200);

type Phase = "idle" | "out" | "back" | "done";

const STORY: Record<Phase, string> = {
  idle: "Press “Send pulse”. Your code flicks the TRIG pin high for 10 µs and the transmitter (T) shouts eight clicks of 40 kHz sound.",
  out: "The pulse is flying towards the wall. The ECHO pin is HIGH — the stopwatch is running.",
  back: "Bounce! The echo is heading home to the receiver (R). The stopwatch is still running.",
  done: "Echo received. ECHO drops LOW and the stopwatch stops. Half of the trip is the distance to the wall.",
};

export function EchoDemo() {
  const reduce = useReducedMotion();
  const [dist, setDist] = useState(100);
  const [p, setP] = useState(0); // 0 → 1 across the whole round trip
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const autoStarted = useRef(false);

  const send = useCallback(() => {
    if (reduce) {
      setPlaying(false);
      setP(1);
      return;
    }
    setP(0);
    setPlaying(true);
    setRun((r) => r + 1);
  }, [reduce]);

  // the animation: one requestAnimationFrame loop per pulse
  useEffect(() => {
    if (!playing) return;
    const duration = dist * MS_PER_CM;
    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const k = Math.min(1, (now - start) / duration);
      setP(k);
      if (k < 1) raf = requestAnimationFrame(frame);
      else setPlaying(false);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [run, playing, dist]);

  // fire the first pulse by itself when the demo scrolls into view
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || reduce) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !autoStarted.current) {
          autoStarted.current = true;
          send();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce, send]);

  const pickDist = (d: number) => {
    setPlaying(false);
    setP(0);
    setDist(d);
  };

  const total = echoTimeUs(dist);
  const t = p * total;
  const travelled = soundTravelCm(t);
  const phase: Phase = p >= 1 ? "done" : p > 0.5 ? "back" : playing || p > 0 ? "out" : "idle";
  const wallX = X0 + dist * PX;
  const f = p <= 0.5 ? p * 2 : (1 - p) * 2;
  const pulseX = X0 + 6 + (wallX - X0 - 26) * f;
  const bounce = p > 0.46 && p < 0.58;
  const echoBar = ((WALL_MAX - X0) * t) / FULL_SCALE_US;

  return (
    <div>
      <StageHeader
        index="02"
        kicker="Demo"
        title="Watch one echo, in slow motion"
        intro="Real ultrasound crosses a classroom in a few thousandths of a second — far too quick to see. Here it is slowed down about 500 times so you can watch the pulse leave, bounce and come back while the stopwatch runs."
      />

      <div ref={wrapRef}>
        <SimPanel
          title="Echo bench · HC-SR04 → wall"
          stage={
            <div className="flex h-full min-h-[320px] flex-col justify-center">
              <svg viewBox="0 0 660 320" role="img" aria-label={`A sensor on the left and a wall ${dist} centimetres away. ${STORY[phase]}`} className="block h-auto w-full select-none">
                <HatchDefs id="echo-demo-wall" />
                {/* ruler */}
                <line x1={X0} y1={236} x2={WALL_MAX} y2={236} stroke={G} strokeWidth={1.4} />
                {[0, 50, 100, 150, 200].map((cm) => (
                  <g key={cm}>
                    <line x1={X0 + cm * PX} y1={230} x2={X0 + cm * PX} y2={243} stroke={G} strokeWidth={1.4} />
                    <text x={X0 + cm * PX} y={260} textAnchor="middle" fontSize={15} fill={B} className="font-mono">
                      {cm}
                    </text>
                  </g>
                ))}
                {Array.from({ length: 21 }, (_, i) => i * 10)
                  .filter((cm) => cm % 50 !== 0)
                  .map((cm) => (
                    <line key={cm} x1={X0 + cm * PX} y1={233} x2={X0 + cm * PX} y2={239} stroke={B} strokeWidth={1} />
                  ))}
                <text x={WALL_MAX + 24} y={260} fontSize={13} fill={B} className="font-mono">
                  cm
                </text>

                {/* line of flight */}
                <line x1={X0} y1={132} x2={wallX} y2={132} stroke={B} strokeWidth={1} strokeDasharray="2 6" />

                {/* wall */}
                <rect x={wallX} y={52} width={18} height={168} fill="url(#echo-demo-wall)" stroke={G} strokeWidth={2} />
                <text x={wallX - 8} y={66} textAnchor="end" fontSize={14} fill={G} className="font-mono font-bold">
                  WALL
                </text>

                <SensorRight x={X0} y={132} s={1.25} />

                {/* the pulse */}
                {phase !== "idle" && phase !== "done" && <Arcs x={pulseX} y={132} n={3} r0={12} gap={9} width={2.2} dir={p <= 0.5 ? 1 : -1} dashed={p > 0.5} />}
                {bounce && (
                  <g stroke={G} strokeWidth={1.6} strokeLinecap="round">
                    {[-0.9, -0.45, 0, 0.45, 0.9].map((a) => (
                      <line key={a} x1={wallX - 8 * Math.cos(a)} y1={132 + 8 * Math.sin(a)} x2={wallX - 20 * Math.cos(a)} y2={132 + 20 * Math.sin(a)} />
                    ))}
                  </g>
                )}
                {phase === "done" && <Dim x1={X0} x2={wallX} y={92} label={`${fmt(travelled / 2, 1)} cm`} size={16} color={G} bg="#F5F1E8" />}

                {/* ECHO pin trace */}
                <text x={X0 - 12} y={299} textAnchor="end" fontSize={13} fill={G} className="font-mono font-bold">
                  ECHO
                </text>
                <path
                  d={`M${X0 - 6} 302H${X0}${phase === "idle" ? "" : `V284H${(X0 + echoBar).toFixed(1)}${phase === "done" ? "V302" : ""}`}H${phase === "done" || phase === "idle" ? WALL_MAX : (X0 + echoBar).toFixed(1)}`}
                  fill="none"
                  stroke={G}
                  strokeWidth={phase === "out" || phase === "back" ? 2.6 : 1.8}
                  strokeLinejoin="round"
                />
              </svg>

              <div className="pointer-events-none absolute left-3 top-3 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper/90 px-3 py-1.5 backdrop-blur-sm">
                <p className="annot text-[9px] text-blueprint">Stopwatch</p>
                <p className="font-mono text-xl font-semibold leading-none tabular-nums sm:text-2xl">
                  {fmt(t)} <span className="text-xs font-normal text-blueprint">µs</span>
                </p>
              </div>
              <p className={cn("pointer-events-none absolute right-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold", phase === "out" || phase === "back" ? "border-graphite bg-graphite text-paper" : "border-graphite/30 bg-paper/85 text-charcoal")}>
                {phase === "idle" ? "Ready" : phase === "out" ? "Pulse out →" : phase === "back" ? "← Echo back" : "Echo received"}
              </p>
            </div>
          }
          controls={
            <>
              <div>
                <p className="annot mb-2 text-charcoal">Wall distance</p>
                <div role="radiogroup" aria-label="Wall distance" className="grid grid-cols-3 gap-1 rounded-[var(--radius-sm)] border border-graphite/20 bg-paper p-1">
                  {PRESETS.map((d) => (
                    <button key={d} type="button" role="radio" aria-checked={dist === d} onClick={() => pickDist(d)} className={cn("min-h-11 rounded-[3px] font-mono text-sm font-semibold transition-colors", dist === d ? "bg-graphite text-paper" : "text-charcoal hover:bg-graphite/5")}>
                      {d} cm
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={send} className="w-full">
                <Radio className="size-4" aria-hidden /> {phase === "done" ? "Send another pulse" : "Send pulse"}
              </Button>

              <div>
                <p className="annot mb-2 text-charcoal">The calculation, live</p>
                <ol className="space-y-2 font-mono text-[13px]">
                  <li className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-3 py-2">
                    <span className="block text-[10px] uppercase tracking-wider text-blueprint">1 · echo time</span>
                    <span className="font-semibold tabular-nums">
                      {fmt(t)} µs = {(t / 1e6).toFixed(6)} s
                    </span>
                  </li>
                  <li className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-3 py-2">
                    <span className="block text-[10px] uppercase tracking-wider text-blueprint">2 · sound travelled = 343 × time</span>
                    <span className="font-semibold tabular-nums">{fmt(travelled, 1)} cm</span>
                  </li>
                  <li className={cn("rounded-[var(--radius-sm)] border px-3 py-2 transition-colors", phase === "done" ? "border-graphite bg-graphite text-paper" : "border-graphite/12 bg-paper")}>
                    <span className={cn("block text-[10px] uppercase tracking-wider", phase === "done" ? "text-paper/60" : "text-blueprint")}>3 · distance = travelled ÷ 2</span>
                    <span className="font-semibold tabular-nums">{fmt(travelled / 2, 1)} cm</span>
                  </li>
                </ol>
              </div>
            </>
          }
          footer={
            <p aria-live="polite" className="min-h-10 text-sm leading-relaxed text-charcoal">
              {STORY[phase]}
            </p>
          }
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Time, not distance", "The sensor’s only measurement is how long the ECHO pin stays high. Everything else is arithmetic."],
          ["Twice as far, twice as long", "Try 50 cm, then 100 cm, then 200 cm. Watch the echo time double each time — a straight-line relationship."],
          ["Half the trip", "At 100 cm the sound really flies 200 cm: out and back. Dividing by 2 gives the gap to the wall."],
        ].map(([k, v], i) => (
          <div key={k} className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5">
            <p className="font-mono text-xs text-blueprint">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="mt-1 font-bold">{k}</h3>
            <p className="mt-1 text-sm leading-relaxed text-charcoal">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
