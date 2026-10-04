"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { CornerMarks } from "@/components/brand/Blueprint";
import { usePrefersReducedMotion } from "@/components/site/studio/LazyVideo";
import { cn } from "@/lib/utils";

/**
 * Framed image that drifts gently against the scroll (parallax), with blueprint crop marks
 * and an annotation caption. Motion is disabled for prefers-reduced-motion.
 */
export function ParallaxFigure({
  src,
  alt,
  caption,
  fig,
  sizes,
  className,
  frameClassName,
  imageClassName,
  objectPosition = "50% 50%",
  strength = 8,
  priority,
  dark,
}: {
  src: string;
  alt: string;
  caption?: React.ReactNode;
  fig?: string;
  sizes: string;
  className?: string;
  /** Aspect ratio / sizing of the frame, e.g. "aspect-[16/9]". */
  frameClassName?: string;
  imageClassName?: string;
  objectPosition?: string;
  /** Max drift in % of frame height. */
  strength?: number;
  priority?: boolean;
  dark?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${strength}%`, `${strength}%`]);

  return (
    <figure className={cn("relative", className)}>
      <div className="relative">
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-[var(--radius-lg)] border shadow-[var(--shadow-lift)]",
          dark ? "border-paper/15 bg-ink" : "border-graphite/15 bg-paper-200",
          frameClassName,
        )}
      >
        <motion.div className="absolute inset-x-0 -inset-y-[10%]" style={reduced ? undefined : { y }}>
          <Image src={src} alt={alt} fill sizes={sizes} quality={85} priority={priority} className={cn("object-cover", imageClassName)} style={{ objectPosition }} />
        </motion.div>
        <div aria-hidden className="paper-grain pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply" />
      </div>
      <CornerMarks className={dark ? "text-paper/40" : undefined} inset={-7} size={12} />
      </div>
      {(caption || fig) && (
        <figcaption className={cn("mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1", dark ? "text-paper/55" : "text-blueprint")}>
          {fig && <span className="annot font-mono">{fig}</span>}
          {caption && <span className="text-xs leading-relaxed">{caption}</span>}
        </figcaption>
      )}
    </figure>
  );
}
