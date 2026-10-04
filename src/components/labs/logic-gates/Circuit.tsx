"use client";

import { useId, useMemo } from "react";
import { evaluate, gateType, GATE_INFO, GATE_W, inPort, junctions, LAMP_ENTRY, SWITCH_OUT_X, wires, type Choices, type CircuitDef, type GateType, type InputId, type Inputs } from "./logic";

const PAPER = "#F5F1E8";
const INK = "#2B2B2B";
const MONO = "var(--font-mono-jb), monospace";
const SANS = "var(--font-montserrat), sans-serif";

/* ───────────────────────── gate symbol ───────────────────────── */

const BODY: Record<GateType, string> = {
  AND: "M0 -20 H30 A20 20 0 0 1 30 20 H0 Z",
  OR: "M0 -20 Q12 0 0 20 Q38 20 60 0 Q38 -20 0 -20 Z",
  XOR: "M0 -20 Q12 0 0 20 Q38 20 60 0 Q38 -20 0 -20 Z",
  NOT: "M0 -18 L49 0 L0 18 Z",
  BUF: "M0 -18 L60 0 L0 18 Z",
};

/** Standard (ANSI) gate symbol drawn at local origin: inputs on the left (x=0), output at x=60. */
export function GateShape({ type, stroke = INK, fill = PAPER, label = true, labelColor }: { type: GateType; stroke?: string; fill?: string; label?: boolean; labelColor?: string }) {
  return (
    <g strokeLinejoin="round">
      <path d={BODY[type]} fill={fill} stroke={stroke} strokeWidth={1.8} />
      {type === "XOR" && <path d="M-7 -20 Q5 0 -7 20" fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />}
      {type === "NOT" && <circle cx={54.5} cy={0} r={5.2} fill={fill} stroke={stroke} strokeWidth={1.8} />}
      {label && (
        <text x={type === "NOT" ? 16 : type === "BUF" ? 18 : type === "AND" ? 22 : 24} y={3.5} textAnchor="middle" fontFamily={MONO} fontSize={type === "NOT" || type === "BUF" ? 8.5 : 9.5} fontWeight={700} fill={labelColor ?? stroke}>
          {type === "BUF" ? "—" : type}
        </text>
      )}
    </g>
  );
}

/* ───────────────────────── circuit board (dark blueprint) ───────────────────────── */

export function CircuitBoard({
  def,
  inputs,
  choices,
  wave = Infinity,
  onToggle,
  onSlot,
  slotNumbers,
  className,
  label,
}: {
  def: CircuitDef;
  inputs: Inputs;
  choices: Choices;
  /** propagation front for the demo (Infinity = settled) */
  wave?: number;
  onToggle?: (id: InputId) => void;
  onSlot?: (gateId: string) => void;
  slotNumbers?: Record<string, number>;
  className?: string;
  label: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const glow = `lg-glow-${uid}`;
  const halo = `lg-halo-${uid}`;
  const { values, depth, lamp, maxDepth } = useMemo(() => evaluate(def, inputs, choices), [def, inputs, choices]);
  const ws = useMemo(() => wires(def, choices), [def, choices]);
  const dots = useMemo(() => junctions(ws), [ws]);
  const reached = (id: string) => (depth[id] ?? 0) <= wave;
  const on = (id: string) => values[id] === true && reached(id);
  const lampOn = lamp === true && wave >= maxDepth;

  const lampDesc = lamp === null ? "The circuit is not complete yet." : lampOn ? "The lamp is ON." : "The lamp is OFF.";

  return (
    <svg viewBox={`0 0 ${def.w} ${def.h}`} className={className} role="img" aria-label={label}>
      <desc>{`${def.inputs.map((i) => `${i.label} (${i.id}) is ${inputs[i.id] ? "ON" : "OFF"}`).join(", ")}. ${lampDesc}`}</desc>
      <defs>
        <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={halo}>
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="45%" stopColor={PAPER} stopOpacity="0.18" />
          <stop offset="100%" stopColor={PAPER} stopOpacity="0" />
        </radialGradient>
      </defs>
      <style>{`.lg-flow{animation:lg-flow .9s linear infinite}@keyframes lg-flow{to{stroke-dashoffset:-24}}@media (prefers-reduced-motion: reduce){.lg-flow{animation:none}}.lg-switch .lg-focus{opacity:0}.lg-switch:focus-visible .lg-focus{opacity:1}`}</style>

      {/* wires */}
      {ws.map((w) => {
        const lit = on(w.from);
        const unknown = values[w.from] === null || !reached(w.from);
        return (
          <g key={w.key}>
            <path d={w.d} fill="none" stroke={PAPER} strokeOpacity={lit ? 1 : unknown ? 0.16 : 0.28} strokeWidth={lit ? 3 : 2} strokeDasharray={unknown && !lit ? "4 5" : undefined} filter={lit ? `url(#${glow})` : undefined} strokeLinejoin="round" style={{ transition: "stroke-opacity .25s, stroke-width .25s" }} />
            {lit && <path d={w.d} fill="none" stroke={INK} strokeOpacity={0.55} strokeWidth={1.4} strokeDasharray="3 9" className="lg-flow" strokeLinecap="round" />}
          </g>
        );
      })}
      {dots.map((d) => (
        <circle key={d.key} cx={d.x} cy={d.y} r={3.6} fill={on(d.from) ? "#FFFFFF" : "#6B6B6B"} />
      ))}

      {/* input switches */}
      {def.inputs.map((inp) => {
        const v = inputs[inp.id];
        const interactive = !!onToggle;
        return (
          <g
            key={inp.id}
            transform={`translate(0 ${inp.y})`}
            role={interactive ? "switch" : undefined}
            aria-checked={interactive ? v : undefined}
            aria-label={interactive ? `${inp.label} (${inp.id})` : undefined}
            tabIndex={interactive ? 0 : undefined}
            onClick={interactive ? () => onToggle(inp.id) : undefined}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onToggle(inp.id);
                    }
                  }
                : undefined
            }
            style={{ cursor: interactive ? "pointer" : undefined, outline: "none" }}
            className="lg-switch"
          >
            <text x={14} y={-20} fontFamily={SANS} fontSize={10} fontWeight={600} fill={PAPER} fillOpacity={0.7}>
              <tspan fontFamily={MONO} fontWeight={700} fillOpacity={1}>
                {inp.id}
              </tspan>
              {"  "}
              {inp.label}
            </text>
            <rect x={14} y={-12} width={50} height={24} rx={12} fill={v ? PAPER : "transparent"} stroke={PAPER} strokeOpacity={v ? 1 : 0.55} strokeWidth={1.6} style={{ transition: "fill .2s" }} />
            <circle cx={v ? 52 : 26} cy={0} r={8} fill={v ? INK : PAPER} fillOpacity={v ? 1 : 0.75} style={{ transition: "cx .2s cubic-bezier(.16,1,.3,1)" }} />
            <text x={78} y={4} textAnchor="middle" fontFamily={MONO} fontSize={12} fontWeight={700} fill={PAPER} fillOpacity={v ? 1 : 0.45}>
              {v ? 1 : 0}
            </text>
            <line x1={86} y1={0} x2={SWITCH_OUT_X} y2={0} stroke={PAPER} strokeOpacity={v ? 1 : 0.28} strokeWidth={v ? 3 : 2} />
            <rect className="lg-focus" x={8} y={-17} width={62} height={34} rx={17} fill="none" stroke={PAPER} strokeWidth={1.5} strokeDasharray="3 3" />
          </g>
        );
      })}

      {/* gates & slots */}
      {def.gates.map((g) => {
        const t = gateType(g, choices);
        const val = values[g.id];
        const outOn = val === true && reached(g.id);
        const n = slotNumbers?.[g.id];
        const clickable = !g.fixed && !!onSlot;
        const slotEl = (
          <>
            {!t ? (
              <g>
                <rect x={0} y={-22} width={GATE_W} height={44} rx={8} fill="rgba(245,241,232,0.06)" stroke={PAPER} strokeOpacity={0.75} strokeWidth={1.5} strokeDasharray="5 4" />
                <text x={30} y={6} textAnchor="middle" fontFamily={SANS} fontSize={18} fontWeight={700} fill={PAPER}>
                  ?
                </text>
              </g>
            ) : (
              <GateShape type={t} stroke={PAPER} fill={INK} labelColor={PAPER} />
            )}
            {/* input stubs for OR/XOR so wires visibly touch the curved back */}
            {t &&
              g.in.map((_, i) => {
                const p = inPort(g, i, t);
                return p.x !== g.x ? <line key={i} x1={0} y1={p.y - g.y} x2={p.x - g.x} y2={p.y - g.y} stroke={PAPER} strokeOpacity={0.4} strokeWidth={2} /> : null;
              })}
            {/* output node — a solid dot only while the output is ON (never a hollow circle: that would read as an inverting bubble) */}
            {outOn && <circle cx={GATE_W + 2} cy={0} r={2.6} fill="#FFFFFF" filter={`url(#${glow})`} />}
            {n !== undefined && (
              <g transform="translate(30 -33)">
                <rect x={-21} y={-8} width={42} height={15} rx={7.5} fill={PAPER} fillOpacity={t ? 0.14 : 0.9} />
                <text y={3} textAnchor="middle" fontFamily={MONO} fontSize={8.5} fontWeight={700} fill={t ? PAPER : INK}>
                  SLOT {n}
                </text>
              </g>
            )}
          </>
        );
        return (
          <g
            key={g.id}
            transform={`translate(${g.x} ${g.y})`}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-label={clickable ? `Slot ${n ?? ""}: ${t ? GATE_INFO[t].name : "empty"} — click to change the gate` : undefined}
            onClick={clickable ? () => onSlot(g.id) : undefined}
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSlot(g.id);
                    }
                  }
                : undefined
            }
            style={{ cursor: clickable ? "pointer" : undefined, outline: "none" }}
            className={clickable ? "lg-switch" : undefined}
          >
            {slotEl}
            {clickable && <rect className="lg-focus" x={-10} y={-27} width={GATE_W + 20} height={54} rx={10} fill="none" stroke={PAPER} strokeWidth={1.5} strokeDasharray="3 3" />}
          </g>
        );
      })}

      {/* lamp */}
      <g transform={`translate(${def.lamp.x} ${def.lamp.y})`}>
        {lampOn && <circle r={70} fill={`url(#${halo})`} />}
        <rect x={-LAMP_ENTRY} y={-7} width={14} height={14} rx={2} fill={INK} stroke={PAPER} strokeOpacity={0.8} strokeWidth={1.4} />
        <path d={`M${-LAMP_ENTRY + 4} -7 V7 M${-LAMP_ENTRY + 8} -7 V7 M${-LAMP_ENTRY + 12} -7 V7`} stroke={PAPER} strokeOpacity={0.5} strokeWidth={1} />
        <circle r={17} fill={lampOn ? "#FFFFFF" : INK} stroke={PAPER} strokeOpacity={lampOn ? 1 : 0.8} strokeWidth={1.8} filter={lampOn ? `url(#${glow})` : undefined} style={{ transition: "fill .3s" }} />
        <path d="M-6 6 L-3 -4 L0 3 L3 -4 L6 6" fill="none" stroke={lampOn ? INK : PAPER} strokeOpacity={lampOn ? 0.8 : 0.5} strokeWidth={1.3} strokeLinejoin="round" />
        {lampOn &&
          [0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1={Math.cos((a * Math.PI) / 180) * 24} y1={Math.sin((a * Math.PI) / 180) * 24} x2={Math.cos((a * Math.PI) / 180) * 33} y2={Math.sin((a * Math.PI) / 180) * 33} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" filter={`url(#${glow})`} />
          ))}
        <text y={44} textAnchor="middle" fontFamily={MONO} fontSize={9} letterSpacing={1.5} fill={PAPER} fillOpacity={0.7}>
          {lamp === null ? "LAMP ?" : lampOn ? "LAMP ON" : "LAMP OFF"}
        </text>
      </g>
    </svg>
  );
}

