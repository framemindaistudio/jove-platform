"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { key, type Level, type Sim } from "./engine";

export const INK = "#2B2B2B";
export const PAPER = "#FBF9F4";
const C = 64; // cell size (svg units)
const M = 26; // outer margin for coordinates

/** Cute top-down sketch rover, drawn facing North and centred on (0,0). */
export function RoverSprite({ hatchId, happy }: { hatchId: string; happy?: boolean }) {
  return (
    <g stroke={INK} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round">
      {/* wheels */}
      {[-13, 0, 13].map((y) => (
        <g key={y}>
          <rect x={-23} y={y - 5} width={8} height={10} rx={2.5} fill={INK} />
          <rect x={15} y={y - 5} width={8} height={10} rx={2.5} fill={INK} />
          <path d={`M-15 ${y}h3M15 ${y}h-3`} />
        </g>
      ))}
      {/* body + solar panel */}
      <rect x={-12} y={-16} width={24} height={33} rx={6} fill={PAPER} />
      <rect x={-8.5} y={-1} width={17} height={14} rx={2} fill={`url(#${hatchId})`} />
      <path d="M-8.5 6h17M0 -1v14" strokeWidth={0.8} />
      {/* antenna */}
      <path d="M8 -9 L15 -25" strokeWidth={1.3} />
      <circle cx={15.5} cy={-26.5} r={2.4} fill={PAPER} />
      {/* head with two big eyes */}
      <rect x={-10} y={-25} width={20} height={12} rx={5} fill={PAPER} />
      <circle cx={-4.2} cy={-19.5} r={3} fill={INK} stroke="none" />
      <circle cx={4.2} cy={-19.5} r={3} fill={INK} stroke="none" />
      <circle cx={-3.2} cy={-20.6} r={1} fill={PAPER} stroke="none" />
      <circle cx={5.2} cy={-20.6} r={1} fill={PAPER} stroke="none" />
      {happy ? <path d="M-3.5 -15.6 Q0 -12.6 3.5 -15.6" strokeWidth={1.2} fill="none" /> : <path d="M-2.5 -15.2 Q0 -14 2.5 -15.2" strokeWidth={1.1} fill="none" />}
    </g>
  );
}

const ROCKS = [
  "M12 42 Q8 28 20 19 Q33 9 46 17 Q57 25 53 40 Q49 53 33 53 Q17 53 12 42Z",
  "M10 38 Q12 22 26 16 Q40 11 50 22 Q58 32 51 45 Q42 55 27 52 Q12 49 10 38Z",
  "M14 45 Q9 33 16 24 Q25 13 39 15 Q53 18 54 33 Q55 48 42 52 Q26 56 14 45Z",
];

export function Board({
  level,
  sim,
  duration = 400,
  className,
  label,
}: {
  level: Level;
  sim: Sim;
  /** animation time per move (ms) */
  duration?: number;
  className?: string;
  label?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const hatch = `rv-hatch-${uid}`;
  const hatchDense = `rv-hatchd-${uid}`;
  const reduce = useReducedMotion();
  const W = level.w * C + M * 2;
  const H = level.h * C + M * 2;
  const cx = (x: number) => M + x * C + C / 2;
  const cy = (y: number) => M + y * C + C / 2;
  const t = reduce ? 0 : duration;
  const success = sim.status === "success";
  const bump = sim.status === "crash" || sim.status === "edge";
  const remaining = level.gems.length - sim.collected.length;

  const desc = `${level.w} by ${level.h} grid. Rover at column ${String.fromCharCode(65 + sim.x)}, row ${sim.y + 1}, facing ${["North", "East", "South", "West"][sim.dir]}. Flag at column ${String.fromCharCode(65 + level.flag.x)}, row ${level.flag.y + 1}. ${remaining} of ${level.gems.length} gems left.`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={label ?? "Rover map"}>
      <desc>{desc}</desc>
      <defs>
        <pattern id={hatch} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={INK} strokeWidth="1" strokeOpacity="0.45" />
        </pattern>
        <pattern id={hatchDense} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke={INK} strokeWidth="1" strokeOpacity="0.55" />
        </pattern>
      </defs>

      {/* paper + cells */}
      <rect x={M} y={M} width={level.w * C} height={level.h * C} fill={PAPER} stroke={INK} strokeOpacity={0.55} strokeWidth={1.4} rx={4} />
      {Array.from({ length: level.w - 1 }, (_, i) => (
        <line key={`v${i}`} x1={M + (i + 1) * C} y1={M} x2={M + (i + 1) * C} y2={M + level.h * C} stroke={INK} strokeOpacity={0.14} strokeDasharray="3 4" />
      ))}
      {Array.from({ length: level.h - 1 }, (_, i) => (
        <line key={`h${i}`} x1={M} y1={M + (i + 1) * C} x2={M + level.w * C} y2={M + (i + 1) * C} stroke={INK} strokeOpacity={0.14} strokeDasharray="3 4" />
      ))}
      {/* coordinates */}
      {Array.from({ length: level.w }, (_, i) => (
        <text key={`cx${i}`} x={cx(i)} y={M - 9} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono-jb), monospace" fill="#7A7A7A">
          {String.fromCharCode(65 + i)}
        </text>
      ))}
      {Array.from({ length: level.h }, (_, i) => (
        <text key={`cy${i}`} x={M - 10} y={cy(i) + 4} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono-jb), monospace" fill="#7A7A7A">
          {i + 1}
        </text>
      ))}

      {/* start pad */}
      <circle cx={cx(level.start.x)} cy={cy(level.start.y)} r={24} fill="none" stroke={INK} strokeOpacity={0.3} strokeDasharray="2 4" />

      {/* rocks */}
      {[...level.rocks].map((k) => {
        const [x, y] = k.split(",").map(Number);
        return (
          <g key={k} transform={`translate(${M + x * C} ${M + y * C})`}>
            <path d={ROCKS[(x + y * 2) % 3]} fill={PAPER} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
            <path d={ROCKS[(x + y * 2) % 3]} fill={`url(#${hatchDense})`} />
            <path d="M24 26 l6 6 M38 36 l5 -4" stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
          </g>
        );
      })}

      {/* trail */}
      {sim.trail.length > 1 && (
        <polyline
          points={sim.trail.map((p) => `${cx(p.x)},${cy(p.y)}`).join(" ")}
          fill="none"
          stroke={INK}
          strokeOpacity={0.35}
          strokeWidth={2}
          strokeDasharray="1 6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* flag */}
      <g transform={`translate(${M + level.flag.x * C} ${M + level.flag.y * C})`}>
        <ellipse cx={24} cy={52} rx={12} ry={3.5} fill="none" stroke={INK} strokeOpacity={0.5} />
        <path d="M24 52 V11" stroke={INK} strokeWidth={2} strokeLinecap="round" />
        <path d="M24 12 L48 19 L24 27 Z" fill={success ? INK : `url(#${hatch})`} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" style={{ transition: `fill ${t}ms` }} />
        {success &&
          [0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <motion.line
              key={a}
              x1={32}
              y1={32}
              x2={32}
              y2={32}
              stroke={INK}
              strokeWidth={1.6}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0.6],
                x1: 32 + Math.cos((a * Math.PI) / 180) * 30,
                y1: 32 + Math.sin((a * Math.PI) / 180) * 30,
                x2: 32 + Math.cos((a * Math.PI) / 180) * 38,
                y2: 32 + Math.sin((a * Math.PI) / 180) * 38,
              }}
              transition={{ duration: reduce ? 0 : 0.6, ease: "easeOut" }}
            />
          ))}
      </g>

      {/* gems */}
      {level.gems.map((g) => {
        const got = sim.collected.includes(key(g.x, g.y));
        return (
          <g key={key(g.x, g.y)} transform={`translate(${M + g.x * C} ${M + g.y * C})`}>
            <g style={{ transformBox: "fill-box", transformOrigin: "center", transform: got ? "scale(1.5)" : "scale(1)", opacity: got ? 0 : 1, transition: `transform ${t}ms ease-out, opacity ${t}ms ease-out` }}>
              <path d="M32 17 L45 29 L32 47 L19 29 Z" fill={PAPER} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
              <path d="M19 29 H45 M25.5 23 L32 29 L38.5 23 M32 29 V47" stroke={INK} strokeWidth={1} strokeLinejoin="round" fill="none" />
              <path d="M32 29 L45 29 L32 47 Z" fill={`url(#${hatch})`} />
            </g>
          </g>
        );
      })}

      {/* bump marker */}
      {bump && sim.blocked && (
        <g transform={`translate(${(cx(sim.x) + cx(sim.blocked.x)) / 2} ${(cy(sim.y) + cy(sim.blocked.y)) / 2})`}>
          <motion.g key={sim.bumps} initial={{ scale: 0.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: reduce ? 0 : 0.3 }}>
            <path d="M0 -14 L4 -5 L13 -8 L7 0 L13 8 L4 5 L0 14 L-4 5 L-13 8 L-7 0 L-13 -8 L-4 -5 Z" fill={PAPER} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
            <text y={4.5} textAnchor="middle" fontSize="13" fontWeight="700" fill={INK}>
              !
            </text>
          </motion.g>
        </g>
      )}

      {/* rover */}
      <g style={{ transform: `translate(${cx(sim.x)}px, ${cy(sim.y)}px)`, transition: `transform ${t}ms cubic-bezier(0.45, 0, 0.25, 1)` }}>
        <g style={{ transform: `rotate(${sim.angle}deg)`, transition: `transform ${t}ms cubic-bezier(0.45, 0, 0.25, 1)` }}>
          <motion.g key={`b${sim.bumps}`} initial={{ y: 0 }} animate={bump && !reduce ? { y: [0, -9, 2, 0] } : { y: 0 }} transition={{ duration: 0.4 }}>
            <motion.g animate={success && !reduce ? { scale: [1, 1.18, 1] } : { scale: 1 }} transition={{ duration: 0.5, repeat: success ? 2 : 0 }}>
              <RoverSprite hatchId={hatch} happy={success} />
            </motion.g>
          </motion.g>
        </g>
      </g>
    </svg>
  );
}
