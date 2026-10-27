/**
 * What the finished builds do when they run: the light-seeking car's eyes, the obstacle-avoider's code, the blink
 * timing read from the learner's own sketch. Pure functions, so the bench can step them every frame.
 */
import type { PlacedPart } from "./types";

export interface Pose {
  x: number;
  z: number;
  heading: number;
}

/** A point given in the car's own frame, on the floor. */
export function toWorld(pose: Pose, local: [number, number]): [number, number] {
  const [x, z] = local, a = pose.heading;
  return [pose.x + x * Math.cos(a) + z * Math.sin(a), pose.z - x * Math.sin(a) + z * Math.cos(a)];
}

/** How brightly the torch lights a light sensor that looks `spread` radians off the car's nose (0–1). */
export function eyeLight(pose: Pose, eye: PlacedPart, spread: number, torch: { x: number; z: number }) {
  const [ex, ez] = toWorld(pose, [eye.at[0], eye.at[2]]);
  const dx = torch.x - ex, dz = torch.z - ez;
  const dist = Math.hypot(dx, dz);
  if (dist < 1) return 1;
  const look = pose.heading + spread;
  const cos = (dx * Math.cos(look) - dz * Math.sin(look)) / dist;
  const cone = Math.max(0, (cos - 0.25) / 0.75);
  const near = Math.max(0, 1 - dist / 170);
  return Math.min(1, cone * near * 1.8);
}

/** Moves a two-wheeled car: `l` and `r` are wheel speeds in cm/s, `track` the distance between the wheels. */
export function stepCar(pose: Pose, l: number, r: number, dt: number, track = 16): Pose {
  const v = (l + r) / 2;
  const w = (r - l) / track;
  const heading = pose.heading + w * dt;
  return { x: pose.x + v * Math.cos(heading) * dt, z: pose.z - v * Math.sin(heading) * dt, heading };
}

export interface Wall {
  at: [number, number];
  size: [number, number];
}

/** The arena for the obstacle-avoider: a 3 m square with a few boxes in it. */
export const ARENA_HALF = 150;
export const ARENA: Wall[] = [
  { at: [0, -ARENA_HALF], size: [ARENA_HALF * 2 + 6, 6] },
  { at: [0, ARENA_HALF], size: [ARENA_HALF * 2 + 6, 6] },
  { at: [-ARENA_HALF, 0], size: [6, ARENA_HALF * 2 + 6] },
  { at: [ARENA_HALF, 0], size: [6, ARENA_HALF * 2 + 6] },
  { at: [60, -40], size: [30, 30] },
  { at: [-50, 55], size: [40, 20] },
  { at: [-70, -70], size: [24, 24] },
  { at: [70, 80], size: [20, 40] },
];

/** Distance (cm) from a point along a direction to the first wall, like the HC-SR04 (max 400). */
export function raycast(x: number, z: number, angle: number, walls: Wall[]) {
  const dx = Math.cos(angle), dz = -Math.sin(angle);
  let best = 400;
  for (const w of walls) {
    const [cx, cz] = w.at, [sx, sz] = w.size;
    const minX = cx - sx / 2, maxX = cx + sx / 2, minZ = cz - sz / 2, maxZ = cz + sz / 2;
    let t0 = 0, t1 = best;
    for (const [o, d, lo, hi] of [
      [x, dx, minX, maxX],
      [z, dz, minZ, maxZ],
    ]) {
      if (Math.abs(d) < 1e-9) {
        if (o < lo || o > hi) {
          t0 = Infinity;
          break;
        }
      } else {
        let a = (lo - o) / d, b = (hi - o) / d;
        if (a > b) [a, b] = [b, a];
        t0 = Math.max(t0, a);
        t1 = Math.min(t1, b);
      }
    }
    if (t0 <= t1 && t0 < best) best = t0;
  }
  return best;
}

/** Whether a car (circle, radius r) at x,z overlaps any wall. */
export function bumps(x: number, z: number, walls: Wall[], r = 9) {
  return walls.some((w) => Math.abs(x - w.at[0]) < w.size[0] / 2 + r && Math.abs(z - w.at[1]) < w.size[1] / 2 + r);
}

/** Reads `const int NAME = 123;` from the learner's sketch. */
export function constFrom(code: string, name: string, fallback: number) {
  const m = new RegExp(`\\b${name}\\s*=\\s*(-?\\d+)`).exec(code);
  return m ? Number(m[1]) : fallback;
}

export interface BlinkPlan {
  pin: number | null;
  output: boolean;
  onMs: number;
  offMs: number;
  problem?: string;
}

/** Understands the Blink sketch well enough to run it: which pin, and how long on and off. */
export function readBlink(code: string): BlinkPlan {
  const clean = code.replace(/\/\/.*$/gm, "");
  const writes = [...clean.matchAll(/digitalWrite\s*\(\s*(\d+)\s*,\s*(HIGH|LOW)\s*\)\s*;/g)];
  const pin = writes.length ? Number(writes[0][1]) : null;
  const output = pin !== null && new RegExp(`pinMode\\s*\\(\\s*${pin}\\s*,\\s*OUTPUT\\s*\\)`).test(clean);
  const loop = clean.slice(clean.search(/void\s+loop\s*\(/));
  const steps = [...loop.matchAll(/digitalWrite\s*\(\s*\d+\s*,\s*(HIGH|LOW)\s*\)|delay\s*\(\s*(\d+)\s*\)/g)];
  let level: "HIGH" | "LOW" | null = null, onMs = 0, offMs = 0;
  for (const s of steps) {
    if (s[1]) level = s[1] as "HIGH" | "LOW";
    else if (s[2] && level === "HIGH") onMs += Number(s[2]);
    else if (s[2] && level === "LOW") offMs += Number(s[2]);
  }
  let problem: string | undefined;
  if (pin === null) problem = "The code never uses digitalWrite, so no pin changes.";
  else if (!output) problem = `pinMode(${pin}, OUTPUT) is missing in setup(): the pin is not ready to drive the LED.`;
  else if (!onMs || !offMs) problem = "Each digitalWrite needs a delay after it, or the change is too fast to see.";
  if (!/void\s+setup\s*\(/.test(clean) || !/void\s+loop\s*\(/.test(clean)) problem = "A sketch needs both void setup() and void loop().";
  const opens = (clean.match(/\{/g) ?? []).length, closes = (clean.match(/\}/g) ?? []).length;
  if (opens !== closes) problem = "The { and } brackets do not match up: the code would not compile.";
  return { pin, output, onMs: Math.max(onMs, 20), offMs: Math.max(offMs, 20), problem };
}
