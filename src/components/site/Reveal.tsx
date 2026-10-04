"use client";

import { motion, type HTMLMotionProps } from "motion/react";

/** Fade/slide-in on scroll. Use for section content; stagger with `delay`. */
export function Reveal({ children, delay = 0, y = 28, className, as = "div", ...rest }: { children: React.ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "li" | "section" | "span" } & Omit<HTMLMotionProps<"div">, "children">) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

const lineVariants = { hidden: { y: "110%" }, show: { y: "0%" } };

/**
 * Line-by-line headline reveal (each line slides up from a mask).
 * The in-view trigger sits on the wrapper: the lines themselves start fully clipped
 * below their masks, so an observer on them would never fire.
 */
export function RevealLines({ lines, className, lineClassName, delay = 0 }: { lines: React.ReactNode[]; className?: string; lineClassName?: string; delay?: number }) {
  return (
    <motion.span className={`block ${className ?? ""}`} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <motion.span className={`block ${lineClassName ?? ""}`} variants={lineVariants} transition={{ duration: 1, delay: delay + i * 0.09, ease: [0.16, 1, 0.3, 1] }}>
            {line}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
