"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionStyle, type MotionValue } from "motion/react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { LazyVideo, VideoToggle, useClipPlayback, usePrefersReducedMotion, type ClipName } from "./LazyVideo";

export interface Reel {
  clip: ClipName;
  /** Short name of the reel, e.g. "The build". */
  title: string;
  /** One line shown as the on-screen caption. */
  caption: string;
  /** Accessible description of the footage. */
  label: string;
  /** Focal point of the 9:16 crop inside the 16:9 clip. */
  position?: string;
}

/** Drift (px) for each phone as the section scrolls through the viewport — the middle one leads. */
const DRIFT = [36, -28, 52];

function Phone({ reel, index, total, playing, progress, still }: { reel: Reel; index: number; total: number; playing: boolean; progress: MotionValue<number>; still: boolean }) {
  const d = DRIFT[index % DRIFT.length];
  const y = useTransform(progress, [0, 1], [`${d}px`, `${-d}px`]);
  /* Parallax only from `sm` up — inside the phone-width snap carousel the frames stay level. */
  const drift = { "--py": y } as unknown as MotionStyle;
  const n = String(index + 1).padStart(2, "0");

  return (
    <li className="w-[68%] max-w-[300px] shrink-0 snap-center sm:w-auto sm:max-w-none sm:shrink">
      <motion.figure style={still ? undefined : drift} className={cn("relative mx-auto w-full max-w-[300px] sm:[translate:0_var(--py,0px)]", index === 1 && "sm:-mt-10")}>
        {/* handset */}
        <div className="relative rounded-[2.4rem] border border-graphite/30 bg-ink p-[7px] shadow-[var(--shadow-lift)]">
          <span aria-hidden className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-l bg-graphite" />
          <span aria-hidden className="absolute -right-[3px] top-32 h-16 w-[3px] rounded-r bg-graphite" />
          <div className="relative isolate aspect-[9/16] overflow-hidden rounded-[2rem] bg-graphite">
            <LazyVideo name={reel.clip} small playing={playing} label={reel.label} objectPosition={reel.position} className="absolute inset-0 -z-10" />
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-transparent to-ink/45" />

            {/* notch */}
            <span aria-hidden className="absolute left-1/2 top-2.5 h-[18px] w-[72px] -translate-x-1/2 rounded-full bg-ink" />

            {/* story bars */}
            <div aria-hidden className="absolute inset-x-4 top-10 flex gap-1">
              {Array.from({ length: total }, (_, i) => (
                <span key={i} className={cn("h-[2px] flex-1 rounded-full", i <= index ? "bg-paper/90" : "bg-paper/30")} />
              ))}
            </div>

            {/* reel chrome */}
            <div aria-hidden className="absolute bottom-20 right-3 flex flex-col items-center gap-4 text-paper/85">
              <Heart className="size-5" strokeWidth={1.5} />
              <MessageCircle className="size-5" strokeWidth={1.5} />
              <Send className="size-5" strokeWidth={1.5} />
            </div>
            <div aria-hidden className="absolute inset-x-4 bottom-5 text-paper">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/60">@yourschool · Reel {n}</p>
              <p className="mt-1.5 pr-8 text-[13px] font-semibold leading-snug">{reel.caption}</p>
            </div>
          </div>
        </div>
        <figcaption className="mt-5 flex items-baseline justify-between gap-3 px-1">
          <span className="text-[15px] font-bold tracking-[-0.01em] text-graphite">{reel.title}</span>
          <span className="annot font-mono text-blueprint">9:16 · {n}</span>
        </figcaption>
      </motion.figure>
    </li>
  );
}

/**
 * Three phone frames playing 9:16 crops of the sample clips. Clips load lazily and play only
 * while in view; one control pauses all three. On phones the row becomes a snap carousel.
 */
export function ReelsShowcase({ reels, note }: { reels: Reel[]; note?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { playing, toggle } = useClipPlayback();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  return (
    <div ref={ref} className="relative">
      <ul
        tabIndex={0}
        aria-label="Sample reel framings — scroll sideways to see all three"
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 pt-2 focus-visible:outline-offset-4 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-3 sm:gap-8 sm:overflow-visible sm:px-0 sm:pt-12 lg:gap-14"
      >
        {reels.map((r, i) => (
          <Phone key={r.clip} reel={r} index={i} total={reels.length} playing={playing} progress={scrollYProgress} still={reduced} />
        ))}
      </ul>
      <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-dashed border-graphite/25 pt-5 sm:flex-row sm:items-center">
        {note && <p className="max-w-xl text-xs leading-relaxed text-blueprint">{note}</p>}
        <VideoToggle playing={playing} onToggle={toggle} label="sample reels" tone="dark" className="shrink-0" />
      </div>
    </div>
  );
}
