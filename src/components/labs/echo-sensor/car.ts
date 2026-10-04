/**
 * Echo lab — the "robot car programmer" physics (no DOM in this file).
 *
 * A car drives straight at a wall. Its ultrasonic sensor takes `rate` readings a second;
 * the first reading at or below `threshold` slams the brakes on. Units: cm, seconds.
 */
export type Floor = "dry" | "wet";
export type Outcome = "parked" | "crash" | "far";

export interface CarConfig {
  /** Brake when a reading is at or below this many cm. */
  threshold: number;
  /** Cruising speed in cm/s. */
  speed: number;
  /** Sensor readings per second. */
  rate: number;
  floor: Floor;
}

export interface CarSim {
  /** True distance from the front bumper to the wall. */
  gap: number;
  v: number;
  t: number;
  nextRead: number;
  /** The last distance the sensor reported (the only thing the program "knows"). */
  reading: number;
  readings: number;
  lastReadAt: number;
  braking: boolean;
  /** Reading that triggered the brakes. */
  triggerGap: number | null;
  outcome: Outcome | null;
  /** Speed at the moment of impact (crash only). */
  impact: number;
}

/** Bumper-to-wall distance at the start line. */
export const RUNWAY = 200;
/** The car must stop with its bumper within this many cm of the wall — without touching it. */
export const ZONE = 15;
export const ACCEL = 150;
/** How hard the tyres can brake on each floor (cm/s²). */
export const DECEL: Record<Floor, number> = { dry: 120, wet: 50 };
/** Fixed physics timestep. */
export const CAR_DT = 1 / 240;

export const DEFAULT_CAR: CarConfig = { threshold: 10, speed: 40, rate: 10, floor: "dry" };

/** Distance needed to brake from `speed` to a stop: v² ÷ (2 × a). */
export const brakingDistance = (speed: number, floor: Floor) => (speed * speed) / (2 * DECEL[floor]);

export function newCar(): CarSim {
  return { gap: RUNWAY, v: 0, t: 0, nextRead: 0, reading: RUNWAY, readings: 0, lastReadAt: -1, braking: false, triggerGap: null, outcome: null, impact: 0 };
}

/** Advance the car by one physics tick. */
export function stepCar(s: CarSim, cfg: CarConfig, dt: number = CAR_DT) {
  if (s.outcome) return;
  // SENSE — only when the sensor's next reading is due
  if (s.t >= s.nextRead - 1e-9) {
    s.reading = s.gap;
    s.readings++;
    s.lastReadAt = s.t;
    s.nextRead += 1 / cfg.rate;
    // DECIDE — the whole "program" is this one comparison
    if (!s.braking && s.reading <= cfg.threshold) {
      s.braking = true;
      s.triggerGap = s.reading;
    }
  }
  // ACT
  if (s.braking) s.v = Math.max(0, s.v - DECEL[cfg.floor] * dt);
  else s.v = Math.min(cfg.speed, s.v + ACCEL * dt);
  s.gap -= s.v * dt;
  s.t += dt;
  if (s.gap <= 0) {
    s.gap = 0;
    s.impact = s.v;
    s.v = 0;
    s.outcome = "crash";
  } else if (s.braking && s.v === 0) {
    s.outcome = s.gap <= ZONE ? "parked" : "far";
  }
}

/** Run a whole attempt at once (used when animations are switched off). */
export function runToEnd(cfg: CarConfig): CarSim {
  const s = newCar();
  for (let i = 0; i < 240 * 60 && !s.outcome; i++) stepCar(s, cfg);
  return s;
}
