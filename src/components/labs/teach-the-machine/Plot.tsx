"use client";

import { memo, useEffect, useRef, useState } from "react";
import { GRAMS, MM, perceptronScore, XMAX, type Classifier, type Label, type Perceptron, type Sample } from "./ml";

const INK = "#2B2B2B";
const GREY = "#7A7A7A";
const PAPER = "#F5F1E8";
const ML = 46; // margins around the plot area (CSS px)
const MR = 12;
const MT = 10;
const MB = 38;

/** What the k-NN demo draws on top of the data. */
export interface KnnOverlay {
  x: number;
  y: number;
  lines: "none" | "all" | "near";
  near: number[];
  result: Label | null;
}

export interface PlotProps {
  samples: Sample[];
  /** Ring the held-back test samples. */
  split: boolean;
  /** Paints the decision regions. */
  classify: Classifier | null;
  /** A perceptron to draw exactly (straight boundary) instead of sampling `classify`. */
  line?: Perceptron | null;
  /** Sample indices the model gets wrong — crossed out. */
  wrong?: number[];
  highlight?: number | null;
  overlay?: KnnOverlay | null;
  onAdd?: (x: number, y: number) => void;
  label: string;
}

const heightFor = (w: number) => Math.round(MT + MB + (w - ML - MR) / XMAX);

function makePatterns(ctx: CanvasRenderingContext2D, dpr: number): (CanvasPattern | null)[] {
  const t = Math.round(7 * dpr);
  const tile = () => {
    const c = document.createElement("canvas");
    c.width = c.height = t;
    return c;
  };
  // bolts → pencil hatching
  const a = tile();
  const ac = a.getContext("2d");
  if (ac) {
    ac.strokeStyle = "rgba(43,43,43,0.4)";
    ac.lineWidth = Math.max(1, dpr * 0.9);
    ac.lineCap = "square";
    ac.beginPath();
    ac.moveTo(0, t);
    ac.lineTo(t, 0);
    ac.moveTo(-1, 1);
    ac.lineTo(1, -1);
    ac.moveTo(t - 1, t + 1);
    ac.lineTo(t + 1, t - 1);
    ac.stroke();
  }
  // nuts → stipple dots
  const b = tile();
  const bc = b.getContext("2d");
  if (bc) {
    const d = Math.max(1, Math.round(1.4 * dpr));
    bc.fillStyle = "rgba(43,43,43,0.36)";
    bc.fillRect(Math.floor(t / 2), Math.floor(t / 2), d, d);
  }
  return [a, b].map((c) => {
    const p = ctx.createPattern(c, "repeat");
    if (p && typeof p.setTransform === "function") p.setTransform(new DOMMatrix().scale(1 / dpr));
    return p;
  });
}

/** Clip a polygon to the half-plane f ≥ 0 (Sutherland–Hodgman, one edge). */
function clipHalf(poly: number[][], f: (x: number, y: number) => number): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const fa = f(a[0], a[1]);
    const fb = f(b[0], b[1]);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) {
      const t = fa / (fa - fb);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), 1]);
    }
  }
  return out;
}

function drawPoint(ctx: CanvasRenderingContext2D, cx: number, cy: number, label: Label, r = 5.2) {
  ctx.setLineDash([]);
  if (label === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = PAPER;
    ctx.stroke();
  } else {
    const h = r * 0.92;
    ctx.fillStyle = PAPER;
    ctx.fillRect(cx - h, cy - h, h * 2, h * 2);
    ctx.lineWidth = 1.9;
    ctx.strokeStyle = INK;
    ctx.strokeRect(cx - h, cy - h, h * 2, h * 2);
  }
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, p: PlotProps, font: string, pats: (CanvasPattern | null)[]) {
  const sc = (w - ML - MR) / XMAX;
  const pw = XMAX * sc;
  const ph = sc;
  const X = (x: number) => ML + x * sc;
  const Y = (y: number) => MT + (1 - y) * sc;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#FBF9F4";
  ctx.fillRect(ML, MT, pw, ph);

  // faint grid at the axis ticks
  ctx.strokeStyle = "rgba(43,43,43,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const mm of [15, 30, 45]) {
    ctx.moveTo(Math.round(X(mm / MM)) + 0.5, MT);
    ctx.lineTo(Math.round(X(mm / MM)) + 0.5, MT + ph);
  }
  for (const g of [10, 20, 30]) {
    ctx.moveTo(ML, Math.round(Y(g / GRAMS)) + 0.5);
    ctx.lineTo(ML + pw, Math.round(Y(g / GRAMS)) + 0.5);
  }
  ctx.stroke();

  // decision regions
  ctx.save();
  ctx.beginPath();
  ctx.rect(ML, MT, pw, ph);
  ctx.clip();
  if (p.line) {
    const model = p.line;
    const box = [
      [0, 0],
      [XMAX, 0],
      [XMAX, 1],
      [0, 1],
    ];
    const cut: number[][] = [];
    [1, -1].forEach((sign, cls) => {
      const poly = clipHalf(box, (x, y) => sign * perceptronScore(model, x, y));
      if (poly.length < 3) return;
      ctx.beginPath();
      poly.forEach((q, i) => (i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1]))));
      ctx.closePath();
      ctx.fillStyle = pats[cls] ?? "transparent";
      ctx.fill();
      if (cls === 0) cut.push(...poly.filter((q) => q[2] === 1));
    });
    if (cut.length === 2) {
      ctx.beginPath();
      ctx.moveTo(X(cut[0][0]), Y(cut[0][1]));
      ctx.lineTo(X(cut[1][0]), Y(cut[1][1]));
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
  } else if (p.classify) {
    const cell = Math.max(5, Math.min(9, Math.round(pw / 84)));
    const cols = Math.ceil(pw / cell);
    const rows = Math.ceil(ph / cell);
    const grid = new Int8Array(cols * rows);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const v = p.classify(((c + 0.5) * cell) / sc, 1 - ((r + 0.5) * cell) / sc);
        grid[r * cols + c] = v === null ? -1 : v;
      }
    for (const cls of [0, 1]) {
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        let c = 0;
        while (c < cols) {
          if (grid[r * cols + c] !== cls) {
            c++;
            continue;
          }
          const c0 = c;
          while (c < cols && grid[r * cols + c] === cls) c++;
          ctx.rect(ML + c0 * cell, MT + r * cell, (c - c0) * cell, cell);
        }
      }
      ctx.fillStyle = pats[cls] ?? "transparent";
      ctx.fill();
    }
    ctx.beginPath();
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const v = grid[r * cols + c];
        if (v < 0) continue;
        if (c + 1 < cols && grid[r * cols + c + 1] >= 0 && grid[r * cols + c + 1] !== v) {
          ctx.moveTo(ML + (c + 1) * cell, MT + r * cell);
          ctx.lineTo(ML + (c + 1) * cell, MT + (r + 1) * cell);
        }
        if (r + 1 < rows && grid[(r + 1) * cols + c] >= 0 && grid[(r + 1) * cols + c] !== v) {
          ctx.moveTo(ML + c * cell, MT + (r + 1) * cell);
          ctx.lineTo(ML + (c + 1) * cell, MT + (r + 1) * cell);
        }
      }
    ctx.strokeStyle = "rgba(43,43,43,0.85)";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  // k-NN demo: distance lines
  const o = p.overlay;
  if (o && o.lines !== "none") {
    const qx = X(o.x);
    const qy = Y(o.y);
    if (o.lines === "all") {
      ctx.strokeStyle = "rgba(43,43,43,0.28)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      p.samples.forEach((s) => {
        ctx.moveTo(qx, qy);
        ctx.lineTo(X(s.x), Y(s.y));
      });
      ctx.stroke();
    }
    if (o.near.length) {
      const far = p.samples[o.near[o.near.length - 1]];
      const rad = Math.hypot(far.x - o.x, far.y - o.y) * sc + 9;
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(qx, qy, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      o.near.forEach((i) => {
        ctx.moveTo(qx, qy);
        ctx.lineTo(X(p.samples[i].x), Y(p.samples[i].y));
      });
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  ctx.restore();

  // the data
  const wrong = new Set(p.wrong ?? []);
  p.samples.forEach((s, i) => {
    const cx = X(s.x);
    const cy = Y(s.y);
    if (p.split && s.test) {
      ctx.beginPath();
      ctx.arc(cx, cy, 10.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(251,249,244,0.9)";
      ctx.fill();
      ctx.setLineDash([2.5, 2.5]);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
    drawPoint(ctx, cx, cy, s.label);
    if (wrong.has(i)) {
      for (const [lw, col] of [
        [5, PAPER],
        [2.2, INK],
      ] as const) {
        ctx.beginPath();
        ctx.moveTo(cx - 8.5, cy - 8.5);
        ctx.lineTo(cx + 8.5, cy + 8.5);
        ctx.moveTo(cx + 8.5, cy - 8.5);
        ctx.lineTo(cx - 8.5, cy + 8.5);
        ctx.lineWidth = lw;
        ctx.strokeStyle = col;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }
    if (o && o.near.includes(i)) {
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
  });
  if (p.highlight !== null && p.highlight !== undefined && p.samples[p.highlight]) {
    const s = p.samples[p.highlight];
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(X(s.x), Y(s.y), 15, 0, Math.PI * 2);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
  if (o) {
    const qx = X(o.x);
    const qy = Y(o.y);
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(qx, qy, 13, 0, Math.PI * 2);
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = INK;
    ctx.stroke();
    if (o.result === null) {
      ctx.fillStyle = INK;
      ctx.font = `700 15px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", qx, qy + 1);
    } else drawPoint(ctx, qx, qy, o.result, 6);
  }

  // frame, ticks and axis titles
  ctx.setLineDash([]);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(ML + 0.5, MT + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = GREY;
  ctx.font = `10px ${font}`;
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  for (const mm of [0, 15, 30, 45, 60]) ctx.fillText(String(mm), X(mm / MM), MT + ph + 5);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const g of [0, 10, 20, 30, 40]) ctx.fillText(String(g), ML - 6, Y(g / GRAMS));
  ctx.fillStyle = INK;
  ctx.font = `600 10px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("LENGTH (mm) →", ML + pw / 2, h - 5);
  ctx.save();
  ctx.translate(12, MT + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("WEIGHT (g) →", 0, 0);
  ctx.restore();
}

/**
 * Scatter plot on a canvas: responsive to its container (ResizeObserver), sharp on high-DPI screens,
 * and tappable (mouse, pen or touch) to add points.
 */
export const Plot = memo(function Plot(props: PlotProps) {
  const { onAdd, label } = props;
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pats = useRef<{ dpr: number; list: (CanvasPattern | null)[] } | null>(null);
  const [size, setSize] = useState({ w: 0, dpr: 1 });

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const w = Math.floor(el.clientWidth);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      setSize((s) => (s.w === w && s.dpr === dpr ? s : { w, dpr }));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const c = canvas.current;
    const { w, dpr } = size;
    if (!c || w < 120) return;
    const h = heightFor(w);
    const pxW = Math.round(w * dpr);
    const pxH = Math.round(h * dpr);
    if (c.width !== pxW || c.height !== pxH) {
      c.width = pxW;
      c.height = pxH;
    }
    const ctx = c.getContext("2d");
    if (!ctx) return;
    if (!pats.current || pats.current.dpr !== dpr) pats.current = { dpr, list: makePatterns(ctx, dpr) };
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, w, h, props, getComputedStyle(c).fontFamily || "monospace", pats.current.list);
  }, [size, props]);

  const click = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onAdd) return;
    const r = e.currentTarget.getBoundingClientRect();
    const sc = (r.width - ML - MR) / XMAX;
    const x = (e.clientX - r.left - ML) / sc;
    const y = 1 - (e.clientY - r.top - MT) / sc;
    if (x >= 0 && x <= XMAX && y >= 0 && y <= 1) onAdd(x, y);
  };

  return (
    <div ref={wrap} className="w-full">
      <canvas ref={canvas} role="img" aria-label={label} onClick={click} className="block w-full touch-manipulation font-mono" style={{ height: size.w ? heightFor(size.w) : 300, cursor: onAdd ? "crosshair" : "default" }} />
    </div>
  );
});
