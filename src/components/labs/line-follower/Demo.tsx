"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { SimPanel, StageHeader } from "@/components/labs/framework/LabJourney";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { GOOD_RULES, type BotConfig, type Mode, type RuleKey } from "./sim";
import { EMPTY_HUD, TrackSim, type Hud } from "./TrackSim";
import { getTrack, type TrackId } from "./tracks";
import { HudPanel } from "./Workbench";

/** Two well-behaved robots to watch: classic if-then rules, and smooth proportional control. */
const BRAINS: Record<Mode, BotConfig> = {
  rules: { mode: "rules", baseSpeed: 220, gain: 0.8, spacing: 34, threshold: 0.5, rules: GOOD_RULES },
  p: { mode: "p", baseSpeed: 220, gain: 1.4, spacing: 24, threshold: 0.5, rules: GOOD_RULES },
};

const DEMO_TRACKS: TrackId[] = ["oval", "figure8"];

const ROWS: { key: RuleKey; l: boolean; r: boolean; act: string }[] = [
  { key: "ww", l: false, r: false, act: "Straight" },
  { key: "bw", l: true, r: false, act: "Steer left" },
  { key: "wb", l: false, r: true, act: "Steer right" },
  { key: "bb", l: true, r: true, act: "Straight" },
];

function Toggle<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="annot mb-2 text-charcoal">{label}</p>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-1 rounded-[var(--radius-sm)] border border-graphite/20 bg-paper p-1">
        {options.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className={cn("min-h-11 rounded-[3px] px-2 text-sm font-semibold transition-colors", value === o.value ? "bg-graphite text-paper" : "text-charcoal hover:bg-graphite/5")}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Sensor dot for the rule list: filled = sees black. `inverse` = sitting on a dark (active) row. */
function Dot({ on, label, inverse }: { on: boolean; label: string; inverse: boolean }) {
  const tone = on ? (inverse ? "border-paper bg-paper text-graphite" : "border-graphite bg-graphite text-paper") : inverse ? "border-paper/70 text-paper" : "border-graphite/50 text-charcoal";
  return (
    <span className={cn("grid size-5 place-items-center rounded-full border-2 font-mono text-[9px] font-bold", tone)}>
      <span aria-hidden>{label}</span>
      <span className="sr-only">
        {label} sees {on ? "black" : "white"}
      </span>
    </span>
  );
}

export function LineDemo() {
  const reduce = useReducedMotion();
  const [brain, setBrain] = useState<Mode>("rules");
  const [trackId, setTrackId] = useState<TrackId>("oval");
  const [want, setWant] = useState(false);
  const [inView, setInView] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const wrapRef = useRef<HTMLDivElement>(null);
  const autoStarted = useRef(false);

  // start by itself when scrolled into view, and never burn battery off-screen
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && !autoStarted.current) {
          autoStarted.current = true;
          if (!reduce) setWant(true);
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  const onStop = useCallback(() => setWant(false), []);
  const cfg = BRAINS[brain];
  const running = want && inView;
  const track = getTrack(trackId);
  const e = hud.sL - hud.sR;

  const restart = () => {
    setResetKey((k) => k + 1);
    setWant(true);
  };
  const toggle = () => {
    if (!want && hud.status !== "ok") setResetKey((k) => k + 1);
    setWant((w) => !w);
  };

  return (
    <div>
      <StageHeader
        index="02"
        kicker="Demo"
        title="Watch the loop at work"
        intro="Here is a finished line follower doing laps. Keep one eye on the robot and one on the read-outs: every time a sensor touches the tape, a motor changes speed. Switch brains to compare jerky if-then rules with smooth proportional control."
      />

      <div ref={wrapRef}>
        <SimPanel
          title={`Demo · ${track.name} · ${brain === "rules" ? "if-then rules" : "P-control"}`}
          stage={
            <div className="flex h-full min-h-[320px] flex-col justify-center">
              <TrackSim trackId={trackId} config={cfg} running={running} resetKey={resetKey} onHud={setHud} onStop={onStop} label={`Top-down view of a robot following the ${track.name} track with ${brain === "rules" ? "if-then rules" : "proportional control"}. ${running ? "Running." : "Paused."}`} />
              <div className="pointer-events-none absolute left-3 top-3 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper/85 px-3 py-1.5 backdrop-blur-sm">
                <p className="annot text-[9px] text-blueprint">Lap time</p>
                <p className="font-mono text-xl font-semibold leading-none tabular-nums">{hud.lapT.toFixed(2)} s</p>
              </div>
            </div>
          }
          controls={
            <>
              <Toggle
                label="Brain"
                value={brain}
                onChange={setBrain}
                options={[
                  { value: "rules", label: "Rules" },
                  { value: "p", label: "P-control" },
                ]}
              />
              <Toggle
                label="Track"
                value={trackId}
                onChange={(id) => {
                  setTrackId(id);
                  setWant(true);
                }}
                options={DEMO_TRACKS.map((id) => ({ value: id, label: getTrack(id).name }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={toggle} className="w-full">
                  {running ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />} {running ? "Pause" : "Play"}
                </Button>
                <Button variant="secondary" onClick={restart} className="w-full">
                  <RotateCcw className="size-4" aria-hidden /> Restart
                </Button>
              </div>

              {brain === "rules" ? (
                <div>
                  <p className="annot mb-2 text-charcoal">Rule in use right now</p>
                  <ul className="space-y-1">
                    {ROWS.map((row) => {
                      const active = running && hud.rule === row.key;
                      return (
                        <li key={row.key} className={cn("flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border px-3 py-2 text-sm transition-colors", active ? "border-graphite bg-graphite text-paper" : "border-graphite/12 text-charcoal")}>
                          <span className="flex items-center gap-1.5">
                            <Dot on={row.l} label="L" inverse={active} />
                            <Dot on={row.r} label="R" inverse={active} />
                          </span>
                          <span className="font-semibold">{row.act}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div>
                  <p className="annot mb-2 text-charcoal">The maths right now</p>
                  <dl className="space-y-1 font-mono text-[13px]">
                    {[
                      ["error = L − R", e.toFixed(2)],
                      [`steer = ${cfg.gain} × error`, (cfg.gain * e).toFixed(2)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-baseline justify-between gap-3 rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-3 py-2">
                        <dt className="text-blueprint">{k}</dt>
                        <dd className="font-semibold tabular-nums">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </>
          }
          footer={<HudPanel hud={hud} threshold={cfg.threshold} mode={cfg.mode} />}
        />
      </div>

      <p className="mt-4 min-h-[2.75rem] rounded-[var(--radius-sm)] border border-dashed border-graphite/20 px-4 py-3 font-mono text-xs text-charcoal sm:text-sm">{running ? hud.text || "…" : "Paused — press Play to watch the robot think."}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["The sensor dots", "A dot on the robot fills in when that sensor is over the tape. On a bend, the inside sensor touches the line again and again."],
          ["The motor bars", "To steer left the robot slows its left wheel and speeds up its right one. Two motors, no steering wheel."],
          ["Rules vs P-control", "With rules the motors jump between two speeds. With P-control they glide — the correction grows only as big as the error."],
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
