/**
 * Line Follower lab — the tracks.
 *
 * The "table" is 1000 × 640 mm. Every track is a closed centre-line, resampled to one point
 * every ~2 mm so the simulator can measure progress (laps) and distance from the line.
 */

export const WORLD_W = 1000;
export const WORLD_H = 640;
/** Width of the black tape in mm (close to real 19–25 mm electrical tape). */
export const LINE_W = 22;
/** Spacing of the centre-line samples in mm. */
export const STEP = 2;

export type TrackId = "oval" | "figure8" | "zigzag";

export interface Track {
  id: TrackId;
  name: string;
  level: string;
  blurb: string;
  /** Interleaved x,y samples of the centre-line (closed loop, uniform spacing). */
  pts: Float32Array;
  n: number;
  /** Lap length in mm. */
  length: number;
  start: { x: number; y: number; heading: number };
}

type P = [number, number];

/** Resample a closed polyline to uniform spacing. */
function resample(poly: P[]): { pts: Float32Array; n: number; length: number } {
  const m = poly.length;
  const cum = new Array<number>(m + 1);
  cum[0] = 0;
  for (let i = 0; i < m; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % m];
    cum[i + 1] = cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  const length = cum[m];
  const n = Math.max(8, Math.round(length / STEP));
  const pts = new Float32Array(n * 2);
  let seg = 0;
  for (let i = 0; i < n; i++) {
    const d = (i / n) * length;
    while (seg < m - 1 && cum[seg + 1] < d) seg++;
    const a = poly[seg];
    const b = poly[(seg + 1) % m];
    const span = cum[seg + 1] - cum[seg] || 1;
    const t = (d - cum[seg]) / span;
    pts[i * 2] = a[0] + (b[0] - a[0]) * t;
    pts[i * 2 + 1] = a[1] + (b[1] - a[1]) * t;
  }
  return { pts, n, length };
}

/** Closed polygon → polyline with every corner replaced by a true circular arc of the given radius. */
function roundedPolygon(verts: { p: P; r: number }[]): P[] {
  const out: P[] = [];
  const m = verts.length;
  for (let i = 0; i < m; i++) {
    const v = verts[i].p;
    const a = verts[(i - 1 + m) % m].p;
    const b = verts[(i + 1) % m].p;
    const r = verts[i].r;
    const d1: P = [a[0] - v[0], a[1] - v[1]];
    const d2: P = [b[0] - v[0], b[1] - v[1]];
    const l1 = Math.hypot(d1[0], d1[1]);
    const l2 = Math.hypot(d2[0], d2[1]);
    d1[0] /= l1;
    d1[1] /= l1;
    d2[0] /= l2;
    d2[1] /= l2;
    const cosPhi = Math.max(-1, Math.min(1, d1[0] * d2[0] + d1[1] * d2[1]));
    const phi = Math.acos(cosPhi); // interior angle at the corner
    if (r <= 0 || phi > Math.PI - 0.02) {
      out.push(v); // straight through (or no rounding)
      continue;
    }
    const tangent = r / Math.tan(phi / 2);
    const p1: P = [v[0] + d1[0] * tangent, v[1] + d1[1] * tangent];
    const p2: P = [v[0] + d2[0] * tangent, v[1] + d2[1] * tangent];
    const bis: P = [d1[0] + d2[0], d1[1] + d2[1]];
    const bl = Math.hypot(bis[0], bis[1]);
    const cDist = r / Math.sin(phi / 2);
    const c: P = [v[0] + (bis[0] / bl) * cDist, v[1] + (bis[1] / bl) * cDist];
    const a1 = Math.atan2(p1[1] - c[1], p1[0] - c[0]);
    let da = Math.atan2(p2[1] - c[1], p2[0] - c[0]) - a1;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    const steps = Math.max(4, Math.ceil((Math.abs(da) * r) / 1.5));
    for (let s = 0; s <= steps; s++) {
      const ang = a1 + (da * s) / steps;
      out.push([c[0] + Math.cos(ang) * r, c[1] + Math.sin(ang) * r]);
    }
  }
  return out;
}

function ovalPoly(): P[] {
  // A stadium: two straights joined by two half-circles of radius 180 mm. Driven clockwise.
  const out: P[] = [[500, 140], [700, 140]];
  for (let i = 1; i <= 90; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / 90;
    out.push([700 + Math.cos(a) * 180, 320 + Math.sin(a) * 180]);
  }
  out.push([300, 500]);
  for (let i = 1; i <= 90; i++) {
    const a = Math.PI / 2 + (Math.PI * i) / 90;
    out.push([300 + Math.cos(a) * 180, 320 + Math.sin(a) * 180]);
  }
  return out;
}

function figure8Poly(): P[] {
  // Lemniscate of Gerono — crosses itself at exactly 90° in the middle of the table.
  const out: P[] = [];
  const steps = 720;
  for (let i = 0; i < steps; i++) {
    const t = Math.PI / 4 + (2 * Math.PI * i) / steps;
    out.push([500 + 390 * Math.sin(t), 320 + 390 * Math.sin(t) * Math.cos(t)]);
  }
  return out;
}

function zigzagPoly(): P[] {
  // A long straight, two rounded corners and five sharp zig-zag hairpins. Driven clockwise.
  return roundedPolygon([
    { p: [500, 545], r: 0 },
    { p: [105, 545], r: 70 },
    { p: [105, 320], r: 90 },
    { p: [237, 120], r: 44 },
    { p: [368, 320], r: 44 },
    { p: [500, 120], r: 44 },
    { p: [632, 320], r: 44 },
    { p: [763, 120], r: 44 },
    { p: [895, 320], r: 90 },
    { p: [895, 545], r: 70 },
  ]);
}

const META: Record<TrackId, { name: string; level: string; blurb: string; poly: () => P[] }> = {
  oval: { name: "Oval", level: "Warm-up", blurb: "Two straights, two wide bends. Perfect for a first clean lap.", poly: ovalPoly },
  figure8: { name: "Figure-8", level: "Tricky", blurb: "Bends both ways — and a crossing where both sensors see black.", poly: figure8Poly },
  zigzag: { name: "Zig-zag", level: "Hardest", blurb: "Five hairpins in a row. Too fast and the bot flies off.", poly: zigzagPoly },
};

export const TRACK_IDS: TrackId[] = ["oval", "figure8", "zigzag"];

const cache = new Map<TrackId, Track>();

export function getTrack(id: TrackId): Track {
  const hit = cache.get(id);
  if (hit) return hit;
  const meta = META[id];
  const { pts, n, length } = resample(meta.poly());
  const heading = Math.atan2(pts[3] - pts[1], pts[2] - pts[0]);
  const track: Track = { id, name: meta.name, level: meta.level, blurb: meta.blurb, pts, n, length, start: { x: pts[0], y: pts[1], heading } };
  cache.set(id, track);
  return track;
}

/** SVG path for small previews of a track (every 4th sample is plenty). */
export function trackSvgPath(track: Track, every = 4): string {
  let d = "";
  for (let i = 0; i < track.n; i += every) d += `${i === 0 ? "M" : "L"}${track.pts[i * 2].toFixed(1)} ${track.pts[i * 2 + 1].toFixed(1)}`;
  return `${d}Z`;
}
