"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "motion/react";
import { usePrefersReducedMotion } from "./LazyVideo";

const fmt = new Intl.NumberFormat("en-IN");

/** Counts up to `value` (Indian digit grouping) the first time it scrolls into view. Server HTML shows the final value. */
export function CountUp({ value, prefix = "", suffix = "", duration = 1.8, className }: { value: number; prefix?: string; suffix?: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduced) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = `${prefix}${fmt.format(Math.round(v))}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, reduced, value, prefix, suffix, duration]);

  return (
    <span ref={ref} className={className}>
      {`${prefix}${fmt.format(value)}${suffix}`}
    </span>
  );
}
