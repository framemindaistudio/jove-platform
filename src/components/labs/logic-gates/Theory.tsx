"use client";

import { useState } from "react";
import { ConceptCard, KeyIdea, StageHeader } from "@/components/labs/framework/LabJourney";
import { cn } from "@/lib/utils";
import { GateShape } from "./Circuit";
import { GATE_INFO, type GateType } from "./logic";

const INK = "#2B2B2B";
const PAPER = "#F5F1E8";
const GREY = "#7A7A7A";
const MONO = "var(--font-mono-jb), monospace";

function Bulb({ on, x, y }: { on: boolean; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {on &&
        [0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line key={a} x1={Math.cos((a * Math.PI) / 180) * 17} y1={Math.sin((a * Math.PI) / 180) * 17} x2={Math.cos((a * Math.PI) / 180) * 24} y2={Math.sin((a * Math.PI) / 180) * 24} stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        ))}
      <circle r={12} fill={on ? INK : PAPER} stroke={INK} strokeWidth={1.6} />
      <path d="M-4.5 4 L-2 -3 L0 2 L2 -3 L4.5 4" fill="none" stroke={on ? PAPER : INK} strokeWidth={1.1} strokeLinejoin="round" />
    </g>
  );
}

function FigBinary() {
  return (
    <svg viewBox="0 0 340 140" className="h-auto w-full" role="img" aria-label="An open switch means OFF, written 0, and the lamp is dark. A closed switch means ON, written 1, and the lamp lights.">
      {[
        { x: 10, on: false, label: "OFF = 0" },
        { x: 180, on: true, label: "ON = 1" },
      ].map((c) => (
        <g key={c.x} transform={`translate(${c.x} 0)`}>
          <rect x={0} y={20} width={150} height={84} rx={6} fill="none" stroke={INK} strokeOpacity={0.15} strokeDasharray="3 3" />
          {/* battery */}
          <g stroke={INK} strokeWidth={1.6}>
            <line x1={22} y1={50} x2={22} y2={74} />
            <line x1={30} y1={56} x2={30} y2={68} strokeWidth={3} />
          </g>
          <path d={`M22 50 V36 H60`} fill="none" stroke={INK} strokeWidth={c.on ? 2.6 : 1.6} />
          {/* switch */}
          <circle cx={62} cy={36} r={2.6} fill={INK} />
          <line x1={62} y1={36} x2={c.on ? 92 : 88} y2={c.on ? 36 : 22} stroke={INK} strokeWidth={2} strokeLinecap="round" />
          <circle cx={94} cy={36} r={2.6} fill={INK} />
          <path d={`M94 36 H124 V${62}`} fill="none" stroke={INK} strokeWidth={c.on ? 2.6 : 1.6} />
          <Bulb on={c.on} x={124} y={74} />
          <path d={`M124 86 V92 H30 V68`} fill="none" stroke={INK} strokeWidth={c.on ? 2.6 : 1.6} />
          <text x={75} y={128} textAnchor="middle" fontFamily={MONO} fontSize={12} fontWeight={700} fill={INK}>
            {c.label}
          </text>
        </g>
      ))}
      <text x={170} y={14} textAnchor="middle" fontFamily={MONO} fontSize={8.5} fill={GREY} letterSpacing={1.4}>
        ONE SWITCH = ONE BIT
      </text>
    </svg>
  );
}

/** Interactive gate: tap A / B to see the output — with its truth table. */
function MiniGate({ type, analogy }: { type: GateType; analogy: string }) {
  const one = GATE_INFO[type].arity === 1;
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const out = GATE_INFO[type].fn(a, b);
  const rows = one ? [[false], [true]] : [[false, false], [false, true], [true, false], [true, true]];
  const cur = one ? Number(a) : Number(a) * 2 + Number(b);
  const sw = (v: boolean, set: (v: boolean) => void, name: string) => (
    <button type="button" role="switch" aria-checked={v} aria-label={`Input ${name}`} onClick={() => set(!v)} className={cn("inline-flex h-10 w-[4.5rem] items-center justify-between rounded-full border-2 px-3 font-mono text-sm font-bold transition-colors", v ? "border-graphite bg-graphite text-paper" : "border-graphite/40 bg-paper text-graphite hover:border-graphite")}>
      {name}
      <span>{v ? 1 : 0}</span>
    </button>
  );
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-2">
          {sw(a, setA, "A")}
          {!one && sw(b, setB, "B")}
        </div>
        <svg viewBox="-24 -30 158 60" className="h-auto min-w-0 flex-1" role="img" aria-label={`${type} gate. Output is ${out ? "ON" : "OFF"}.`}>
          <g stroke={INK} strokeWidth={a ? 2.6 : 1.4}>
            <line x1={-24} y1={one ? 0 : -10} x2={type === "OR" || type === "XOR" ? 4.5 : 0} y2={one ? 0 : -10} />
          </g>
          {!one && <line x1={-24} y1={10} x2={type === "OR" || type === "XOR" ? 4.5 : 0} y2={10} stroke={INK} strokeWidth={b ? 2.6 : 1.4} />}
          <GateShape type={type} />
          <line x1={60} y1={0} x2={92} y2={0} stroke={INK} strokeWidth={out ? 2.6 : 1.4} />
          <Bulb on={out} x={106} y={0} />
        </svg>
      </div>
      <table className="mt-4 w-full border-collapse text-center font-mono text-xs tabular-nums">
        <thead>
          <tr className="border-b-2 border-graphite text-[10px] text-charcoal">
            <th scope="col" className="py-1.5">A</th>
            {!one && <th scope="col" className="py-1.5">B</th>}
            <th scope="col" className="py-1.5">{type} out</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const o = GATE_INFO[type].fn(r[0], r[1] ?? false);
            return (
              <tr key={i} className={cn("border-b border-graphite/10 transition-colors", i === cur && "bg-graphite text-paper")}>
                <td className="py-1">{r[0] ? 1 : 0}</td>
                {!one && <td className="py-1">{r[1] ? 1 : 0}</td>}
                <td className="py-1 font-bold">{o ? 1 : 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs italic text-blueprint">{analogy}</p>
    </div>
  );
}

const GATES: { type: GateType; title: string; text: React.ReactNode; analogy: string }[] = [
  {
    type: "AND",
    title: "AND — both, please",
    text: (
      <>
        The <strong>AND</strong> gate outputs 1 only when input A <em>and</em> input B are both 1. One OFF input is enough to keep the lamp dark.
      </>
    ),
    analogy: "Like a bank locker that needs the manager's key and your key turned together.",
  },
  {
    type: "OR",
    title: "OR — either one",
    text: (
      <>
        The <strong>OR</strong> gate outputs 1 when <em>at least one</em> input is 1. It is only 0 when every input is 0.
      </>
    ),
    analogy: "Like a doorbell that rings from the front door or the back door.",
  },
  {
    type: "NOT",
    title: "NOT — the flipper",
    text: (
      <>
        The <strong>NOT</strong> gate has a single input and flips it: 1 becomes 0, 0 becomes 1. The little circle on its tip means “flip”.
      </>
    ),
    analogy: "Like a night light: when daylight is ON, the lamp is OFF.",
  },
  {
    type: "XOR",
    title: "XOR — one or the other",
    text: (
      <>
        <strong>XOR</strong> (“exclusive OR”) outputs 1 when <em>exactly one</em> input is 1. Both ON? Back to 0.
      </>
    ),
    analogy: "Like a staircase light with a switch at the top and the bottom.",
  },
];

export function LogicTheory() {
  return (
    <div>
      <StageHeader
        index="01"
        kicker="Theory"
        title="How does a machine decide?"
        intro="Every computer — your phone, a game console, a robot's brain — makes decisions using tiny switches called logic gates. They only understand two things: ON and OFF. Tap the switches below to test each gate yourself."
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <ConceptCard n={1} title="Binary: ON and OFF" figure={<FigBinary />} className="md:col-span-2 xl:col-span-1">
          Computers use <strong>binary</strong>: just two values. We write ON as <strong className="font-mono">1</strong> and OFF as <strong className="font-mono">0</strong>. One switch holds one <strong>bit</strong>. With two switches there are 2 × 2 = 4 combinations; with three, 8.
        </ConceptCard>
        {GATES.map((g, i) => (
          <ConceptCard key={g.type} n={i + 2} title={g.title} figure={<MiniGate type={g.type} analogy={g.analogy} />}>
            {g.text}
          </ConceptCard>
        ))}
        <ConceptCard n={6} title="Truth tables: the rule book">
          A <strong>truth table</strong> lists every possible combination of inputs and the output for each one. Engineers use them to design a circuit <em>before</em> building it — and to test it after. In the Hands-on stage you&apos;ll fill one in yourself, row by row.
          <ul className="mt-3 space-y-1 font-mono text-xs">
            <li>1 input → 2 rows</li>
            <li>2 inputs → 4 rows</li>
            <li>3 inputs → 8 rows</li>
          </ul>
        </ConceptCard>
      </div>
      <KeyIdea>A modern processor packs billions of transistors that work as logic gates. Every “decision” it makes is built from AND, OR and NOT — the same gates you just tried.</KeyIdea>
    </div>
  );
}
