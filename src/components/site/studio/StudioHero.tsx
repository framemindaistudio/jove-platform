"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CornerMarks, Crosshair, GridBackdrop, SectionLabel } from "@/components/brand/Blueprint";
import { Reveal, RevealLines } from "@/components/site/Reveal";
import { LazyVideo, VideoToggle, useClipPlayback, usePrefersReducedMotion } from "./LazyVideo";
import { Timecode } from "./Timecode";

/** Viewfinder bracket in one corner of the frame. */
function Bracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const map = {
    tl: "left-3 top-3 border-l-2 border-t-2 sm:left-5 sm:top-5",
    tr: "right-3 top-3 border-r-2 border-t-2 sm:right-5 sm:top-5",
    bl: "bottom-3 left-3 border-b-2 border-l-2 sm:bottom-5 sm:left-5",
    br: "bottom-3 right-3 border-b-2 border-r-2 sm:bottom-5 sm:right-5",
  } as const;
  return <span aria-hidden className={`pointer-events-none absolute z-10 size-7 border-paper/70 sm:size-10 ${map[pos]}`} />;
}

/**
 * Studio page hero: a camera viewfinder framed on blueprint paper, with the
 * FrameMind crew clip playing behind a dark grade. Scroll gently pushes in.
 */
export function StudioHero({ studioUrl, specs }: { studioUrl: string; specs: { k: string; v: string }[] }) {
  const frame = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { playing, toggle } = useClipPlayback();
  const { scrollYProgress } = useScroll({ target: frame, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.14]);
  const lift = useTransform(scrollYProgress, [0, 1], [0, -70]);

  return (
    <section className="relative overflow-hidden pb-14 pt-24 sm:pt-28 lg:pb-20">
      <GridBackdrop />
      <div className="container-bp relative">
        <div
          ref={frame}
          className="relative isolate flex min-h-[600px] flex-col overflow-hidden rounded-[var(--radius-lg)] bg-ink text-paper shadow-[var(--shadow-lift)] sm:min-h-[calc(100svh-9rem)] sm:rounded-[var(--radius-xl)]"
        >
          {/* footage */}
          <motion.div className="absolute inset-0 -z-10" style={reduced ? undefined : { scale }}>
            <LazyVideo
              name="crew"
              playing={playing}
              label="Illustrative footage: a film crew with a gimbal camera and boom mic filming two students building a robot car in a classroom"
              className="absolute inset-0"
              objectPosition="60% 50%"
            />
          </motion.div>

          {/* grade */}
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/30" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 via-ink/35 to-transparent" />
          <div aria-hidden className="bp-grid-dark absolute inset-0 -z-10 opacity-40" />
          <div aria-hidden className="paper-grain absolute inset-0 -z-10 opacity-25 mix-blend-overlay" />

          {/* viewfinder chrome */}
          <Bracket pos="tl" />
          <Bracket pos="tr" />
          <Bracket pos="bl" />
          <Bracket pos="br" />
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0 hidden md:block">
            <span className="absolute inset-y-0 left-1/3 w-px bg-paper/[0.08]" />
            <span className="absolute inset-y-0 left-2/3 w-px bg-paper/[0.08]" />
            <span className="absolute inset-x-0 top-1/3 h-px bg-paper/[0.08]" />
            <span className="absolute inset-x-0 top-2/3 h-px bg-paper/[0.08]" />
            <Crosshair className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-paper/35" size={36} />
          </div>

          <div className="relative z-10 flex items-start justify-between gap-4 px-6 pt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/80 sm:px-10 sm:pt-9 sm:text-[11px]">
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="size-2 rounded-full bg-paper animate-blink" />
              <span>Rec</span>
              <Timecode className="tabular text-paper/70" startAt={27} />
            </div>
            <div className="hidden text-right sm:block" aria-hidden>
              <p>4K · 25P · 16:9</p>
              <p className="mt-1 text-paper/50">Cam A · FrameMind AI Studio</p>
            </div>
          </div>

          <motion.div className="relative z-10 mt-auto px-6 pb-8 pt-20 sm:px-10 sm:pb-12 lg:px-14 lg:pb-14" style={reduced ? undefined : { y: lift }}>
            <div className="max-w-3xl">
              <Reveal>
                <SectionLabel index="01" light>
                  FrameMind AI Studio × JOVE
                </SectionLabel>
              </Reveal>
              <h1 className="mt-6 text-[clamp(2.6rem,7.2vw,6.2rem)] font-bold leading-[0.95] tracking-[-0.035em]">
                <RevealLines lines={["Every JOVE Day", "becomes a film."]} />
              </h1>
              <Reveal delay={0.25}>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-paper/75 sm:text-lg">
                  JOVE is the first school Robotics &amp; AI workshop with its own in-house cinematic film studio. While your students build robots, our crew films it all — and your school receives reels, a full-day film and drone shots, free.
                </p>
              </Reveal>
              <Reveal delay={0.35}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button href="/contact" variant="light" size="lg" arrow>
                    Book a JOVE Day
                  </Button>
                  <Button href={studioUrl} external variant="outline-light" size="lg">
                    Visit FrameMind AI Studio <ArrowUpRight className="size-4" aria-hidden />
                  </Button>
                </div>
              </Reveal>
            </div>
          </motion.div>

          <div className="absolute bottom-6 right-6 z-20 sm:bottom-9 sm:right-10">
            <VideoToggle playing={playing} onToggle={toggle} label="background film" />
          </div>
        </div>

        {/* spec strip */}
        <Reveal delay={0.1}>
          <dl className="relative mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-graphite/12 md:grid-cols-4">
            <CornerMarks />
            {specs.map((s, i) => (
              <div key={s.k} className="bg-paper-50 px-5 py-5">
                <dt className="annot flex items-center gap-2 text-blueprint">
                  <span className="font-mono">{String(i + 1).padStart(2, "0")}</span>
                  {s.k}
                </dt>
                <dd className="mt-1.5 text-[15px] font-semibold leading-snug text-graphite">{s.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
