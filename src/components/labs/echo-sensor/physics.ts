/**
 * Echo lab — the maths of an ultrasonic distance sensor (HC-SR04 style).
 *
 *   distance = speed of sound × echo time ÷ 2
 *
 * Units used across the lab: centimetres (cm), microseconds (µs), metres per second (m/s).
 */

/** Speed of sound in dry air at 20 °C, rounded the way most textbooks do. */
export const SPEED_OF_SOUND = 343; // m/s

/** Approximate speed of sound in air for a given temperature (°C). 331.3 + 0.606·T  →  ≈ 343 m/s at 20 °C. */
export function speedOfSound(tempC: number) {
  return 331.3 + 0.606 * tempC;
}

/** Round-trip echo time (µs) for an obstacle `distanceCm` away. */
export function echoTimeUs(distanceCm: number, speed = SPEED_OF_SOUND) {
  return ((2 * distanceCm) / 100 / speed) * 1e6;
}

/** Distance (cm) from a round-trip echo time (µs). */
export function distanceCm(echoUs: number, speed = SPEED_OF_SOUND) {
  return ((speed * (echoUs / 1e6)) / 2) * 100;
}

/** How far sound travels (cm) in `us` microseconds. */
export function soundTravelCm(us: number, speed = SPEED_OF_SOUND) {
  return speed * (us / 1e6) * 100;
}

/** HC-SR04 datasheet working range. */
export const SENSOR_MIN_CM = 2;
export const SENSOR_MAX_CM = 400;

/** Indian-style number formatting with fixed decimals (1,23,456.7). */
export function fmt(n: number, decimals = 0) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Small, fast seeded PRNG (mulberry32) — same seed → same "room". */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh 32-bit seed. Call from event handlers / effects only (never during render). */
export function freshSeed() {
  try {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0];
  } catch {
    return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  }
}
