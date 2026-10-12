"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { CornerMarks } from "@/components/brand/Blueprint";
import { cn } from "@/lib/utils";

/**
 * A framed drawing plate (paper card, corner marks, figure caption) whose sketch drifts
 * slightly against the scroll for depth. Static for reduced-motion users (CSS override, no hydration diff).
 */
export function ParallaxPlate({
  src,
  alt,
  width,
  height,
  figure,
  caption,
  sizes,
  className,
  preload,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  figure: string;
  caption: string;
  sizes: string;
  className?: string;
  preload?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  return (
    <figure className={cn("relative", className)}>
      <div
        ref={ref}
        className="relative overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-lift)]"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <div aria-hidden className="bp-grid-fine absolute inset-0 opacity-70" />
        <motion.div className="absolute -inset-y-[6%] inset-x-0 motion-reduce:transform-none!" style={{ y }}>
          <Image src={src} alt={alt} fill sizes={sizes} quality={85} preload={preload} className="object-cover mix-blend-multiply" />
        </motion.div>
        <div aria-hidden className="paper-grain pointer-events-none absolute inset-0 opacity-50 mix-blend-multiply" />
        <CornerMarks className="m-3 text-graphite/45" size={14} />
        <span aria-hidden className="annot absolute left-4 top-4 rounded-[var(--radius-sm)] bg-paper/85 px-2 py-1 font-mono text-[10px] text-charcoal backdrop-blur-sm">
          {figure}
        </span>
      </div>
      <figcaption className="mt-3 flex items-start justify-between gap-4">
        <span className="annot text-blueprint">{caption}</span>
        <span className="annot shrink-0 text-blueprint/70">Illustrative sketch</span>
      </figcaption>
    </figure>
  );
}
