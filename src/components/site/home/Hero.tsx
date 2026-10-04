"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDown, Bot, Clapperboard, GraduationCap, Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AnnotationStack, ConstructionCircle, Crosshair, GridBackdrop } from "@/components/brand/Blueprint";
import { usePreloaderDone } from "./hooks";
import { HeroVisual } from "./HeroVisual";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const LINES = ["Building", "real-world", "skills through", "Robotics & AI."];
const PILLARS = [
  { icon: Bot, label: "Robotics Kits & Modules" },
  { icon: GraduationCap, label: "STEM Education" },
  { icon: Clapperboard, label: "Workshops & Media" },
  { icon: Wrench, label: "Real-World Skills" },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const started = usePreloaderDone();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -110]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, reduce ? 1 : 0]);

  const show = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: started ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.9, delay, ease: EASE },
  });

  return (
    <section ref={ref} aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-paper">
      <GridBackdrop />
      <ConstructionCircle size={880} className="pointer-events-none absolute -right-56 top-1/2 hidden -translate-y-1/2 text-graphite/[0.08] lg:block" />
      <Crosshair size={36} className="pointer-events-none absolute left-[46%] top-28 hidden text-graphite/30 lg:block" />

      {/* copy */}
      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="container-bp relative z-10 flex flex-1 items-center pb-6 pt-28 sm:pt-32 lg:pb-28 lg:pt-24">
        <div className="w-full max-w-[42rem] lg:max-w-[50%]">
          <motion.div {...show(0)} className="annot flex flex-wrap items-center gap-x-3 gap-y-1 text-blueprint">
            <span className="h-px w-8 bg-graphite/40" />
            <span className="font-mono tracking-[0.12em]">00</span>
            <span className="text-graphite/30">/</span>
            <span>Robotics · AI · STEM — Grades 1 to 10</span>
          </motion.div>

          <h1 id="hero-title" className="mt-5 text-[clamp(2.3rem,min(0.9rem+4.7vw,7.4svh),5.75rem)] font-bold leading-[0.98] tracking-[-0.035em] text-graphite">
            {LINES.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <motion.span
                  className="relative block lg:whitespace-nowrap"
                  initial={{ y: "110%" }}
                  animate={started ? { y: "0%" } : undefined}
                  transition={{ duration: 1.1, delay: 0.08 + i * 0.09, ease: EASE }}
                >
                  {i === LINES.length - 1 ? (
                    <span className="relative inline-block">
                      Robotics <span className="font-medium italic text-charcoal">&amp;</span> AI.
                      <svg aria-hidden viewBox="0 0 300 14" preserveAspectRatio="none" className="absolute -bottom-[0.06em] left-0 h-[0.14em] w-full overflow-visible text-graphite">
                        <motion.path
                          d="M2 9 C 60 3, 120 12, 180 6 S 270 4, 298 8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                          initial={{ pathLength: 0 }}
                          animate={started ? { pathLength: 1 } : undefined}
                          transition={{ duration: 1.1, delay: 0.8, ease: EASE }}
                        />
                      </svg>
                    </span>
                  ) : (
                    line
                  )}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p {...show(0.45)} className="mt-6 max-w-xl text-base leading-relaxed text-charcoal sm:text-lg lg:[@media(max-height:700px)]:mt-4 lg:[@media(max-height:700px)]:text-base">
            Full-day, hands-on Robotics, AI &amp; ML workshops on your campus — every student builds, codes and tests something real. And as the
            first school workshop company with its own film studio, we hand your school reels, a full-day film and drone shots —{" "}
            <strong className="font-semibold text-graphite">free</strong>.
          </motion.p>

          <motion.div {...show(0.55)} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center lg:[@media(max-height:700px)]:mt-6">
            <Button href="/contact" size="lg" arrow>
              Book a JOVE Day
            </Button>
            <Button href="/labs" size="lg" variant="secondary">
              Try a free Virtual Lab
            </Button>
          </motion.div>

          <motion.div {...show(0.7)} className="mt-10 flex items-center gap-8 text-blueprint lg:[@media(max-height:919px)]:hidden">
            <AnnotationStack items={["Precision", "Learning", "Innovation", "Automation"]} />
            <p className="hidden max-w-[15rem] font-mono text-[11px] leading-relaxed tracking-wide text-blueprint sm:block">
              CBSE · ICSE · State boards
              <br />
              NEP 2020 aligned · ATL-ready
              <br />
              Offline-first, Grades 1–10
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* 3D arm / pencil film */}
      <HeroVisual
        started={started}
        progress={scrollYProgress}
        className="relative mx-auto h-[min(64vw,440px)] min-h-[280px] w-full max-w-[720px] md:h-[52svh] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:max-w-none lg:w-[56%]"
      />

      {/* pillars strip */}
      <div className="relative z-10 border-t border-graphite/15 bg-paper/75 backdrop-blur-[3px] lg:absolute lg:inset-x-0 lg:bottom-0">
        <div className="container-bp flex items-stretch">
          <ul className="grid flex-1 grid-cols-2 lg:grid-cols-4">
            {PILLARS.map(({ icon: Icon, label }, i) => (
              <motion.li
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={started ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.8, delay: 0.85 + i * 0.07, ease: EASE }}
                className={`flex items-center gap-3 py-4 pr-3 sm:py-5 ${i % 2 === 1 ? "border-l border-graphite/10 pl-4 sm:pl-6" : ""} ${i > 1 ? "border-t border-graphite/10 lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-6" : ""}`}
              >
                <span className="relative grid size-10 shrink-0 place-items-center border border-graphite/20 bg-paper text-graphite">
                  <Icon className="size-[18px]" strokeWidth={1.4} aria-hidden />
                  <span className="absolute -right-1 -top-1 size-2 border-r border-t border-graphite/50" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[10px] tracking-[0.15em] text-blueprint">0{i + 1}</span>
                  <span className="block text-[13px] font-semibold leading-tight text-graphite sm:text-sm">{label}</span>
                </span>
              </motion.li>
            ))}
          </ul>
          <a
            href="#jove-manifesto"
            className="group hidden shrink-0 items-center gap-3 border-l border-graphite/10 pl-6 text-blueprint transition-colors hover:text-graphite lg:flex"
            aria-label="Scroll to the next section"
          >
            <span className="annot">Scroll</span>
            <span className="relative block h-10 w-px overflow-hidden bg-graphite/15">
              <span className="absolute inset-x-0 top-0 h-4 bg-graphite motion-safe:animate-[jove-scroll-cue_1.8s_ease-in-out_infinite]" />
            </span>
            <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" aria-hidden />
          </a>
        </div>
      </div>
      <style>{`@keyframes jove-scroll-cue{0%{transform:translateY(-100%)}60%,100%{transform:translateY(260%)}}`}</style>
    </section>
  );
}
