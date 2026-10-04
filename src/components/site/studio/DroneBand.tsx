"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { LazyVideo, VideoToggle, useClipPlayback, usePrefersReducedMotion } from "./LazyVideo";

/**
 * Full-bleed aerial band: the drone clip plays behind a dark grade and drifts gently against
 * the scroll. Content is passed as children so the copy stays server-rendered.
 */
export function DroneBand({ labelledBy, children }: { labelledBy: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const { playing, toggle } = useClipPlayback();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);

  return (
    <section ref={ref} aria-labelledby={labelledBy} className="relative isolate overflow-hidden bg-ink text-paper">
      <motion.div className="absolute inset-x-0 -inset-y-[9%] -z-10" style={reduced ? undefined : { y }}>
        <LazyVideo
          name="drone"
          playing={playing}
          label="Illustrative aerial footage: a school campus seen from above, with students standing in a large circle on the playground"
          className="absolute inset-0"
        />
      </motion.div>

      {/* grade */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/80 via-ink/35 to-ink/90" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/70 via-transparent to-transparent" />
      <div aria-hidden className="bp-grid-dark absolute inset-0 -z-10 opacity-35" />

      {/* flight HUD — decorative */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
        <span className="absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-paper/20" />
        <span className="absolute left-1/2 top-1/2 h-px w-64 -translate-x-1/2 bg-paper/15" />
        <span className="absolute left-1/2 top-1/2 h-64 w-px -translate-y-1/2 bg-paper/15" />
        <span className="absolute right-8 top-1/2 flex -translate-y-1/2 flex-col gap-2">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className={i === 4 ? "h-px w-6 bg-paper/70" : "h-px w-3 bg-paper/30"} />
          ))}
        </span>
      </div>

      {children}

      <div className="absolute right-5 top-6 z-10 sm:right-10 sm:top-10">
        <VideoToggle playing={playing} onToggle={toggle} label="aerial footage" />
      </div>
    </section>
  );
}
