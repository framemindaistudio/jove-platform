/**
 * Line Follower lab — the physics (no DOM in this file).
 *
 * A two-wheel (differential drive) robot with two downward-looking IR sensors.
 * Units: millimetres, seconds, radians. The screen's y axis points down, so a positive
 * turn rate turns the robot to ITS right.
 */
import { LINE_W, WORLD_H, WORLD_W, type Track } from "./tracks";

export type Mode = "rules" | "p";
export type Action = "straight" | "left" | "right" | "stop";
/** What to do for each pair of sensor readings (L,R). w = white floor, b = black line. */
export interface Rules {
  ww: Action;
  bw: Action;
  wb: Action;
  bb: Action;
}
export type RuleKey = keyof Rules;

export interface BotConfig {
  mode: Mode;
  /** Forward speed in mm/s. */
  baseSpeed: number;
  /** Turn strength (rules mode) or P-gain Kp (P-control mode). */
  gain: number;
  /** Distance between the two sensors in mm. */
  spacing: number;
  /** A reading above this (0–1) counts as "black" in rules mode. */
  threshold: number;
  rules: Rules;
}

export const GOOD_RULES: Rules = { ww: "straight", bw: "left", wb: "right", bb: "straight" };

export const BOT = {
  wheelBase: 62,
  sensorAhead: 36,
  /** Radius of the patch of floor each sensor "sees". */
  footprint: 6,
  bodyL: 84,
  bodyW: 58,
  /** Motors cannot change speed instantly — this is their response time in seconds. */
  motorLag: 0.12,
  maxWheel: 760,
  /** Tyre grip: the hardest the floor can push the robot sideways (mm/s²). Corner faster than this allows and it skids. */
  grip: 1200,
};

/** Physics tick: 240 steps per simulated second. */
export const DT = 1 / 240;
/** The robot is "off-track" when its centre is further than this from the centre of the line. */
export const OFF_LIMIT = 38;
const WINDOW = 45;

export interface Mask {
  w: number;
  h: number;
  /** Darkness per pixel, 0 (white) … 255 (black). One pixel = one millimetre. */
  data: Uint8Array;
}

/** Fallback / test rasteriser: stamps the line into a darkness map without needing a canvas. */
export function rasterMask(track: Track): Mask {
  const w = WORLD_W;
  const h = WORLD_H;
  const data = new Uint8Array(w * h);
  const r = LINE_W / 2;
  const reach = Math.ceil(r + 1);
  for (let i = 0; i < track.n; i++) {
    const cx = track.pts[i * 2];
    const cy = track.pts[i * 2 + 1];
    const x0 = Math.max(0, Math.floor(cx - reach));
    const x1 = Math.min(w - 1, Math.ceil(cx + reach));
    const y0 = Math.max(0, Math.floor(cy - reach));
    const y1 = Math.min(h - 1, Math.ceil(cy + reach));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        const v = Math.max(0, Math.min(1, r + 0.5 - d)) * 255;
        const k = y * w + x;
        if (v > data[k]) data[k] = v;
      }
    }
  }
  return { w, h, data };
}

const RING = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [Math.cos((i * Math.PI) / 4), Math.sin((i * Math.PI) / 4)] as const);

function px(mask: Mask, x: number, y: number): number {
  const xi = x | 0;
  const yi = y | 0;
  if (xi < 0 || yi < 0 || xi >= mask.w || yi >= mask.h) return 0;
  return mask.data[yi * mask.w + xi];
}

/** Average darkness (0–1) of the floor under a sensor at world position (x, y). */
export function sampleMask(mask: Mask, x: number, y: number): number {
  let sum = px(mask, x, y) * 2;
  const rIn = BOT.footprint * 0.5;
  const rOut = BOT.footprint * 0.92;
  for (let i = 0; i < 8; i++) {
    sum += px(mask, x + RING[i][0] * rIn, y + RING[i][1] * rIn);
    sum += px(mask, x + RING[i][0] * rOut, y + RING[i][1] * rOut);
  }
  return sum / (18 * 255);
}

export type BotStatus = "ok" | "lost" | "stalled";

export interface BotState {
  x: number;
  y: number;
  th: number;
  vL: number;
  vR: number;
  /** Actual velocity over the floor (differs from where the wheels point while skidding). */
  vx: number;
  vy: number;
  /** 0 = full grip … 1+ = sliding. */
  slip: number;
  /** Analog sensor readings 0 (white) … 1 (black). */
  sL: number;
  sR: number;
  /** Digital readings after the threshold. */
  bL: boolean;
  bR: boolean;
  steer: number;
  rule: RuleKey;
  action: Action;
  t: number;
  idx: number;
  progress: number;
  bestProgress: number;
  progressAt: number;
  dist: number;
  lapT: number;
  laps: number;
  lapClean: boolean;
  off: boolean;
  offCount: number;
  offTime: number;
  status: BotStatus;
}

export interface LapEvent {
  time: number;
  clean: boolean;
}

export function createBot(track: Track): BotState {
  return {
    x: track.start.x,
    y: track.start.y,
    th: track.start.heading,
    vL: 0,
    vR: 0,
    vx: 0,
    vy: 0,
    slip: 0,
    sL: 0,
    sR: 0,
    bL: false,
    bR: false,
    steer: 0,
    rule: "ww",
    action: "straight",
    t: 0,
    idx: 0,
    progress: 0,
    bestProgress: 0,
    progressAt: 0,
    dist: 0,
    lapT: 0,
    laps: 0,
    lapClean: true,
    off: false,
    offCount: 0,
    offTime: 0,
    status: "ok",
  };
}

/** World positions of the two sensors. */
export function sensorPositions(s: { x: number; y: number; th: number }, spacing: number) {
  const cos = Math.cos(s.th);
  const sin = Math.sin(s.th);
  const fx = s.x + cos * BOT.sensorAhead;
  const fy = s.y + sin * BOT.sensorAhead;
  const half = spacing / 2;
  return { lx: fx + sin * half, ly: fy - cos * half, rx: fx - sin * half, ry: fy + cos * half };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Advance the robot by one physics tick. Returns a LapEvent when the start line is crossed. */
export function stepBot(s: BotState, track: Track, mask: Mask, cfg: BotConfig, dt: number = DT): LapEvent | null {
  if (s.status !== "ok") return null;

  // 1 — SENSE
  const sp = sensorPositions(s, cfg.spacing);
  s.sL = sampleMask(mask, sp.lx, sp.ly);
  s.sR = sampleMask(mask, sp.rx, sp.ry);
  s.bL = s.sL >= cfg.threshold;
  s.bR = s.sR >= cfg.threshold;
  s.rule = `${s.bL ? "b" : "w"}${s.bR ? "b" : "w"}` as RuleKey;

  // 2 — DECIDE
  let steer = 0;
  let drive = 1;
  if (cfg.mode === "p") {
    steer = cfg.gain * (s.sL - s.sR);
    s.action = steer > 0.08 ? "left" : steer < -0.08 ? "right" : "straight";
  } else {
    s.action = cfg.rules[s.rule];
    if (s.action === "left") steer = cfg.gain;
    else if (s.action === "right") steer = -cfg.gain;
    else if (s.action === "stop") drive = 0;
  }
  s.steer = steer;

  // 3 — ACT (motors take a moment to reach the speed they are told)
  const targetL = clamp(cfg.baseSpeed * drive * (1 - steer), -BOT.maxWheel, BOT.maxWheel);
  const targetR = clamp(cfg.baseSpeed * drive * (1 + steer), -BOT.maxWheel, BOT.maxWheel);
  const k = Math.min(1, dt / BOT.motorLag);
  s.vL += (targetL - s.vL) * k;
  s.vR += (targetR - s.vR) * k;
  const v = (s.vL + s.vR) / 2;
  const w = (s.vL - s.vR) / BOT.wheelBase;
  s.th += w * dt;
  // The tyres can only change the robot's velocity so fast — ask for more and it slides.
  const dvx = v * Math.cos(s.th) - s.vx;
  const dvy = v * Math.sin(s.th) - s.vy;
  const need = Math.hypot(dvx, dvy);
  const maxDv = BOT.grip * dt;
  if (need > maxDv) {
    s.vx += (dvx / need) * maxDv;
    s.vy += (dvy / need) * maxDv;
  } else {
    s.vx += dvx;
    s.vy += dvy;
  }
  s.slip += (Math.min(2, need / maxDv) - s.slip) * Math.min(1, dt * 20);
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  s.t += dt;
  s.lapT += dt;

  // 4 — REFEREE: where on the lap are we, and are we still on the line?
  const n = track.n;
  let best = Infinity;
  let bi = s.idx;
  for (let o = -WINDOW; o <= WINDOW; o++) {
    const i = (s.idx + o + n) % n;
    const dx = track.pts[i * 2] - s.x;
    const dy = track.pts[i * 2 + 1] - s.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < best) {
      best = d2;
      bi = i;
    }
  }
  let delta = bi - s.idx;
  if (delta > n / 2) delta -= n;
  if (delta < -n / 2) delta += n;
  s.idx = bi;
  s.progress += delta;
  s.dist = Math.sqrt(best);
  if (s.progress > s.bestProgress + 4) {
    s.bestProgress = s.progress;
    s.progressAt = s.t;
  }

  const off = s.dist > OFF_LIMIT;
  if (off && !s.off) {
    s.offCount++;
    s.lapClean = false;
  }
  s.off = off;
  s.offTime = off ? s.offTime + dt : 0;

  let lap: LapEvent | null = null;
  if (s.progress >= n) {
    lap = { time: s.lapT, clean: s.lapClean };
    s.laps++;
    s.progress -= n;
    s.bestProgress = s.progress;
    s.progressAt = s.t;
    s.lapT = 0;
    s.lapClean = !s.off;
  }

  if (s.offTime > 2.2 || s.x < -40 || s.y < -40 || s.x > WORLD_W + 40 || s.y > WORLD_H + 40) s.status = "lost";
  else if (s.t - s.progressAt > 5) s.status = "stalled";

  return lap;
}

/** Plain-language description of what the controller is doing right now. */
export function describe(s: BotState, cfg: BotConfig): string {
  if (cfg.mode === "p") {
    const e = s.sL - s.sR;
    if (Math.abs(e) < 0.06) return "Error ≈ 0 — both sensors agree, so both motors run at the same speed.";
    return e > 0
      ? `Left sensor sees more black (error ${e.toFixed(2)}) — slow the left motor a little, steer left.`
      : `Right sensor sees more black (error ${e.toFixed(2)}) — slow the right motor a little, steer right.`;
  }
  const see = `${s.bL ? "L sees BLACK" : "L sees white"}, ${s.bR ? "R sees BLACK" : "R sees white"}`;
  const act = s.action === "straight" ? "drive straight" : s.action === "left" ? "steer left" : s.action === "right" ? "steer right" : "stop";
  return `${see} → ${act}.`;
}
