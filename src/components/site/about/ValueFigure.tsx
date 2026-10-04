import { cn } from "@/lib/utils";
import type { ValueKey } from "./values";

const CX = 80;
const CY = 64;

function polar(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
}
const f = (n: number) => Number(n.toFixed(2));

/** Precision — a turned part with dial ticks and a dimension callout. */
function PrecisionFig() {
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const long = i % 3 === 0;
    const [x1, y1] = polar(30, i * 10);
    const [x2, y2] = polar(long ? 36 : 33, i * 10);
    return <path key={i} d={`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`} opacity={long ? 0.9 : 0.5} />;
  });
  return (
    <>
      <g opacity="0.35" strokeDasharray="2 3">
        <circle cx={CX} cy={CY} r="46" />
        <path d="M80 8v112M24 64h112" />
      </g>
      <circle cx={CX} cy={CY} r="30" />
      <circle cx={CX} cy={CY} r="18" />
      {ticks}
      <circle cx={CX} cy={CY} r="2.5" fill="currentColor" />
      <path d="M50 14v10M110 14v10M50 19h60" />
      <path d="M50 19l6-2.6v5.2zM110 19l-6-2.6v5.2z" fill="currentColor" stroke="none" />
      <text x="80" y="14" textAnchor="middle" fontSize="7.5" fill="currentColor" stroke="none" className="font-mono">
        Ø 60.00
      </text>
      <path d="M103 87l16 16h18" opacity="0.7" />
      <text x="121" y="100" fontSize="6.5" fill="currentColor" stroke="none" className="font-mono" opacity="0.8">
        ±0.01
      </text>
    </>
  );
}

/** Learning — four steps (grade bands) rising, with the growth arc above. */
function LearningFig() {
  const steps = ["G1", "G3", "G6", "G9"];
  return (
    <>
      <g opacity="0.35" strokeDasharray="2 3">
        <path d="M14 104h132M14 104V16" />
        <path d="M22 100L140 24" />
      </g>
      <path d="M22 104v-16h28v-16h28v-16h28v-16h28v64" />
      <path d="M22 104h112" />
      {steps.map((s, i) => (
        <text key={s} x={36 + i * 28} y={84 - i * 16 + 13} textAnchor="middle" fontSize="7" fill="currentColor" stroke="none" className="font-mono">
          {s}
        </text>
      ))}
      <path d="M30 74C46 40 82 22 124 22" strokeDasharray="3 3" />
      <path d="M124 22l-7-3.5v7z" fill="currentColor" stroke="none" />
      <circle cx="134" cy="22" r="5" />
      <path d="M134 14v-4M141 17l3-3M127 17l-3-3" opacity="0.7" />
    </>
  );
}

/** Innovation — a lightbulb with a gear for a filament. */
function InnovationFig() {
  const teeth = Array.from({ length: 8 }, (_, i) => {
    const a = (i * 45 * Math.PI) / 180;
    const x1 = 80 + 10 * Math.cos(a);
    const y1 = 50 + 10 * Math.sin(a);
    const x2 = 80 + 14 * Math.cos(a);
    const y2 = 50 + 14 * Math.sin(a);
    return <path key={i} d={`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`} strokeWidth="2.4" />;
  });
  const rays = [-150, -120, -90, -60, -30].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return <path key={deg} d={`M${f(80 + 40 * Math.cos(a))} ${f(50 + 40 * Math.sin(a))}L${f(80 + 48 * Math.cos(a))} ${f(50 + 48 * Math.sin(a))}`} opacity="0.75" />;
  });
  return (
    <>
      <g opacity="0.35" strokeDasharray="2 3">
        <circle cx="80" cy="50" r="31" />
        <path d="M80 4v114M30 50h100" />
      </g>
      <path d="M68 84v-8c-10-5-17-15-17-27a29 29 0 0 1 58 0c0 12-7 22-17 27v8z" />
      <path d="M66 90h28M68 96h24M73 102h14" />
      <circle cx="80" cy="50" r="10" />
      <circle cx="80" cy="50" r="3.5" />
      {teeth}
      {rays}
    </>
  );
}

/** Automation — the sense → think → act loop. */
function AutomationFig() {
  const nodes = [
    { deg: -90, l: "S" },
    { deg: 30, l: "T" },
    { deg: 150, l: "A" },
  ];
  const arcs = [
    [-90 + 18, 30 - 18],
    [30 + 18, 150 - 18],
    [150 + 18, 270 - 18],
  ];
  const R = 36;
  return (
    <>
      <g opacity="0.35" strokeDasharray="2 3">
        <circle cx={CX} cy={CY} r="50" />
        <path d="M80 6v116M22 64h116" />
      </g>
      {arcs.map(([a0, a1], i) => {
        const [x0, y0] = polar(R, a0);
        const [x1, y1] = polar(R, a1);
        const tip = polar(R, a1);
        const back = polar(R - 4, a1 - 6);
        const back2 = polar(R + 4, a1 - 6);
        return (
          <g key={i}>
            <path d={`M${f(x0)} ${f(y0)}A${R} ${R} 0 0 1 ${f(x1)} ${f(y1)}`} />
            <path d={`M${f(back[0])} ${f(back[1])}L${f(tip[0])} ${f(tip[1])}L${f(back2[0])} ${f(back2[1])}`} />
          </g>
        );
      })}
      {nodes.map((n) => {
        const [x, y] = polar(R, n.deg);
        return (
          <g key={n.l}>
            <circle cx={f(x)} cy={f(y)} r="10" className="fill-paper-50" />
            <text x={f(x)} y={f(y) + 3} textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor" stroke="none">
              {n.l}
            </text>
          </g>
        );
      })}
      <circle cx={CX} cy={CY} r="3" fill="currentColor" />
    </>
  );
}

const FIGS: Record<ValueKey, () => React.ReactElement> = {
  precision: PrecisionFig,
  learning: LearningFig,
  innovation: InnovationFig,
  automation: AutomationFig,
};

/** Hand-drafted line figure for one brand value. Decorative. */
export function ValueFigure({ value, className }: { value: ValueKey; className?: string }) {
  const Fig = FIGS[value];
  return (
    <svg viewBox="0 0 160 124" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("text-graphite", className)}>
      <Fig />
    </svg>
  );
}
