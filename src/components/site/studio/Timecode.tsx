"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./LazyVideo";

const pad = (n: number) => String(n).padStart(2, "0");

function format(frames: number, fps: number) {
  const f = frames % fps;
  const s = Math.floor(frames / fps);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`;
}

/** Running SMPTE-style timecode (HH:MM:SS:FF) for the viewfinder UI. Decorative. */
export function Timecode({ className, fps = 25, startAt = 0 }: { className?: string; fps?: number; startAt?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = -1;
    const t0 = performance.now();
    const tick = (now: number) => {
      const frames = startAt * fps + Math.floor(((now - t0) / 1000) * fps);
      if (frames !== last && ref.current) {
        last = frames;
        ref.current.textContent = format(frames, fps);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, fps, startAt]);

  return (
    <span ref={ref} aria-hidden className={className}>
      {format(startAt * fps, fps)}
    </span>
  );
}
