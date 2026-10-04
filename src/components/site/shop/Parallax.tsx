"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Clips its children and drifts them vertically while the frame scrolls through the viewport.
 * The inner layer is `travel` px taller on each side so edges never show. Static when reduced motion is on.
 */
export function Parallax({ children, className, travel = 40 }: { children: React.ReactNode; className?: string; travel?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-travel, travel]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div className="absolute inset-x-0 will-change-transform" style={{ top: -travel, bottom: -travel, y: reduce ? 0 : y }}>
        {children}
      </motion.div>
    </div>
  );
}
