/**
 * Robot Arm Commander — the maths.
 * A 2-link planar arm seen from the side. Origin = the shoulder joint, x to the right, y up, units = cm.
 * θ1 (t1) = shoulder angle measured from the x-axis; θ2 (t2) = elbow angle measured from link 1.
 */

export const L1 = 16; // upper arm, cm
export const L2 = 12; // forearm, cm
export const TABLE_Y = -10; // the table top sits 10 cm below the shoulder
export const BLOCK = 4; // block edge, cm
export const REST_Y = TABLE_Y + BLOCK / 2; // centre height of a block resting on the table
export const MIN_TIP_Y = REST_Y; // the fingers reach 2 cm below the tip, so the tip stops 2 cm above the table
export const SHOULDER_MIN = 0;
export const SHOULDER_MAX = 180;
export const ELBOW_MAX = 150;

export const rad = (d: number) => (d * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const REACH_MAX = L1 + L2;
/** Closest the tip can get to the shoulder with the elbow bent to its limit (≈ 8.2 cm). */
export const REACH_MIN = Math.sqrt(L1 * L1 + L2 * L2 + 2 * L1 * L2 * Math.cos(rad(ELBOW_MAX)));

export interface Pt {
  x: number;
  y: number;
}
export interface Pose {
  t1: number;
  t2: number;
}

/** Forward kinematics: joint angles → elbow and tip positions. */
export function fk(p: Pose): { elbow: Pt; tip: Pt } {
  const a = rad(p.t1);
  const b = rad(p.t1 + p.t2);
  const elbow = { x: L1 * Math.cos(a), y: L1 * Math.sin(a) };
  return { elbow, tip: { x: elbow.x + L2 * Math.cos(b), y: elbow.y + L2 * Math.sin(b) } };
}

export interface IkSolution extends Pose {
  kind: "up" | "down";
  elbow: Pt;
  valid: boolean;
  reason?: string;
}
export interface IkResult {
  d: number;
  reachable: boolean;
  reason?: string;
  solutions: IkSolution[];
}

function branch(x: number, y: number, sign: 1 | -1): Pose | null {
  const d2 = x * x + y * y;
  const c2 = (d2 - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  if (c2 > 1 + 1e-9 || c2 < -1 - 1e-9) return null;
  const t2r = sign * Math.acos(clamp(c2, -1, 1));
  let t1 = deg(Math.atan2(y, x) - Math.atan2(L2 * Math.sin(t2r), L1 + L2 * Math.cos(t2r)));
  while (t1 < -90) t1 += 360;
  while (t1 >= 270) t1 -= 360;
  return { t1, t2: deg(t2r) };
}

const withinLimits = (p: Pose) => p.t1 >= SHOULDER_MIN - 1e-6 && p.t1 <= SHOULDER_MAX + 1e-6 && Math.abs(p.t2) <= ELBOW_MAX + 1e-6;

/** Inverse kinematics: a target point → up to two sets of joint angles (elbow-up and elbow-down). */
export function ik(x: number, y: number): IkResult {
  const d = Math.hypot(x, y);
  if (d > REACH_MAX + 1e-6) return { d, reachable: false, reason: `Too far — that point is ${d.toFixed(1)} cm from the shoulder, but the arm is only ${REACH_MAX} cm long.`, solutions: [] };
  if (d < Math.abs(L1 - L2) - 1e-6) return { d, reachable: false, reason: `Too close — the folded arm can't get nearer than ${Math.abs(L1 - L2)} cm to its own shoulder.`, solutions: [] };
  const raw = ([1, -1] as const).map((s) => branch(x, y, s)).filter((p): p is Pose => p !== null);
  const poses = raw.length === 2 && Math.abs(raw[0].t2) < 0.05 ? [raw[0]] : raw;
  const sols = poses.map((p) => {
    const elbow = fk(p).elbow;
    let reason: string | undefined;
    if (p.t1 < SHOULDER_MIN - 1e-6 || p.t1 > SHOULDER_MAX + 1e-6) reason = `Shoulder would need ${p.t1.toFixed(0)}° — it only turns from ${SHOULDER_MIN}° to ${SHOULDER_MAX}°.`;
    else if (Math.abs(p.t2) > ELBOW_MAX + 1e-6) reason = `Elbow would need ${p.t2.toFixed(0)}° — it only bends ±${ELBOW_MAX}°.`;
    return { t1: reason ? p.t1 : clamp(p.t1, SHOULDER_MIN, SHOULDER_MAX), t2: p.t2, elbow, valid: !reason, reason, kind: "up" as "up" | "down" };
  });
  if (sols.length === 2) {
    const upFirst = sols[0].elbow.y >= sols[1].elbow.y;
    sols[0].kind = upFirst ? "up" : "down";
    sols[1].kind = upFirst ? "down" : "up";
    if (!upFirst) sols.reverse();
  }
  return { d, reachable: true, solutions: sols };
}

/* ───────────────────────── motion planning ───────────────────────── */

const ease = (s: number) => (s < 0.5 ? 2 * s * s : 1 - (-2 * s + 2) ** 2 / 2);
const lerp = (a: number, b: number, s: number) => a + (b - a) * s;

function jointPath(a: Pose, b: Pose, n: number): Pose[] {
  const out: Pose[] = [];
  for (let i = 1; i <= n; i++) {
    const s = ease(i / n);
    out.push({ t1: lerp(a.t1, b.t1, s), t2: lerp(a.t2, b.t2, s) });
  }
  return out;
}

const clear = (frames: Pose[], minY: number) => frames.every((f) => fk(f).tip.y >= minY - 1e-4);

/** Straight-line (or gently lifted) tip path, solving IK at every step. Only possible when the elbow stays on one side. */
function cartesianPath(a: Pose, b: Pose, lift: number, n: number): Pose[] | null {
  const sb = Math.abs(b.t2) > 0.5 ? Math.sign(b.t2) : 0;
  const sa = Math.abs(a.t2) > 0.5 ? Math.sign(a.t2) : 0;
  if (sa !== 0 && sb !== 0 && sa !== sb) return null;
  const sign = (sb || sa || 1) as 1 | -1;
  const p0 = fk(a).tip;
  const p1 = fk(b).tip;
  const out: Pose[] = [];
  let prev = a;
  for (let i = 1; i <= n; i++) {
    const s = ease(i / n);
    const q = branch(lerp(p0.x, p1.x, s), lerp(p0.y, p1.y, s) + lift * Math.sin(Math.PI * s), sign);
    if (!q || !withinLimits(q) || Math.abs(q.t1 - prev.t1) > 30 || Math.abs(q.t2 - prev.t2) > 40) return null;
    out.push(q);
    prev = q;
  }
  out[out.length - 1] = b;
  return out;
}

const VIAS: Pose[] = [
  { t1: 90, t2: 0 },
  { t1: 90, t2: -90 },
  { t1: 90, t2: 90 },
  { t1: 60, t2: -60 },
  { t1: 120, t2: 60 },
];

/**
 * Frames that take the arm from pose `a` to pose `b` without dipping the tip below `minY`.
 * Prefers a pick-and-place style hop, then a plain joint sweep, then a detour via a raised pose.
 */
export function planMove(a: Pose, b: Pose, minY: number, n = 54): Pose[] {
  const p0 = fk(a).tip;
  const p1 = fk(b).tip;
  const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  for (const lift of dist > 3 ? [3, 1.5, 0] : [0]) {
    const c = cartesianPath(a, b, lift, n);
    if (c && clear(c, minY)) return c;
  }
  const j = jointPath(a, b, n);
  if (clear(j, minY)) return j;
  for (const via of VIAS) {
    const h = Math.round(n * 0.6);
    const first = jointPath(a, via, h);
    const second = jointPath(via, b, h);
    if (clear(first, minY) && clear(second, minY)) return [...first, ...second];
  }
  return [b];
}
