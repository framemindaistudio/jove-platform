"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/components/site/studio/LazyVideo";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * VISION ∪ INNOVATION → VISIONATION.
 * Two construction circles slide together; the overlap fills with pencil hatching.
 */
export function VisionationDiagram({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const reduced = usePrefersReducedMotion();
  const vp = { once: true, margin: "-80px" } as const;
  const slide = (dx: number) =>
    reduced
      ? {}
      : {
          initial: { x: dx, opacity: 0 },
          whileInView: { x: 0, opacity: 1 },
          viewport: vp,
          transition: { duration: 1.4, ease: EASE },
        };

  return (
    <figure className={className}>
      <svg viewBox="0 0 400 290" className="h-auto w-full text-paper" fill="none" stroke="currentColor" role="img" aria-labelledby={`${id}-t ${id}-d`}>
        <title id={`${id}-t`}>Vision plus Innovation equals Visionation</title>
        <desc id={`${id}-d`}>Two overlapping circles labelled Vision (seeing what could be) and Innovation (making it real). Their hatched overlap is labelled Visionation.</desc>
        <defs>
          <pattern id={`${id}-hatch`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" strokeWidth="0.9" opacity="0.55" />
          </pattern>
          <clipPath id={`${id}-clip`}>
            <circle cx="150" cy="130" r="95" />
          </clipPath>
        </defs>

        {/* construction axis */}
        <path d="M10 130h380" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.35" />
        <path d="M200 20v220" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.35" />

        <motion.g {...slide(-46)}>
          <circle cx="150" cy="130" r="95" strokeWidth="1.1" />
          <circle cx="150" cy="130" r="88" strokeWidth="0.5" strokeDasharray="1.5 3" opacity="0.5" />
          <text x="104" y="124" textAnchor="middle" fill="currentColor" stroke="none" fontSize="15" fontWeight="700" letterSpacing="2">
            VISION
          </text>
          <text x="104" y="142" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8.5" opacity="0.6" className="font-mono">
            seeing what could be
          </text>
        </motion.g>

        <motion.g {...slide(46)}>
          <circle cx="250" cy="130" r="95" strokeWidth="1.1" />
          <circle cx="250" cy="130" r="88" strokeWidth="0.5" strokeDasharray="1.5 3" opacity="0.5" />
          <text x="302" y="124" textAnchor="middle" fill="currentColor" stroke="none" fontSize="15" fontWeight="700" letterSpacing="2">
            INNOVATION
          </text>
          <text x="302" y="142" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8.5" opacity="0.6" className="font-mono">
            making it real
          </text>
        </motion.g>

        <motion.g
          initial={reduced ? undefined : { opacity: 0 }}
          whileInView={reduced ? undefined : { opacity: 1 }}
          viewport={vp}
          transition={{ duration: 0.9, delay: 1.1, ease: EASE }}
        >
          <circle cx="250" cy="130" r="95" fill={`url(#${id}-hatch)`} stroke="none" clipPath={`url(#${id}-clip)`} />
          <path d="M200 212v26" strokeWidth="0.8" />
          <circle cx="200" cy="212" r="2.2" fill="currentColor" stroke="none" />
          <text x="200" y="258" textAnchor="middle" fill="currentColor" stroke="none" fontSize="17" fontWeight="700" letterSpacing="3.5">
            VISIONATION
          </text>
          <text x="200" y="276" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8.5" opacity="0.6" className="font-mono">
            where imagining becomes building
          </text>
        </motion.g>
      </svg>
    </figure>
  );
}
