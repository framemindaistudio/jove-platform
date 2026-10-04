"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";
import { useHydrated, useInView, useMediaQuery, useWebGL } from "./hooks";
import { LazyVideo } from "./LazyVideo";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), { ssr: false, loading: () => null });

/**
 * The hero's right-hand visual:
 *  ≥768px + WebGL + motion allowed → live React Three Fiber arm (fades in over the pencil poster)
 *  otherwise → the looping pencil-arm film, multiplied onto the paper.
 * Media sits directly in the hero's isolated stacking context so `mix-blend-multiply` reaches the grid.
 */
export function HeroVisual({ started, progress, className }: { started: boolean; progress: MotionValue<number>; className?: string }) {
  const hydrated = useHydrated();
  const wide = useMediaQuery("(min-width: 768px)");
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const webgl = useWebGL();
  const mode: "poster" | "canvas" | "video" = !hydrated ? "poster" : wide && !reduce && webgl ? "canvas" : "video";
  const [ready, setReady] = useState(false);
  // true when the scene became ready while the preloader still covered the page → swap without a visible cross-fade
  const [instant, setInstant] = useState(false);
  // the still sits under the film until the film is really playing — then it would only ghost the moving parts
  const [filmPlaying, setFilmPlaying] = useState(false);
  const [ref, inView] = useInView<HTMLDivElement>("80px 0px", true);

  // Ask the preloader to keep the page covered until the 3D scene has drawn (it gives up after a bounded wait).
  useEffect(() => {
    if (mode !== "canvas" || ready) return;
    const html = document.documentElement;
    if (!html.classList.contains("jove-preloading")) return;
    html.dataset.joveHold = "hero";
    return () => {
      delete html.dataset.joveHold;
    };
  }, [mode, ready]);

  const onSceneReady = () => {
    performance.mark?.("jove:hero-ready");
    setInstant(document.documentElement.classList.contains("jove-preloading"));
    setReady(true);
  };
  const canvasY = useTransform(progress, [0, 1], [0, 140]);
  const live = mode === "canvas" && ready;

  return (
    <div ref={ref} className={cn("pointer-events-none", className)}>
      {/* pencil poster — visible until the 3D scene has drawn its first frames */}
      <Image
        src="/images/hero/hero-arm-3d.webp"
        alt=""
        fill
        loading="eager"
        fetchPriority="high"
        quality={85}
        sizes="(min-width: 1024px) 60vw, 100vw"
        className={cn(
          "object-cover object-[78%_50%] mix-blend-multiply transition-opacity duration-[1400ms] ease-[var(--ease-out-expo)] [mask-image:radial-gradient(ellipse_74%_70%_at_56%_52%,#000_52%,transparent_100%)] lg:[mask-image:linear-gradient(to_right,transparent,#000_42%)] lg:object-[85%_50%]",
          (live || (mode === "video" && filmPlaying)) && "opacity-0",
          instant && "duration-0",
        )}
      />

      {mode === "video" && (
        <LazyVideo
          src="/videos/hero-arm-3d.mp4"
          srcSm="/videos/hero-arm-3d-sm.mp4"
          poster="/videos/hero-arm-3d-poster.webp"
          className="absolute inset-0 h-full w-full object-cover object-[78%_50%] mix-blend-multiply [mask-image:radial-gradient(ellipse_74%_70%_at_56%_52%,#000_52%,transparent_100%)] lg:[mask-image:linear-gradient(to_right,transparent,#000_42%)] lg:object-[85%_50%]"
          rootMargin="0px"
          onPlaying={() => setFilmPlaying(true)}
        />
      )}

      {mode === "canvas" && (
        <motion.div
          style={{ y: canvasY }}
          className={cn(
            "absolute inset-0 transition-opacity duration-[1400ms] ease-[var(--ease-out-expo)]",
            ready ? "opacity-100" : "opacity-0",
            instant && "duration-0",
          )}
        >
          <HeroScene
            active={inView}
            started={started}
            progress={progress}
            onReady={onSceneReady}
            canvasClassName="[mask-image:radial-gradient(ellipse_80%_78%_at_52%_50%,#000_62%,transparent_100%)]"
          />
        </motion.div>
      )}

      {/* engineering title block */}
      <div className="absolute bottom-6 right-4 hidden border border-graphite/25 bg-paper/80 font-mono text-[10px] uppercase tracking-[0.14em] text-charcoal shadow-[var(--shadow-paper)] backdrop-blur-[2px] md:block lg:bottom-28 lg:left-6 lg:right-auto xl:left-10">
        <div className="grid grid-cols-[auto_auto] divide-x divide-graphite/20">
          <span className="px-3 py-1.5">Fig. 01 · 6-axis arm</span>
          <span className="px-3 py-1.5">J1–J6</span>
        </div>
        <div className="grid grid-cols-[auto_auto] divide-x divide-graphite/20 border-t border-graphite/20">
          <span className="px-3 py-1.5">{live ? "3D sketch study" : "Pencil study"}</span>
          <span className="flex items-center gap-1.5 px-3 py-1.5">
            <span className={cn("size-1.5 rounded-full", live ? "bg-graphite motion-safe:animate-pulse" : "bg-graphite/30")} />
            {live ? "Live" : "Sketch"}
          </span>
        </div>
      </div>
    </div>
  );
}
