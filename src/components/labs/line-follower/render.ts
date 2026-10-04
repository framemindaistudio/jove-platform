/**
 * Line Follower lab — browser-only drawing helpers (offscreen sensor mask + pencil-style rendering).
 */
import { BOT, rasterMask, sensorPositions, type BotConfig, type BotState, type Mask } from "./sim";
import { LINE_W, WORLD_H, WORLD_W, type Track, type TrackId } from "./tracks";

const GRAPHITE = "#2b2b2b";
const PAPER = "#fbf9f4";
const BLUEPRINT = "#7a7a7a";
const BAD = "#8b3a3a";

function tracePath(ctx: CanvasRenderingContext2D, track: Track) {
  ctx.beginPath();
  ctx.moveTo(track.pts[0], track.pts[1]);
  for (let i = 1; i < track.n; i++) ctx.lineTo(track.pts[i * 2], track.pts[i * 2 + 1]);
  ctx.closePath();
}

const maskCache = new Map<TrackId, Mask>();

/**
 * What the robot's sensors "see": the track is drawn (black on white, 1 px = 1 mm) on an
 * offscreen canvas and its pixels are read back as a darkness map.
 */
export function getMask(track: Track): Mask {
  const hit = maskCache.get(track.id);
  if (hit) return hit;
  let mask: Mask | null = null;
  try {
    const c = document.createElement("canvas");
    c.width = WORLD_W;
    c.height = WORLD_H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = LINE_W;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      tracePath(ctx, track);
      ctx.stroke();
      const img = ctx.getImageData(0, 0, WORLD_W, WORLD_H).data;
      const data = new Uint8Array(WORLD_W * WORLD_H);
      for (let i = 0; i < data.length; i++) data[i] = 255 - img[i * 4];
      // Some privacy modes scramble canvas read-back — sanity-check before trusting it.
      const onLine = data[Math.round(track.pts[1]) * WORLD_W + Math.round(track.pts[0])];
      if (onLine > 200 && data[0] < 40 && data[data.length - 1] < 40) mask = { w: WORLD_W, h: WORLD_H, data };
    }
  } catch {
    mask = null;
  }
  if (!mask) mask = rasterMask(track);
  maskCache.set(track.id, mask);
  return mask;
}

/** Deterministic wobble so the "pencil" edges look hand-drawn but never flicker. */
const wobble = (i: number, phase: number) => Math.sin(i * 0.173 + phase) * 0.7 + Math.sin(i * 0.061 + phase * 2.1) * 0.9;

function edgeStroke(ctx: CanvasRenderingContext2D, track: Track, offset: number, phase: number) {
  const n = track.n;
  ctx.beginPath();
  for (let i = 0; i <= n; i += 3) {
    const a = ((i - 2 + n) % n) * 2;
    const b = ((i + 2) % n) * 2;
    const c = (i % n) * 2;
    const tx = track.pts[b] - track.pts[a];
    const ty = track.pts[b + 1] - track.pts[a + 1];
    const l = Math.hypot(tx, ty) || 1;
    const o = offset + wobble(i, phase);
    const x = track.pts[c] + (-ty / l) * o;
    const y = track.pts[c + 1] + (tx / l) * o;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/** Static layer: the taped line, start/finish marker and blueprint annotations. Drawn in world mm. */
export function drawTrackLayer(ctx: CanvasRenderingContext2D, track: Track) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // table crop marks
  ctx.strokeStyle = "rgba(43,43,43,0.35)";
  ctx.lineWidth = 1.5;
  const m = 14;
  const L = 26;
  for (const [cx, cy, sx, sy] of [
    [m, m, 1, 1],
    [WORLD_W - m, m, -1, 1],
    [m, WORLD_H - m, 1, -1],
    [WORLD_W - m, WORLD_H - m, -1, -1],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(cx + sx * L, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * L);
    ctx.stroke();
  }

  // soft graphite smudge under the line
  ctx.strokeStyle = "rgba(43,43,43,0.07)";
  ctx.lineWidth = LINE_W + 10;
  tracePath(ctx, track);
  ctx.stroke();
  // the tape
  ctx.strokeStyle = "rgba(43,43,43,0.9)";
  ctx.lineWidth = LINE_W;
  tracePath(ctx, track);
  ctx.stroke();
  // pencil edges
  ctx.strokeStyle = "rgba(22,22,22,0.55)";
  ctx.lineWidth = 1.1;
  edgeStroke(ctx, track, LINE_W / 2 + 0.6, 0.4);
  edgeStroke(ctx, track, -(LINE_W / 2 + 0.6), 2.2);
  ctx.strokeStyle = "rgba(245,241,232,0.09)";
  ctx.lineWidth = 2;
  edgeStroke(ctx, track, 3, 4.1);

  // start / finish chequer
  const tx = track.pts[2] - track.pts[0];
  const ty = track.pts[3] - track.pts[1];
  const tl = Math.hypot(tx, ty) || 1;
  const ang = Math.atan2(ty, tx);
  ctx.save();
  ctx.translate(track.pts[0], track.pts[1]);
  ctx.rotate(ang);
  const sq = 6.5;
  for (let r = -4; r < 4; r++) {
    for (let c = 0; c < 2; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? PAPER : GRAPHITE;
      ctx.fillRect(-sq + c * sq, r * sq, sq, sq);
    }
  }
  ctx.strokeStyle = GRAPHITE;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-sq, -4 * sq, 2 * sq, 8 * sq);
  ctx.restore();
  // label on the side of the line facing away from the table centre
  let nx = -ty / tl;
  let ny = tx / tl;
  if ((track.pts[0] + nx * 40 - WORLD_W / 2) ** 2 + (track.pts[1] + ny * 40 - WORLD_H / 2) ** 2 < (track.pts[0] - WORLD_W / 2) ** 2 + (track.pts[1] - WORLD_H / 2) ** 2) {
    nx = -nx;
    ny = -ny;
  }
  ctx.fillStyle = BLUEPRINT;
  ctx.font = "600 15px 'JetBrains Mono', ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("START / FINISH", track.pts[0] + nx * 44, track.pts[1] + ny * 44);
  ctx.textAlign = "right";
  ctx.font = "500 13px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(`TABLE 1000 × 640 mm · TAPE ${LINE_W} mm · LAP ${(track.length / 10).toFixed(0)} cm`, WORLD_W - 22, WORLD_H - 22);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Dotted pencil trail of where the robot has been (interleaved x,y list). */
export function drawTrail(ctx: CanvasRenderingContext2D, trail: number[]) {
  if (trail.length < 4) return;
  ctx.save();
  ctx.strokeStyle = "rgba(122,122,122,0.75)";
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 7]);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(trail[0], trail[1]);
  for (let i = 2; i < trail.length; i += 2) ctx.lineTo(trail[i], trail[i + 1]);
  ctx.stroke();
  ctx.restore();
}

/** The sketchy two-wheel robot, seen from above. */
export function drawBot(ctx: CanvasRenderingContext2D, s: BotState, cfg: BotConfig) {
  const half = cfg.spacing / 2;
  const a = BOT.sensorAhead;

  // light cones under the sensors (drawn in world space)
  const sp = sensorPositions(s, cfg.spacing);
  ctx.fillStyle = "rgba(43,43,43,0.10)";
  for (const [x, y] of [
    [sp.lx, sp.ly],
    [sp.rx, sp.ry],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, BOT.footprint + 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.th);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (s.off) {
    ctx.strokeStyle = BAD;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.arc(8, 0, 62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // shadow
  ctx.fillStyle = "rgba(43,43,43,0.14)";
  roundRect(ctx, -30 + 3, -BOT.bodyW / 2 + 5, BOT.bodyL - 12, BOT.bodyW, 12);
  ctx.fill();

  // wheels
  ctx.fillStyle = GRAPHITE;
  for (const side of [-1, 1]) {
    roundRect(ctx, -17, side * (BOT.wheelBase / 2) - 6, 34, 12, 3);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(245,241,232,0.5)";
  ctx.lineWidth = 1;
  for (const side of [-1, 1]) {
    for (let t = -12; t <= 12; t += 6) {
      ctx.beginPath();
      ctx.moveTo(t, side * (BOT.wheelBase / 2) - 4);
      ctx.lineTo(t, side * (BOT.wheelBase / 2) + 4);
      ctx.stroke();
    }
  }

  // chassis plate
  ctx.fillStyle = PAPER;
  ctx.strokeStyle = GRAPHITE;
  ctx.lineWidth = 2.2;
  roundRect(ctx, -30, -22, 62, 44, 11);
  ctx.fill();
  ctx.stroke();
  // second, lighter pencil pass
  ctx.strokeStyle = "rgba(43,43,43,0.35)";
  ctx.lineWidth = 1;
  roundRect(ctx, -31.5, -20.5, 64, 42, 12);
  ctx.stroke();

  // battery pack (hatched) + controller board
  ctx.strokeStyle = "rgba(43,43,43,0.7)";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-24, -13, 20, 26);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-24, -13, 20, 26);
  ctx.clip();
  ctx.strokeStyle = "rgba(43,43,43,0.3)";
  for (let h = -40; h < 30; h += 5) {
    ctx.beginPath();
    ctx.moveTo(-24 + h, 13);
    ctx.lineTo(-24 + h + 26, -13);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(43,43,43,0.7)";
  ctx.strokeRect(2, -11, 20, 22);
  ctx.fillStyle = GRAPHITE;
  ctx.fillRect(7, -5, 10, 10);

  // sensor arm + bar
  ctx.strokeStyle = GRAPHITE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(32, 0);
  ctx.lineTo(a - 5, 0);
  ctx.stroke();
  ctx.fillStyle = PAPER;
  roundRect(ctx, a - 5, -half - 9, 10, cfg.spacing + 18, 4);
  ctx.fill();
  ctx.stroke();
  // sensors (filled = sees black)
  for (const [y, on] of [
    [-half, s.bL],
    [half, s.bR],
  ] as const) {
    ctx.beginPath();
    ctx.arc(a, y, BOT.footprint, 0, Math.PI * 2);
    ctx.fillStyle = on ? GRAPHITE : PAPER;
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = GRAPHITE;
    ctx.stroke();
    if (on) {
      ctx.strokeStyle = "rgba(43,43,43,0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(a, y, BOT.footprint + 4.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}
