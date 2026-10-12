"use client";

import { useCallback, useState } from "react";
import { ArrowUp, Check, CornerUpLeft, CornerUpRight, Pause, Play, RotateCcw, Square, Trophy, X } from "lucide-react";
import { SimPanel, Slider } from "@/components/labs/framework/LabJourney";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { GOOD_RULES, OFF_LIMIT, type Action, type BotConfig, type BotStatus, type LapEvent, type Mode, type RuleKey, type Rules } from "./sim";
import { EMPTY_HUD, TrackSim, type Hud } from "./TrackSim";
import { getTrack, trackSvgPath, WORLD_H, WORLD_W, type TrackId } from "./tracks";

export const BLANK_RULES: Rules = { ww: "straight", bw: "straight", wb: "straight", bb: "straight" };
export const DEFAULT_CONFIG: BotConfig = { mode: "rules", baseSpeed: 200, gain: 0.6, spacing: 34, threshold: 0.5, rules: GOOD_RULES };

export interface LapRecord extends LapEvent {
  n: number;
  trackId: TrackId;
  mode: Mode;
}

const ACTIONS: { id: Action; label: string; icon: typeof ArrowUp }[] = [
  { id: "straight", label: "Straight", icon: ArrowUp },
  { id: "left", label: "Steer left", icon: CornerUpLeft },
  { id: "right", label: "Steer right", icon: CornerUpRight },
  { id: "stop", label: "Stop", icon: Square },
];

const RULE_ROWS: { key: RuleKey; l: boolean; r: boolean }[] = [
  { key: "ww", l: false, r: false },
  { key: "bw", l: true, r: false },
  { key: "wb", l: false, r: true },
  { key: "bb", l: true, r: true },
];

/** Best clean lap per track — kept for the whole visit, so hopping between stages does not lose it. */
const bestStore: Partial<Record<TrackId, number>> = {};
function rememberBest(id: TrackId, time: number) {
  const prev = bestStore[id];
  if (prev === undefined || time < prev) bestStore[id] = time;
}

const sameRules = (a: Rules, b: Rules) => a.ww === b.ww && a.bw === b.bw && a.wb === b.wb && a.bb === b.bb;
const secs = (t: number) => `${t.toFixed(2)} s`;

/* ───────────────────────── small pieces ───────────────────────── */

function SensorDot({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("grid size-6 place-items-center rounded-full border-2 border-graphite font-mono text-[10px] font-bold", on ? "bg-graphite text-paper" : "bg-paper text-graphite")}>{label}</span>
      <span className={cn("text-xs font-semibold", on ? "text-graphite" : "text-blueprint")}>{on ? "BLACK" : "white"}</span>
    </span>
  );
}

export function TrackPicker({ tracks, value, onChange, best }: { tracks: TrackId[]; value: TrackId; onChange: (id: TrackId) => void; best: Partial<Record<TrackId, number>> }) {
  return (
    <div role="radiogroup" aria-label="Choose a track" className="mb-5 grid gap-3 sm:grid-cols-3">
      {tracks.map((id) => {
        const t = getTrack(id);
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            className={cn(
              "group flex items-center gap-4 rounded-[var(--radius-md)] border p-3 text-left transition-all duration-300 ease-[var(--ease-out-expo)]",
              active ? "border-graphite bg-graphite text-paper shadow-[var(--shadow-lift)]" : "border-graphite/15 bg-paper-50 hover:-translate-y-0.5 hover:border-graphite/50 hover:shadow-[var(--shadow-paper)]",
            )}
          >
            <svg viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} className="h-12 w-[4.7rem] shrink-0" aria-hidden>
              <path d={trackSvgPath(t, 6)} fill="none" stroke="currentColor" strokeWidth={46} strokeLinejoin="round" />
            </svg>
            <span className="min-w-0">
              <span className={cn("annot block text-[10px]", active ? "text-paper/60" : "text-blueprint")}>{t.level}</span>
              <span className="block text-base font-bold leading-tight">{t.name}</span>
              <span className={cn("mt-0.5 block font-mono text-[11px] tabular-nums", active ? "text-paper/70" : "text-blueprint")}>{best[id] !== undefined ? `Best ${secs(best[id] as number)}` : `${(t.length / 10).toFixed(0)} cm lap`}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ModeToggle({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  const opts: { id: Mode; label: string; sub: string }[] = [
    { id: "rules", label: "Rules", sub: "if … then" },
    { id: "p", label: "P-control", sub: "proportional" },
  ];
  return (
    <div>
      <p className="annot mb-2 text-charcoal">Brain</p>
      <div role="radiogroup" aria-label="Controller type" className="grid grid-cols-2 gap-1 rounded-[var(--radius-sm)] border border-graphite/20 bg-paper p-1">
        {opts.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={cn("min-h-11 rounded-[3px] px-2 py-1.5 text-center transition-colors", value === o.id ? "bg-graphite text-paper" : "text-charcoal hover:bg-graphite/5")}
          >
            <span className="block text-sm font-semibold leading-tight">{o.label}</span>
            <span className={cn("block font-mono text-[10px]", value === o.id ? "text-paper/60" : "text-blueprint")}>{o.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Meter({ label, value, mark, on }: { label: string; value: number; mark?: number; on?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 border-graphite font-mono text-[10px] font-bold", on ? "bg-graphite text-paper" : "bg-paper")}>{label}</span>
      <span className="relative h-3 flex-1 overflow-hidden rounded-full border border-graphite/25 bg-paper">
        <span className="absolute inset-y-0 left-0 bg-graphite" style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }} />
        {mark !== undefined && <span className="absolute inset-y-0 w-0.5 bg-bad" style={{ left: `${mark * 100}%` }} />}
      </span>
      <span className="w-9 text-right font-mono text-xs tabular-nums">{Math.round(value * 100)}%</span>
    </div>
  );
}

function MotorBar({ label, mm }: { label: string; mm: number }) {
  const frac = Math.max(-1, Math.min(1, mm / 760));
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 shrink-0 text-center font-mono text-[11px] font-bold">{label}</span>
      <span className="relative h-3 flex-1 overflow-hidden rounded-full border border-graphite/25 bg-paper">
        <span className="absolute inset-y-0 left-1/4 w-px bg-graphite/40" />
        <span className={cn("absolute inset-y-0", frac >= 0 ? "bg-graphite" : "hatch-dense bg-graphite/30")} style={frac >= 0 ? { left: "25%", width: `${frac * 75}%` } : { right: "75%", width: `${-frac * 25}%` }} />
      </span>
      <span className="w-16 text-right font-mono text-xs tabular-nums">{(mm / 10).toFixed(0)} cm/s</span>
    </div>
  );
}

export function HudPanel({ hud, threshold, mode, best, target }: { hud: Hud; threshold: number; mode: Mode; best?: number; target?: number }) {
  return (
    <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
      <div>
        <p className="annot mb-2 text-[10px] text-blueprint">IR sensors · how much black each one sees</p>
        <div className="space-y-1.5">
          <Meter label="L" value={hud.sL} on={hud.bL} mark={mode === "rules" ? threshold : undefined} />
          <Meter label="R" value={hud.sR} on={hud.bR} mark={mode === "rules" ? threshold : undefined} />
        </div>
      </div>
      <div>
        <p className="annot mb-2 text-[10px] text-blueprint">Motors · wheel speed</p>
        <div className="space-y-1.5">
          <MotorBar label="L" mm={hud.vL} />
          <MotorBar label="R" mm={hud.vR} />
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-x-5 gap-y-1 sm:col-span-2 lg:col-span-1 lg:grid-cols-[auto_auto_auto]">
        {[
          ["Laps", String(hud.laps)],
          ["Off-track", String(hud.offCount)],
          [target ? "Target" : "Best", target ? secs(target) : best !== undefined ? secs(best) : "—"],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="annot text-[10px] text-blueprint">{k}</dt>
            <dd className={cn("font-mono text-lg font-semibold tabular-nums", k === "Off-track" && hud.offCount > 0 && "text-bad")}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function RuleEditor({ rules, onChange, active, gain }: { rules: Rules; onChange: (r: Rules) => void; active: RuleKey | null; gain: number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold">The rule book</h3>
        <button type="button" onClick={() => onChange(GOOD_RULES)} className="text-xs font-semibold text-blueprint underline decoration-dotted underline-offset-4 hover:text-graphite">
          Stuck? Fill in the classic rules
        </button>
      </div>
      <p className="mt-1 text-sm text-charcoal">Two sensors give four possible situations. Choose what the bot does in each one — it re-reads this table 240 times a second.</p>
      <ul className="mt-4 space-y-2">
        {RULE_ROWS.map((row) => (
          <li key={row.key} className={cn("rounded-[var(--radius-sm)] border p-3 transition-colors", active === row.key ? "border-graphite bg-paper shadow-[var(--shadow-paper)]" : "border-graphite/12")}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="flex items-center gap-2 text-sm">
                <span className="annot text-[10px] text-blueprint">If</span>
                <SensorDot on={row.l} label="L" />
                <span className="text-blueprint">+</span>
                <SensorDot on={row.r} label="R" />
                <span className="annot text-[10px] text-blueprint">then</span>
              </p>
              <div role="radiogroup" aria-label={`When left sees ${row.l ? "black" : "white"} and right sees ${row.r ? "black" : "white"}`} className="grid flex-1 grid-cols-4 gap-1 sm:min-w-[15rem]">
                {ACTIONS.map((a) => {
                  const on = rules[row.key] === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={a.label}
                      title={a.label}
                      onClick={() => onChange({ ...rules, [row.key]: a.id })}
                      className={cn("flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[3px] border px-1 text-[10px] font-semibold transition-colors", on ? "border-graphite bg-graphite text-paper" : "border-graphite/20 text-charcoal hover:border-graphite/60")}
                    >
                      <a.icon className="size-4" aria-hidden />
                      <span className="leading-none">{a.label.replace("Steer ", "")}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-blueprint">
        “Steer left” slows the left wheel and speeds up the right one. Turn strength {gain.toFixed(1)} sets how hard{gain >= 1 ? " — at 1.0 or more the inner wheel stops or even reverses." : "."}
      </p>
    </div>
  );
}

function PExplain({ hud, cfg }: { hud: Hud; cfg: BotConfig }) {
  const e = hud.sL - hud.sR;
  const steer = cfg.gain * e;
  const row = "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-dashed border-graphite/15 py-2 font-mono text-sm";
  return (
    <div className="rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-5">
      <h3 className="text-lg font-bold">Proportional control, live</h3>
      <p className="mt-1 text-sm text-charcoal">No if-then rules. The bot measures how far off it is (the error) and steers by exactly that much — a small error gets a gentle nudge, a big error gets a hard turn.</p>
      <div className="mt-4">
        <p className={row}>
          <span className="text-blueprint">error = L − R</span>
          <span className="tabular-nums">
            {hud.sL.toFixed(2)} − {hud.sR.toFixed(2)} = <strong>{e.toFixed(2)}</strong>
          </span>
        </p>
        <p className={row}>
          <span className="text-blueprint">steer = Kp × error</span>
          <span className="tabular-nums">
            {cfg.gain.toFixed(1)} × {e.toFixed(2)} = <strong>{steer.toFixed(2)}</strong>
          </span>
        </p>
        <p className={row}>
          <span className="text-blueprint">left motor = speed × (1 − steer)</span>
          <span className="tabular-nums">
            <strong>{((cfg.baseSpeed * (1 - steer)) / 10).toFixed(0)}</strong> cm/s
          </span>
        </p>
        <p className={cn(row, "border-b-0")}>
          <span className="text-blueprint">right motor = speed × (1 + steer)</span>
          <span className="tabular-nums">
            <strong>{((cfg.baseSpeed * (1 + steer)) / 10).toFixed(0)}</strong> cm/s
          </span>
        </p>
      </div>
      <p className="mt-3 text-xs text-blueprint">Tip: P-control works best when the sensors sit close together (about the width of the tape, 22 mm) so each one rides an edge of the line.</p>
    </div>
  );
}

function stopText(status: Exclude<BotStatus, "ok">, cfg: BotConfig): string {
  if (status === "stalled") return "The bot isn't getting anywhere. Check your rules — is it stopping or spinning on the spot?";
  if (cfg.mode === "rules" && sameRules(cfg.rules, BLANK_RULES)) return "It drove straight off! Right now every rule says “Straight”. What should the bot do when only the LEFT sensor sees black?";
  if (cfg.mode === "rules" && cfg.rules.bw === "right" && cfg.rules.wb === "left") return "It steered away from the line. When the LEFT sensor sees black, the line is on the left — so steer towards it.";
  return "The bot lost the line. Try a lower speed, a bigger turn strength, or move the sensors.";
}

/* ───────────────────────── the workbench ───────────────────────── */

interface WorkbenchProps {
  tracks: TrackId[];
  initial?: Partial<BotConfig>;
  /** Challenge mode: a clean lap must beat this time (seconds). */
  targetTime?: number;
  onLap?: (lap: LapRecord, cfg: BotConfig) => void;
}

export function Workbench({ tracks, initial, targetTime, onLap }: WorkbenchProps) {
  const [trackId, setTrackId] = useState<TrackId>(tracks[0]);
  const [cfg, setCfg] = useState<BotConfig>(() => ({ ...DEFAULT_CONFIG, ...initial }));
  const [running, setRunning] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const [best, setBest] = useState<Partial<Record<TrackId, number>>>(() => ({ ...bestStore }));
  const [log, setLog] = useState<LapRecord[]>([]);
  const [stop, setStop] = useState<string | null>(null);
  const track = getTrack(trackId);

  const patch = (p: Partial<BotConfig>) => setCfg((c) => ({ ...c, ...p }));

  const handleLap = useCallback(
    (lap: LapEvent, id: TrackId) => {
      const rec: LapRecord = { ...lap, trackId: id, mode: cfg.mode, n: 0 };
      setLog((l) => [{ ...rec, n: (l[0]?.n ?? 0) + 1 }, ...l].slice(0, 5));
      if (lap.clean) {
        rememberBest(id, lap.time);
        setBest((b) => (b[id] === undefined || lap.time < (b[id] as number) ? { ...b, [id]: lap.time } : b));
      }
      onLap?.(rec, cfg);
    },
    [cfg, onLap],
  );

  const handleStop = useCallback(
    (status: Exclude<BotStatus, "ok">) => {
      setRunning(false);
      setStop(stopText(status, cfg));
    },
    [cfg],
  );

  const reset = () => {
    setRunning(false);
    setStop(null);
    setResetKey((k) => k + 1);
  };
  const toggle = () => {
    if (running) return setRunning(false);
    if (hud.status !== "ok") setResetKey((k) => k + 1);
    setStop(null);
    setRunning(true);
  };
  const pickTrack = (id: TrackId) => {
    if (id === trackId) return;
    setRunning(false);
    setStop(null);
    setLog([]);
    setTrackId(id);
  };

  const last = log[0];
  const chip = hud.status !== "ok" ? "Stopped" : !running ? (hud.lapT > 0 ? "Paused" : "Ready") : hud.off ? "Off-track!" : hud.slip > 1.05 ? "Skidding" : "On the line";

  return (
    <div>
      {tracks.length > 1 && <TrackPicker tracks={tracks} value={trackId} onChange={pickTrack} best={best} />}
      <SimPanel
        title={`Track · ${track.name} · ${track.blurb}`}
        stage={
          <div className="flex h-full min-h-[320px] flex-col justify-center">
            <TrackSim
              trackId={trackId}
              config={cfg}
              running={running}
              resetKey={resetKey}
              onHud={setHud}
              onLap={handleLap}
              onStop={handleStop}
              label={`Top-down view of a two-wheel robot on the ${track.name} track. ${running ? "Running." : "Paused."} Laps ${hud.laps}, off-track count ${hud.offCount}.`}
            />
            <div className="pointer-events-none absolute left-3 top-3 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper/85 px-3 py-1.5 backdrop-blur-sm">
              <p className="annot text-[9px] text-blueprint">Lap time</p>
              <p className="font-mono text-xl font-semibold leading-none tabular-nums">{secs(hud.lapT)}</p>
            </div>
            <p className={cn("pointer-events-none absolute right-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold", hud.off || hud.status !== "ok" ? "border-bad bg-bad text-white" : running ? "border-graphite bg-graphite text-paper" : "border-graphite/30 bg-paper/85 text-charcoal")}>{chip}</p>
          </div>
        }
        controls={
          <div className="flex flex-col gap-5">
            <ModeToggle value={cfg.mode} onChange={(mode) => patch({ mode })} />
            <Slider label="Base speed" value={Math.round(cfg.baseSpeed / 10)} min={10} max={48} unit=" cm/s" onChange={(v) => patch({ baseSpeed: v * 10 })} />
            <Slider label={cfg.mode === "p" ? "P-gain (Kp)" : "Turn strength"} value={cfg.gain} min={0.2} max={2.4} step={0.1} onChange={(v) => patch({ gain: v })} />
            <Slider label="Sensor spacing" value={cfg.spacing} min={14} max={56} step={2} unit=" mm" onChange={(v) => patch({ spacing: v })} />
            <Slider label="Black threshold" value={Math.round(cfg.threshold * 100)} min={10} max={90} step={5} unit="%" onChange={(v) => patch({ threshold: v / 100 })} />
            {cfg.mode === "p" && <p className="-mt-3 text-[11px] leading-snug text-blueprint">P-control uses the raw readings, so the threshold only lights the sensor dots.</p>}
            <div className="order-first grid grid-cols-2 gap-2 lg:order-none lg:pt-1">
              <Button onClick={toggle} className="w-full">
                {running ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />} {running ? "Pause" : "Run"}
              </Button>
              <Button variant="secondary" onClick={reset} className="w-full">
                <RotateCcw className="size-4" aria-hidden /> Reset
              </Button>
            </div>
          </div>
        }
        footer={<HudPanel hud={hud} threshold={cfg.threshold} mode={cfg.mode} best={best[trackId]} target={targetTime} />}
      />

      <div className="mt-4 min-h-[3.25rem]">
        {/* only results are announced — the running commentary changes ten times a second */}
        <div aria-live="polite">
          {stop ? (
            <p className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
              <X className="mt-0.5 size-4 shrink-0" aria-hidden /> {stop}
            </p>
          ) : last && !running ? (
            <p className="rounded-[var(--radius-sm)] border border-graphite/15 px-4 py-3 text-sm text-charcoal">
              Last lap: <strong className="font-mono">{secs(last.time)}</strong> — {last.clean ? (targetTime !== undefined ? (last.time <= targetTime ? "clean, and under the target!" : "clean, but slower than the target.") : "clean.") : "but the bot left the line."}
            </p>
          ) : null}
        </div>
        {!stop && (running || !last) && <p className="rounded-[var(--radius-sm)] border border-dashed border-graphite/20 px-4 py-3 font-mono text-xs text-charcoal sm:text-sm">{running ? hud.text || "…" : "Press Run. You can change every slider while the bot is driving."}</p>}
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        {cfg.mode === "rules" ? <RuleEditor rules={cfg.rules} onChange={(rules) => patch({ rules })} active={running ? hud.rule : null} gain={cfg.gain} /> : <PExplain hud={hud} cfg={cfg} />}
        <div className="rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-5">
          <h3 className="text-lg font-bold">Lap board</h3>
          {log.length === 0 ? (
            <p className="mt-2 text-sm text-charcoal">No laps yet. A lap is <strong>clean</strong> when the bot’s body never leaves the tape — more than {OFF_LIMIT} mm from the centre of the line counts as off-track.</p>
          ) : (
            <ol className="mt-3 space-y-1.5">
              {log.map((l) => {
                const beat = targetTime !== undefined && l.clean && l.time <= targetTime;
                return (
                  <li key={l.n} className={cn("flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border px-3 py-2 text-sm", l.clean ? "border-graphite/25" : "border-graphite/10 text-blueprint")}>
                    <span className="font-mono text-xs">LAP {String(l.n).padStart(2, "0")}</span>
                    <span className="font-mono font-semibold tabular-nums">{secs(l.time)}</span>
                    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", l.clean ? "text-ok" : "text-bad")}>
                      {beat ? <Trophy className="size-3.5" aria-hidden /> : l.clean ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
                      {beat ? "target beaten" : l.clean ? "clean" : "left the line"}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
          <ul className="mt-4 space-y-1.5 border-t border-graphite/10 pt-4 text-xs leading-relaxed text-charcoal">
            <li>
              <strong>Wobbling?</strong> Turn strength is too high for this speed — or the sensors are too far apart.
            </li>
            <li>
              <strong>Flying off at bends?</strong> Too fast, or the turn is too weak to keep up.
            </li>
            <li>
              <strong>Skidding?</strong> Tyres only have so much grip. Slow down for hairpins.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
