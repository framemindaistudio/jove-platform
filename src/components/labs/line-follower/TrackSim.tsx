"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { drawBot, drawTrackLayer, drawTrail, getMask } from "./render";
import { createBot, describe, DT, stepBot, type Action, type BotConfig, type BotState, type BotStatus, type LapEvent, type Mask, type RuleKey } from "./sim";
import { getTrack, WORLD_H, WORLD_W, type Track, type TrackId } from "./tracks";

/** Snapshot of the robot for the read-outs (sent ~10× a second, not every frame). */
export interface Hud {
  sL: number;
  sR: number;
  bL: boolean;
  bR: boolean;
  vL: number;
  vR: number;
  steer: number;
  rule: RuleKey;
  action: Action;
  lapT: number;
  laps: number;
  offCount: number;
  off: boolean;
  slip: number;
  status: BotStatus;
  moving: boolean;
  text: string;
}

export const EMPTY_HUD: Hud = {
  sL: 0,
  sR: 0,
  bL: false,
  bR: false,
  vL: 0,
  vR: 0,
  steer: 0,
  rule: "ww",
  action: "straight",
  lapT: 0,
  laps: 0,
  offCount: 0,
  off: false,
  slip: 0,
  status: "ok",
  moving: false,
  text: "",
};

interface Runtime {
  track: Track;
  mask: Mask;
  bot: BotState;
  trail: number[];
  layer: HTMLCanvasElement | null;
  cssW: number;
  dpr: number;
}

interface Props {
  trackId: TrackId;
  config: BotConfig;
  running: boolean;
  /** Change this number to put the robot back on the start line. */
  resetKey: number;
  onHud?: (hud: Hud) => void;
  onLap?: (lap: LapEvent, trackId: TrackId) => void;
  onStop?: (status: Exclude<BotStatus, "ok">) => void;
  label: string;
}

function hudOf(bot: BotState, cfg: BotConfig, moving: boolean): Hud {
  return {
    sL: bot.sL,
    sR: bot.sR,
    bL: bot.bL,
    bR: bot.bR,
    vL: bot.vL,
    vR: bot.vR,
    steer: bot.steer,
    rule: bot.rule,
    action: bot.action,
    lapT: bot.lapT,
    laps: bot.laps,
    offCount: bot.offCount,
    off: bot.off,
    slip: bot.slip,
    status: bot.status,
    moving,
    text: moving ? describe(bot, cfg) : "",
  };
}

/**
 * The simulation canvas: fixed-timestep physics driven by requestAnimationFrame,
 * responsive to its container (ResizeObserver) and sharp on high-DPI screens.
 */
export const TrackSim = memo(function TrackSim({ trackId, config, running, resetKey, onHud, onLap, onStop, label }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rt = useRef<Runtime | null>(null);
  const cfgRef = useRef(config);
  const cbRef = useRef({ onHud, onLap, onStop });

  const draw = useCallback(() => {
    const r = rt.current;
    const canvas = canvasRef.current;
    if (!r || !canvas || r.cssW === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const k = (r.cssW / WORLD_W) * r.dpr;
    if (!r.layer) {
      const layer = document.createElement("canvas");
      layer.width = canvas.width;
      layer.height = canvas.height;
      const lctx = layer.getContext("2d");
      if (lctx) {
        lctx.setTransform(k, 0, 0, k, 0, 0);
        drawTrackLayer(lctx, r.track);
      }
      r.layer = layer;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(r.layer, 0, 0);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    drawTrail(ctx, r.trail);
    drawBot(ctx, r.bot, cfgRef.current);
  }, []);

  // keep the latest tuning + callbacks reachable from the animation loop
  useEffect(() => {
    cfgRef.current = config;
    cbRef.current = { onHud, onLap, onStop };
    if (!running) draw(); // show slider changes (e.g. sensor spacing) while paused
  }, [config, onHud, onLap, onStop, running, draw]);

  // (re)build the world when the track changes or a reset is requested
  useEffect(() => {
    const track = getTrack(trackId);
    const prev = rt.current;
    rt.current = {
      track,
      mask: getMask(track),
      bot: createBot(track),
      trail: [],
      layer: prev && prev.track.id === trackId ? prev.layer : null,
      cssW: prev?.cssW ?? 0,
      dpr: prev?.dpr ?? 1,
    };
    draw();
    cbRef.current.onHud?.(hudOf(rt.current.bot, cfgRef.current, false));
  }, [trackId, resetKey, draw]);

  // responsive canvas
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const fit = () => {
      const cssW = Math.max(1, Math.floor(wrap.clientWidth));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = rt.current;
      if (!r || (r.cssW === cssW && r.dpr === dpr)) return;
      r.cssW = cssW;
      r.dpr = dpr;
      r.layer = null;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(((cssW * WORLD_H) / WORLD_W) * dpr);
      draw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [draw]);

  // the loop
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let hudAt = 0;
    const frame = (now: number) => {
      const r = rt.current;
      if (!r) return;
      acc += Math.min(0.05, (now - last) / 1000);
      last = now;
      const cfg = cfgRef.current;
      while (acc >= DT && r.bot.status === "ok") {
        const lap = stepBot(r.bot, r.track, r.mask, cfg, DT);
        acc -= DT;
        if (lap) {
          r.trail.length = 0;
          cbRef.current.onLap?.(lap, r.track.id);
        }
        const t = r.trail;
        const tl = t.length;
        if (tl === 0 || (r.bot.x - t[tl - 2]) ** 2 + (r.bot.y - t[tl - 1]) ** 2 > 36) {
          t.push(r.bot.x, r.bot.y);
          if (t.length > 1400) t.splice(0, 2);
        }
      }
      draw();
      const stopped = r.bot.status !== "ok";
      if (stopped || now - hudAt > 90) {
        hudAt = now;
        cbRef.current.onHud?.(hudOf(r.bot, cfg, !stopped));
      }
      if (stopped) {
        cbRef.current.onStop?.(r.bot.status as Exclude<BotStatus, "ok">);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, trackId, resetKey, draw]);

  return (
    <div ref={wrapRef} className="w-full">
      <canvas ref={canvasRef} role="img" aria-label={label} className="block w-full touch-pan-y select-none" style={{ aspectRatio: `${WORLD_W} / ${WORLD_H}` }} />
    </div>
  );
});
