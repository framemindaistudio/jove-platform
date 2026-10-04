"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { usePrefersReducedMotion } from "@/components/site/studio/LazyVideo";

export interface LoopNode {
  n: string;
  mode: string;
  title: string;
  line: string;
  href: string;
}

const C = 280;
const R = 190;
const rad = (d: number) => (d * Math.PI) / 180;
const pt = (r: number, d: number) => [C + r * Math.cos(rad(d)), C + r * Math.sin(rad(d))] as const;
const f = (n: number) => Number(n.toFixed(2));

/** Node anchor positions (percent of the square) for top, right, bottom, left. */
const ANCHORS = [-90, 0, 90, 180].map((d) => {
  const [x, y] = pt(R, d);
  return { left: `${(x / 560) * 100}%`, top: `${(y / 560) * 100}%` };
});

function arcPath(d0: number, d1: number) {
  const [x0, y0] = pt(R, d0);
  const [x1, y1] = pt(R, d1);
  return `M${f(x0)} ${f(y0)}A${R} ${R} 0 0 1 ${f(x1)} ${f(y1)}`;
}

function arrowHead(d: number) {
  const tip = pt(R, d);
  const a = pt(R - 7, d - 3.2);
  const b = pt(R + 7, d - 3.2);
  return `M${f(a[0])} ${f(a[1])}L${f(tip[0])} ${f(tip[1])}L${f(b[0])} ${f(b[1])}`;
}

/**
 * The JOVE model as a loop: JOVE Day (offline) → Media Pack (studio) → Virtual Labs (online) → Kit Store → next JOVE Day.
 * md+: circular blueprint diagram. Mobile: an ordered vertical flow with the same content.
 */
export function ModelLoop({ nodes, className }: { nodes: LoopNode[]; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const d = i * 5;
    const long = i % 6 === 0;
    const [x0, y0] = pt(R + 22, d);
    const [x1, y1] = pt(R + (long ? 32 : 27), d);
    return `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;
  }).join("");

  return (
    <div className={className}>
      {/* ── diagram (md+) ── */}
      <div className="relative mx-auto hidden aspect-square w-full max-w-[600px] md:block">
        <svg viewBox="0 0 560 560" className="absolute inset-0 size-full text-paper" fill="none" stroke="currentColor" aria-hidden>
          <circle cx={C} cy={C} r={R + 22} strokeWidth="0.6" opacity="0.25" />
          <path d={ticks} strokeWidth="0.8" opacity="0.3" />
          <circle cx={C} cy={C} r="128" strokeWidth="0.6" strokeDasharray="2 5" opacity="0.3" />
          <path d={`M${C} 30v500M30 ${C}h500`} strokeWidth="0.5" strokeDasharray="2 6" opacity="0.22" />
          <path d="M146 146l268 268M414 146L146 414" strokeWidth="0.5" strokeDasharray="1 6" opacity="0.18" />

          {[-90, 0, 90, 180].map((d, i) => (
            <g key={d}>
              <motion.path
                d={arcPath(d + 24, d + 90 - 24)}
                strokeWidth="1.4"
                initial={reduced ? undefined : { pathLength: 0 }}
                whileInView={reduced ? undefined : { pathLength: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.9, delay: 0.25 + i * 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.path
                d={arrowHead(d + 90 - 24)}
                strokeWidth="1.4"
                strokeLinejoin="round"
                initial={reduced ? undefined : { opacity: 0 }}
                whileInView={reduced ? undefined : { opacity: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.3, delay: 1 + i * 0.35 }}
              />
            </g>
          ))}

          {/* travelling signal */}
          <g className="animate-spin-slow" style={{ transformOrigin: `${C}px ${C}px` }}>
            <circle cx={C} cy={C - R} r="4.5" fill="currentColor" stroke="none" />
            <circle cx={C} cy={C - R} r="10" strokeWidth="0.8" opacity="0.5" />
          </g>

          <circle cx={C} cy={C} r="86" className="fill-ink" stroke="none" />
          <circle cx={C} cy={C} r="86" strokeWidth="1" opacity="0.4" />
          <circle cx={C} cy={C} r="94" strokeWidth="0.5" strokeDasharray="1.5 3" opacity="0.4" />
        </svg>

        <div className="absolute left-1/2 top-1/2 w-[17%] -translate-x-1/2 -translate-y-[54%]">
          <Image src="/brand/jove-mark-white.png" alt="" width={1024} height={1178} sizes="110px" className="h-auto w-full" />
        </div>
        <p className="annot absolute left-1/2 top-[58.5%] -translate-x-1/2 whitespace-nowrap text-[9px] text-paper/45">The JOVE loop</p>

        {nodes.slice(0, 4).map((node, i) => (
          <div key={node.n} className="absolute w-[38%] max-w-[210px] -translate-x-1/2 -translate-y-1/2" style={ANCHORS[i]}>
            <Link
              href={node.href}
              className="group block rounded-[var(--radius-md)] border border-paper/20 bg-graphite/95 px-4 py-3.5 shadow-[0_20px_40px_-20px_rgb(0_0_0/0.6)] backdrop-blur-sm transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-paper/50"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] tracking-[0.15em] text-paper/45">{node.n}</span>
                <span className="annot text-[9px] text-paper/55">{node.mode}</span>
              </span>
              <span className="mt-1.5 flex items-center gap-1.5 text-[15px] font-bold leading-tight text-paper">
                {node.title}
                <ArrowUpRight className="size-3.5 opacity-40 transition-opacity group-hover:opacity-100" aria-hidden />
              </span>
              <span className="mt-1 block text-[12px] leading-snug text-paper/60">{node.line}</span>
            </Link>
          </div>
        ))}
      </div>

      {/* ── flow (mobile) ── */}
      <ol className="relative space-y-3 before:absolute before:bottom-6 before:left-[19px] before:top-6 before:w-px before:bg-paper/20 before:content-[''] md:hidden">
        {nodes.map((node) => (
          <li key={node.n} className="relative flex gap-4">
            <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full border border-paper/30 bg-ink font-mono text-xs text-paper/80">{node.n}</span>
            <Link href={node.href} className="flex-1 rounded-[var(--radius-md)] border border-paper/15 bg-paper/[0.04] px-4 py-3">
              <span className="annot block text-[9px] text-paper/50">{node.mode}</span>
              <span className="mt-0.5 block font-bold text-paper">{node.title}</span>
              <span className="mt-0.5 block text-sm leading-snug text-paper/60">{node.line}</span>
            </Link>
          </li>
        ))}
        <li className="flex gap-4 pl-[3px]">
          <span aria-hidden className="relative z-10 grid size-[34px] shrink-0 place-items-center rounded-full bg-paper text-graphite">↻</span>
          <p className="self-center text-sm text-paper/60">…and back to the next JOVE Day — one level up.</p>
        </li>
      </ol>
    </div>
  );
}
