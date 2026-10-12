/**
 * Light the Lamp — pure logic (no React): gate rules, circuit evaluation, wire routing and the puzzle set.
 *
 * Coordinates are SVG units. Gates are 60 wide; `x` is the left edge, `y` the centre line.
 * Two-input gates take their inputs at y-10 (first) and y+10 (second); output is at x+60.
 */

export type GateType = "AND" | "OR" | "XOR" | "NOT" | "BUF";
export type InputId = "A" | "B" | "C";
export type Inputs = Record<InputId, boolean>;
export type Choices = Record<string, GateType | null>;

export const GATE_INFO: Record<GateType, { name: string; arity: 1 | 2; rule: string; fn: (a: boolean, b: boolean) => boolean }> = {
  AND: { name: "AND", arity: 2, rule: "ON only when both inputs are ON", fn: (a, b) => a && b },
  OR: { name: "OR", arity: 2, rule: "ON when at least one input is ON", fn: (a, b) => a || b },
  XOR: { name: "XOR", arity: 2, rule: "ON when exactly one input is ON", fn: (a, b) => a !== b },
  NOT: { name: "NOT", arity: 1, rule: "Flips the signal: ON becomes OFF", fn: (a) => !a },
  BUF: { name: "Wire", arity: 1, rule: "Passes the signal straight through", fn: (a) => a },
};

export interface CircuitInput {
  id: InputId;
  label: string;
  y: number;
}
export interface CircuitGate {
  id: string;
  x: number;
  y: number;
  /** source ids (input ids or gate ids), top port first */
  in: string[];
  fixed?: GateType;
  /** choices for an empty slot */
  options?: GateType[];
  /** x of the vertical segment of each input wire (defaults to just left of the gate) */
  mid?: (number | undefined)[];
}
export interface CircuitDef {
  w: number;
  h: number;
  inputs: CircuitInput[];
  gates: CircuitGate[];
  lamp: { x: number; y: number; from: string; label?: string };
}
export interface Puzzle extends CircuitDef {
  id: string;
  title: string;
  story: string;
  goal: string;
  hint: string;
  target: (v: Inputs) => boolean;
}

export const GATE_W = 60;
export const SWITCH_OUT_X = 96;

export const gateType = (g: CircuitGate, choices: Choices): GateType | null => g.fixed ?? choices[g.id] ?? null;
export const isSlot = (g: CircuitGate) => !g.fixed;
export const slots = (def: CircuitDef) => def.gates.filter(isSlot);

export function emptyChoices(def: CircuitDef): Choices {
  return Object.fromEntries(slots(def).map((g) => [g.id, null]));
}

export function evaluate(def: CircuitDef, inputs: Inputs, choices: Choices) {
  const gates = new Map(def.gates.map((g) => [g.id, g]));
  const values: Record<string, boolean | null> = {};
  const depth: Record<string, number> = {};
  const visit = (id: string): boolean | null => {
    if (id in values) return values[id];
    if (id === "A" || id === "B" || id === "C") {
      depth[id] = 0;
      return (values[id] = inputs[id]);
    }
    const g = gates.get(id);
    if (!g) return (values[id] = null);
    const ins = g.in.map(visit);
    depth[id] = 1 + Math.max(0, ...g.in.map((s) => depth[s] ?? 0));
    const t = gateType(g, choices);
    if (!t || ins.some((v) => v === null)) return (values[id] = null);
    return (values[id] = GATE_INFO[t].fn(ins[0] as boolean, (ins[1] ?? false) as boolean));
  };
  def.gates.forEach((g) => visit(g.id));
  const lamp = visit(def.lamp.from);
  const maxDepth = (depth[def.lamp.from] ?? 0) + 1;
  return { values, depth, lamp, maxDepth };
}

/** All input combinations in truth-table order (first input = most significant bit). */
export function combos(ids: InputId[]): Inputs[] {
  const n = ids.length;
  return Array.from({ length: 2 ** n }, (_, r) => {
    const v: Inputs = { A: false, B: false, C: false };
    ids.forEach((id, i) => (v[id] = ((r >> (n - 1 - i)) & 1) === 1));
    return v;
  });
}
export function rowIndex(ids: InputId[], v: Inputs) {
  return ids.reduce((acc, id) => acc * 2 + (v[id] ? 1 : 0), 0);
}

/* ───────────────────────── geometry ───────────────────────── */

export function inPort(g: CircuitGate, i: number, t: GateType | null) {
  const two = g.in.length === 2;
  const dy = two ? (i === 0 ? -10 : 10) : 0;
  const inset = two && (t === "OR" || t === "XOR") ? 4.5 : 0;
  return { x: g.x + inset, y: g.y + dy };
}

export function outPoint(def: CircuitDef, id: string) {
  const inp = def.inputs.find((i) => i.id === id);
  if (inp) return { x: SWITCH_OUT_X, y: inp.y };
  const g = def.gates.find((x) => x.id === id);
  return g ? { x: g.x + GATE_W, y: g.y } : { x: 0, y: 0 };
}

export const LAMP_ENTRY = 32; // wire meets the lamp base this far left of the bulb centre

export interface Wire {
  key: string;
  from: string;
  d: string;
  /** branch point (for junction dots) */
  turn: { x: number; y: number } | null;
}

export function wires(def: CircuitDef, choices: Choices): Wire[] {
  const out: Wire[] = [];
  const route = (from: string, tx: number, ty: number, mid: number | undefined, key: string) => {
    const s = outPoint(def, from);
    if (s.y === ty) {
      out.push({ key, from, d: `M${s.x} ${s.y} H${tx}`, turn: null });
      return;
    }
    const m = mid ?? tx - 22;
    out.push({ key, from, d: `M${s.x} ${s.y} H${m} V${ty} H${tx}`, turn: { x: m, y: s.y } });
  };
  def.gates.forEach((g) => {
    const t = gateType(g, choices);
    g.in.forEach((src, i) => {
      const p = inPort(g, i, t);
      route(src, p.x, p.y, g.mid?.[i], `${g.id}-${i}`);
    });
  });
  route(def.lamp.from, def.lamp.x - LAMP_ENTRY, def.lamp.y, undefined, "lamp");
  return out;
}

/** Junction dots where one signal branches to several gates. */
export function junctions(ws: Wire[]) {
  const bySource = new Map<string, Wire[]>();
  ws.forEach((w) => bySource.set(w.from, [...(bySource.get(w.from) ?? []), w]));
  const dots: { key: string; x: number; y: number; from: string }[] = [];
  bySource.forEach((list, from) => {
    if (list.length < 2) return;
    const turns = list.map((w) => w.turn).filter((t): t is { x: number; y: number } => !!t);
    if (!turns.length) return;
    const maxX = Math.max(...turns.map((t) => t.x));
    const seen = new Set<string>();
    turns.forEach((t) => {
      const k = `${t.x},${t.y}`;
      if (seen.has(k)) return;
      seen.add(k);
      const atMax = turns.filter((u) => u.x === t.x).length;
      // a straight wire continuing past this turn also makes it a junction
      const straightPast = list.some((w) => !w.turn);
      if (t.x < maxX || atMax > 1 || straightPast) dots.push({ key: `${from}-${k}`, x: t.x, y: t.y, from });
    });
  });
  return dots;
}

/* ───────────────────────── demo circuits ───────────────────────── */

const single = (t: GateType): CircuitDef =>
  GATE_INFO[t].arity === 1
    ? {
        w: 480,
        h: 200,
        inputs: [{ id: "A", label: "Switch A", y: 100 }],
        gates: [{ id: "g1", x: 220, y: 100, in: ["A"], fixed: t }],
        lamp: { x: 420, y: 100, from: "g1" },
      }
    : {
        w: 480,
        h: 200,
        inputs: [
          { id: "A", label: "Switch A", y: 60 },
          { id: "B", label: "Switch B", y: 140 },
        ],
        gates: [{ id: "g1", x: 220, y: 100, in: ["A", "B"], fixed: t }],
        lamp: { x: 420, y: 100, from: "g1" },
      };

export const DEMOS: { id: string; label: string; def: CircuitDef; about: string }[] = [
  { id: "and", label: "AND", def: single("AND"), about: "The lamp waits until BOTH switches are ON." },
  { id: "or", label: "OR", def: single("OR"), about: "Any switch ON is enough to light the lamp." },
  { id: "not", label: "NOT", def: single("NOT"), about: "The NOT gate flips the signal — switch OFF, lamp ON." },
  { id: "xor", label: "XOR", def: single("XOR"), about: "Exactly one switch ON lights the lamp. Both ON? Dark again." },
  {
    id: "porch",
    label: "Porch light",
    about: "A real circuit: the porch light turns on when it's dark AND someone moves — or when you press the manual switch.",
    def: {
      w: 560,
      h: 230,
      inputs: [
        { id: "A", label: "It's dark", y: 50 },
        { id: "B", label: "Motion", y: 110 },
        { id: "C", label: "Manual", y: 190 },
      ],
      gates: [
        { id: "g1", x: 180, y: 80, in: ["A", "B"], fixed: "AND" },
        { id: "g2", x: 330, y: 120, in: ["g1", "C"], fixed: "OR" },
      ],
      lamp: { x: 500, y: 120, from: "g2" },
    },
  },
];

/* ───────────────────────── puzzles ───────────────────────── */

const TWO: GateType[] = ["AND", "OR", "XOR"];
const ONE: GateType[] = ["NOT", "BUF"];

const twoInput = (labels: [string, string], options = TWO) => ({
  w: 500,
  h: 220,
  inputs: [
    { id: "A" as const, label: labels[0], y: 70 },
    { id: "B" as const, label: labels[1], y: 150 },
  ],
  gates: [{ id: "g1", x: 230, y: 110, in: ["A", "B"], options }],
  lamp: { x: 440, y: 110, from: "g1" },
});

const threeChain = (labels: [string, string, string]) => ({
  w: 560,
  h: 230,
  inputs: [
    { id: "A" as const, label: labels[0], y: 50 },
    { id: "B" as const, label: labels[1], y: 110 },
    { id: "C" as const, label: labels[2], y: 190 },
  ],
  gates: [
    { id: "g1", x: 180, y: 80, in: ["A", "B"], options: TWO },
    { id: "g2", x: 330, y: 120, in: ["g1", "C"], options: TWO },
  ],
  lamp: { x: 500, y: 120, from: "g2" },
});

export const PUZZLES: Puzzle[] = [
  {
    id: "p1",
    title: "The two-key locker",
    story: "A bank locker opens only when the manager's key AND your key are both turned.",
    goal: "Light the lamp only when A and B are both ON.",
    hint: "Which gate needs both inputs to be ON? Try each gate and watch the truth table.",
    target: (v) => v.A && v.B,
    ...twoInput(["Manager's key", "Your key"]),
  },
  {
    id: "p2",
    title: "Two doorbells",
    story: "The house has a front door and a back door. The bell lamp should glow if anyone presses either button.",
    goal: "Light the lamp when A or B (or both) are ON.",
    hint: "You need a gate that says “at least one”.",
    target: (v) => v.A || v.B,
    ...twoInput(["Front door", "Back door"]),
  },
  {
    id: "p3",
    title: "The night light",
    story: "A daylight sensor is ON when the sun is out. The night light should do the opposite.",
    goal: "Light the lamp when A is OFF.",
    hint: "One gate flips ON to OFF and OFF to ON.",
    target: (v) => !v.A,
    w: 500,
    h: 220,
    inputs: [{ id: "A", label: "Daylight", y: 110 }],
    gates: [{ id: "g1", x: 230, y: 110, in: ["A"], options: ONE }],
    lamp: { x: 440, y: 110, from: "g1" },
  },
  {
    id: "p4",
    title: "The staircase light",
    story: "There's a switch at the bottom of the stairs and one at the top. Flipping EITHER one should change the light.",
    goal: "Light the lamp when exactly one of A and B is ON.",
    hint: "When both are ON, the lamp must be OFF. Which gate is “one or the other, but not both”?",
    target: (v) => v.A !== v.B,
    ...twoInput(["Downstairs", "Upstairs"]),
  },
  {
    id: "p5",
    title: "The study lamp",
    story: "Your study lamp should switch on when you sit at the desk (A) — but only if the room light (B) is NOT already on.",
    goal: "Light the lamp when A is ON and B is OFF.",
    hint: "Flip B first with slot 1, then combine it with A in slot 2.",
    target: (v) => v.A && !v.B,
    w: 530,
    h: 220,
    inputs: [
      { id: "A", label: "At the desk", y: 60 },
      { id: "B", label: "Room light", y: 160 },
    ],
    gates: [
      { id: "g1", x: 150, y: 160, in: ["B"], options: ONE },
      { id: "g2", x: 300, y: 110, in: ["A", "g1"], options: TWO },
    ],
    lamp: { x: 470, y: 110, from: "g2" },
  },
  {
    id: "p6",
    title: "The classroom fan",
    story: "The fan should run when the room is occupied AND it's hot — or whenever the teacher presses the override button.",
    goal: "Light the lamp when (A and B) are ON, or when C is ON.",
    hint: "Slot 1 checks “occupied and hot”. Slot 2 lets the override win on its own.",
    target: (v) => (v.A && v.B) || v.C,
    ...threeChain(["Occupied", "It's hot", "Override"]),
  },
];

export const CHALLENGE_PUZZLES: Puzzle[] = [
  {
    id: "c1",
    title: "Three judges",
    story: "Three judges vote on each robot at the competition. A robot passes when at least TWO judges vote yes.",
    goal: "Light the lamp when at least two of A, B and C are ON.",
    hint: "Slots 1–3 each check one pair of judges. Slots 4 and 5 combine the pairs: if ANY pair agrees, the robot passes.",
    target: (v) => Number(v.A) + Number(v.B) + Number(v.C) >= 2,
    w: 640,
    h: 320,
    inputs: [
      { id: "A", label: "Judge 1", y: 50 },
      { id: "B", label: "Judge 2", y: 150 },
      { id: "C", label: "Judge 3", y: 250 },
    ],
    gates: [
      { id: "g1", x: 210, y: 70, in: ["A", "B"], options: TWO, mid: [180, 180] },
      { id: "g2", x: 210, y: 170, in: ["B", "C"], options: TWO, mid: [180, 180] },
      { id: "g3", x: 210, y: 270, in: ["C", "A"], options: TWO, mid: [180, 130] },
      { id: "g4", x: 340, y: 120, in: ["g1", "g2"], options: TWO, mid: [310, 310] },
      { id: "g5", x: 450, y: 195, in: ["g4", "g3"], options: TWO, mid: [425, 425] },
    ],
    lamp: { x: 590, y: 195, from: "g5" },
  },
  {
    id: "c2",
    title: "The three-switch hall",
    story: "A long hall has three switches. Flipping ANY one of them must change the light, whatever the others are doing.",
    goal: "Light the lamp when an odd number of switches (1 or 3) are ON.",
    hint: "Think about the staircase light — then chain it once more with the third switch.",
    target: (v) => (Number(v.A) + Number(v.B) + Number(v.C)) % 2 === 1,
    ...threeChain(["Door", "Bed", "Desk"]),
  },
  {
    id: "c3",
    title: "The secret vault",
    story: "The vault lamp lights only for the secret code ON – OFF – ON. Every other code must keep it dark.",
    goal: "Light the lamp only when A is ON, B is OFF and C is ON.",
    hint: "Flip B, then make sure A, the flipped B and C are ALL on.",
    target: (v) => v.A && !v.B && v.C,
    w: 610,
    h: 260,
    inputs: [
      { id: "A", label: "Dial 1", y: 50 },
      { id: "B", label: "Dial 2", y: 130 },
      { id: "C", label: "Dial 3", y: 220 },
    ],
    gates: [
      { id: "g1", x: 150, y: 130, in: ["B"], options: ONE },
      { id: "g2", x: 280, y: 90, in: ["A", "g1"], options: TWO },
      { id: "g3", x: 410, y: 150, in: ["g2", "C"], options: TWO },
    ],
    lamp: { x: 560, y: 150, from: "g3" },
  },
];
