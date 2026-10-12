"use client";

import { ConceptCard, KeyIdea, StageHeader } from "@/components/labs/framework/LabJourney";
import { BLOCK_META } from "./Blocks";
import { INK, PAPER, RoverSprite } from "./Board";
import type { BlockKind } from "./engine";

const GREY = "#7A7A7A";
const MONO = "var(--font-mono-jb), monospace";
const SANS = "var(--font-montserrat), sans-serif";

function Hatch({ id }: { id: string }) {
  return (
    <pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
      <line x1="0" y1="0" x2="0" y2="5" stroke={INK} strokeWidth="1" strokeOpacity="0.45" />
    </pattern>
  );
}

/** Mini grid with a rover path, used by several figures. */
function MiniGrid({ x, y, n = 3, s = 30, path, rover, rock, flag, hatch, dashed }: { x: number; y: number; n?: number; s?: number; path?: [number, number][]; rover?: [number, number, number]; rock?: [number, number]; flag?: [number, number]; hatch: string; dashed?: [number, number][] }) {
  const c = (i: number) => i * s + s / 2;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={n * s} height={n * s} fill={PAPER} stroke={INK} strokeOpacity={0.5} rx={3} />
      {Array.from({ length: n - 1 }, (_, i) => (
        <g key={i} stroke={INK} strokeOpacity={0.14} strokeDasharray="2 3">
          <line x1={(i + 1) * s} y1={0} x2={(i + 1) * s} y2={n * s} />
          <line x1={0} y1={(i + 1) * s} x2={n * s} y2={(i + 1) * s} />
        </g>
      ))}
      {rock && <circle cx={c(rock[0])} cy={c(rock[1])} r={s * 0.32} fill={`url(#${hatch})`} stroke={INK} strokeWidth={1.3} />}
      {flag && (
        <g transform={`translate(${c(flag[0]) - 4} ${c(flag[1]) + 10})`} stroke={INK} strokeWidth={1.4} strokeLinejoin="round">
          <path d="M0 0 V-20" />
          <path d="M0 -20 L12 -16 L0 -12 Z" fill={INK} />
        </g>
      )}
      {path && <polyline points={path.map(([px, py]) => `${c(px)},${c(py)}`).join(" ")} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 5" />}
      {dashed && <polyline points={dashed.map(([px, py]) => `${c(px)},${c(py)}`).join(" ")} fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 4" />}
      {rover && (
        <g transform={`translate(${c(rover[0])} ${c(rover[1])}) rotate(${rover[2]}) scale(${s / 64})`}>
          <RoverSprite hatchId={hatch} />
        </g>
      )}
    </g>
  );
}

function FigAlgorithm() {
  const steps = ["Boil water", "Add tea leaves", "Add milk & sugar", "Strain & serve"];
  return (
    <svg viewBox="0 0 340 150" className="h-auto w-full" role="img" aria-label="An algorithm for making chai: boil water, add tea leaves, add milk and sugar, strain and serve.">
      <text x="8" y="16" fontFamily={MONO} fontSize="9" fill={GREY} letterSpacing="1.5">
        ALGORITHM: MAKE CHAI
      </text>
      {steps.map((t, i) => {
        const x = 8 + (i % 2) * 168;
        const y = 30 + Math.floor(i / 2) * 60;
        return (
          <g key={t}>
            <rect x={x} y={y} width={154} height={42} rx={8} fill={PAPER} stroke={INK} strokeWidth={1.4} />
            <circle cx={x + 20} cy={y + 21} r={11} fill={INK} />
            <text x={x + 20} y={y + 25} textAnchor="middle" fontFamily={MONO} fontSize="11" fontWeight="700" fill={PAPER}>
              {i + 1}
            </text>
            <text x={x + 38} y={y + 25} fontFamily={SANS} fontSize="11.5" fontWeight="600" fill={INK}>
              {t}
            </text>
          </g>
        );
      })}
      <g stroke={INK} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M162 51 H174" />
        <path d="M170 47 L175 51 L170 55" />
        <path d="M330 72 V80 Q330 86 324 86 H24 Q18 86 18 92 V96" strokeDasharray="3 3" />
        <path d="M14 93 L18 98 L22 93" />
        <path d="M162 111 H174" />
        <path d="M170 107 L175 111 L170 115" />
      </g>
    </svg>
  );
}

function FigSequence() {
  return (
    <svg viewBox="0 0 340 150" className="h-auto w-full" role="img" aria-label="Same blocks in a different order: Forward then Turn Right ends in one place; Turn Right then Forward ends somewhere else.">
      <defs>
        <Hatch id="th-seq" />
      </defs>
      {[
        { x: 20, label: "FORWARD → TURN RIGHT", path: [[1, 2], [1, 1]] as [number, number][], rover: [1, 1, 90] as [number, number, number] },
        { x: 190, label: "TURN RIGHT → FORWARD", path: [[1, 2], [2, 2]] as [number, number][], rover: [2, 2, 90] as [number, number, number] },
      ].map((g) => (
        <g key={g.x}>
          <text x={g.x} y="14" fontFamily={MONO} fontSize="8.5" fill={GREY} letterSpacing="1">
            {g.label}
          </text>
          <MiniGrid x={g.x} y={24} hatch="th-seq" path={g.path} rover={g.rover} />
          <circle cx={g.x + 45} cy={24 + 75} r={9} fill="none" stroke={INK} strokeOpacity={0.35} strokeDasharray="2 3" />
        </g>
      ))}
      <text x="170" y="145" textAnchor="middle" fontFamily={SANS} fontSize="10.5" fontWeight="600" fill={INK}>
        Same blocks · different order · different place
      </text>
    </svg>
  );
}

function FigDebug() {
  return (
    <svg viewBox="0 0 340 150" className="h-auto w-full" role="img" aria-label="A buggy path crashes into a rock; the fixed path goes around it to the flag.">
      <defs>
        <Hatch id="th-dbg" />
      </defs>
      <text x="20" y="14" fontFamily={MONO} fontSize="8.5" fill={GREY} letterSpacing="1">
        BUG: CRASH!
      </text>
      <MiniGrid x={20} y={24} hatch="th-dbg" rock={[1, 1]} flag={[2, 0]} path={[[1, 2], [1, 1.45]]} rover={[1, 1.75, 0]} />
      <g transform="translate(65 66)">
        <path d="M0 -10 L3 -4 L10 -6 L5 0 L10 6 L3 4 L0 10 L-3 4 L-10 6 L-5 0 L-10 -6 L-3 -4 Z" fill={PAPER} stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
        <text y="3.5" textAnchor="middle" fontSize="10" fontWeight="800" fill={INK}>
          !
        </text>
      </g>
      <g stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round">
        <path d="M134 70 H178" />
        <path d="M172 64 L179 70 L172 76" />
      </g>
      <text x="157" y="60" textAnchor="middle" fontFamily={MONO} fontSize="8" fill={GREY}>
        FIX
      </text>
      <text x="190" y="14" fontFamily={MONO} fontSize="8.5" fill={GREY} letterSpacing="1">
        DEBUGGED ✓
      </text>
      <MiniGrid x={190} y={24} hatch="th-dbg" rock={[1, 1]} flag={[2, 0]} dashed={[[1, 2], [2, 2], [2, 0]]} rover={[2, 0.05, 0]} />
      <text x="170" y="145" textAnchor="middle" fontFamily={SANS} fontSize="10.5" fontWeight="600" fill={INK}>
        Find the wrong block → fix it → run again
      </text>
    </svg>
  );
}

function FigLoop() {
  return (
    <svg viewBox="0 0 340 150" className="h-auto w-full" role="img" aria-label="Repeat 4 times Forward is the same as four Forward blocks.">
      <g transform="translate(14 22)">
        <rect width="128" height="26" rx="6" fill={INK} />
        <text x="12" y="17" fontFamily={SANS} fontSize="11" fontWeight="700" fill={PAPER}>
          Repeat 4 times
        </text>
        <rect y="26" width="9" height="40" fill={INK} />
        <rect x="18" y="33" width="100" height="26" rx="6" fill={PAPER} stroke={INK} strokeWidth={1.6} />
        <text x="30" y="50" fontFamily={SANS} fontSize="11" fontWeight="700" fill={INK}>
          ↑ Forward
        </text>
        <rect y="66" width="60" height="9" rx="2" fill={INK} />
        <text x="0" y="98" fontFamily={MONO} fontSize="8.5" fill={GREY} letterSpacing="1">
          2 BLOCKS
        </text>
      </g>
      <text x="170" y="76" textAnchor="middle" fontFamily={SANS} fontSize="22" fontWeight="700" fill={INK}>
        =
      </text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(198 ${14 + i * 28})`}>
          <rect width="112" height="22" rx="6" fill={PAPER} stroke={INK} strokeWidth={1.4} />
          <text x="12" y="15" fontFamily={SANS} fontSize="10.5" fontWeight="700" fill={INK}>
            ↑ Forward
          </text>
        </g>
      ))}
      <text x="198" y="140" fontFamily={MONO} fontSize="8.5" fill={GREY} letterSpacing="1">
        4 BLOCKS
      </text>
      <path d="M318 16 Q328 16 328 26 V112 Q328 122 318 122" fill="none" stroke={INK} strokeOpacity={0.4} />
    </svg>
  );
}

function FigTurn() {
  return (
    <svg viewBox="0 0 340 120" className="h-auto w-full" role="img" aria-label="Turn Left and Turn Right spin the rover on the same square; Forward moves it one square.">
      <defs>
        <Hatch id="th-turn" />
      </defs>
      {[
        { x: 60, label: "TURN LEFT", rot: -90, arc: "M-24 -10 A26 26 0 0 0 -10 -24" },
        { x: 170, label: "FORWARD", rot: 0, arc: "" },
        { x: 280, label: "TURN RIGHT", rot: 90, arc: "M24 -10 A26 26 0 0 1 10 -24" },
      ].map((g) => (
        <g key={g.label} transform={`translate(${g.x} 58)`}>
          <rect x={-34} y={-34} width={68} height={68} rx={4} fill={PAPER} stroke={INK} strokeOpacity={0.4} strokeDasharray="3 3" />
          {g.label === "FORWARD" && (
            <>
              <path d="M0 -36 V-52 M-5 -46 L0 -53 L5 -46" stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          <g transform={`rotate(${g.rot}) scale(0.9)`}>
            <RoverSprite hatchId="th-turn" />
          </g>
          {g.arc && (
            <g stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round">
              <path d={g.arc} />
            </g>
          )}
          <text y={52} textAnchor="middle" fontFamily={MONO} fontSize="9" fill={GREY} letterSpacing="1.2">
            {g.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function RoverTheory() {
  const kinds: BlockKind[] = ["forward", "left", "right", "repeat"];
  return (
    <div>
      <StageHeader
        index="01"
        kicker="Theory"
        title="How do you tell a robot what to do?"
        intro="Robots can't guess. They follow instructions — exactly, one at a time, in order. A list of instructions like that has a special name. Let's learn it, then use it to drive a rover across Mars!"
      />
      <div className="grid gap-5 md:grid-cols-2">
        <ConceptCard n={1} title="An algorithm is a recipe" figure={<FigAlgorithm />}>
          An <strong>algorithm</strong> is a list of steps, in order, that solves a problem. Making chai, getting ready for school, and driving a rover are all algorithms. When we write an algorithm for a computer, we call it a <strong>program</strong>.
        </ConceptCard>
        <ConceptCard n={2} title="Sequence: order matters" figure={<FigSequence />}>
          The rover runs your blocks from <strong>top to bottom</strong>. Swap two blocks and the rover ends up somewhere completely different — just like putting the milk in before boiling the water!
        </ConceptCard>
        <ConceptCard n={3} title="Debugging: find it, fix it" figure={<FigDebug />}>
          A mistake in a program is called a <strong>bug</strong>. Finding and fixing it is <strong>debugging</strong>. Real engineers debug every single day — a crash isn&apos;t a failure, it&apos;s a clue. Use <strong>Step</strong> to watch one block at a time.
        </ConceptCard>
        <ConceptCard n={4} title="Loops: say it once, do it many times" figure={<FigLoop />}>
          A <strong>loop</strong> repeats blocks for you. Instead of four Forward blocks, put one Forward inside <strong>Repeat 4</strong>. Shorter programs are easier to read and fix — and they earn more stars here.
        </ConceptCard>
      </div>

      <KeyIdea>A computer does exactly what you tell it — not what you meant. Good programmers think step by step.</KeyIdea>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-6 lg:col-span-3">
          <p className="annot text-blueprint">Meet your blocks</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {kinds.map((k) => {
              const { label, Icon } = BLOCK_META[k];
              const text = {
                forward: "Drives one square in the direction the rover is facing.",
                left: "Spins a quarter-turn to the left. The rover stays on the same square.",
                right: "Spins a quarter-turn to the right. The rover stays on the same square.",
                repeat: "Runs the blocks inside it again and again — 2 to 9 times.",
              }[k];
              return (
                <li key={k} className="flex gap-3">
                  <span className={k === "repeat" ? "grid size-10 shrink-0 place-items-center rounded-[10px] border-2 border-graphite bg-graphite text-paper" : "grid size-10 shrink-0 place-items-center rounded-[10px] border-2 border-graphite bg-paper"}>
                    <Icon className="size-5" strokeWidth={2.4} aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{label}</span>
                    <span className="block text-xs leading-relaxed text-charcoal">{text}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper p-5 lg:col-span-2">
          <p className="annot text-blueprint">Turning vs moving</p>
          <div className="mt-3 bp-grid-fine rounded-[var(--radius-sm)] border border-graphite/10 p-2">
            <FigTurn />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-charcoal">Tip for little coders: turn your own body to face the same way as the rover. Your left hand is the rover&apos;s left!</p>
        </div>
      </div>
    </div>
  );
}
