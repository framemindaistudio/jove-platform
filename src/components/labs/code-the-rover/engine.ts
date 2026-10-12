/**
 * Code the Rover — pure engine (no React).
 * Grid coordinates: x → right, y → down. Directions: 0 = North, 1 = East, 2 = South, 3 = West.
 *
 * Map characters:
 *   .  empty ground      #  rock (crash!)      *  gem (collect all of them)
 *   F  flag (goal)       ^ > v <  rover start, facing N / E / S / W
 */

export type Dir = 0 | 1 | 2 | 3;
export type Action = "forward" | "left" | "right";
export type BlockKind = Action | "repeat";

export interface SimpleBlock {
  id: string;
  kind: Action;
}
export interface RepeatBlock {
  id: string;
  kind: "repeat";
  times: number;
  body: Block[];
}
export type Block = SimpleBlock | RepeatBlock;

export interface LevelDef {
  id: string;
  name: string;
  /** one-line mission shown above the board */
  mission: string;
  /** friendly hint (revealed on demand) */
  hint: string;
  map: string[];
  /** block count for 3 stars (the shortest solution we know) */
  par: number;
  allowed: BlockKind[];
  /** hard cap on blocks (challenge levels) */
  maxBlocks?: number;
}

export interface Pt {
  x: number;
  y: number;
}

export interface Level extends LevelDef {
  w: number;
  h: number;
  start: Pt & { dir: Dir };
  flag: Pt;
  rocks: Set<string>;
  gems: Pt[];
}

export const key = (x: number, y: number) => `${x},${y}`;

const DIR_CHARS: Record<string, Dir> = { "^": 0, ">": 1, v: 2, "<": 3 };
export const DIR_NAMES = ["North", "East", "South", "West"] as const;

export function parseLevel(def: LevelDef): Level {
  const h = def.map.length;
  const w = Math.max(...def.map.map((r) => r.length));
  let start: Level["start"] = { x: 0, y: 0, dir: 1 };
  let flag: Pt = { x: w - 1, y: h - 1 };
  const rocks = new Set<string>();
  const gems: Pt[] = [];
  def.map.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === "#") rocks.add(key(x, y));
      else if (c === "*") gems.push({ x, y });
      else if (c === "F") flag = { x, y };
      else if (c in DIR_CHARS) start = { x, y, dir: DIR_CHARS[c] };
    });
  });
  return { ...def, w, h, start, flag, rocks, gems };
}

/* ───────────────────────── program → steps ───────────────────────── */

export interface Step {
  action: Action;
  blockId: string;
  /** enclosing repeat blocks, outermost first, with the current iteration (1-based) */
  loops: { id: string; iter: number; times: number }[];
}

export const STEP_LIMIT = 200;

export function compile(program: Block[], limit = STEP_LIMIT): { steps: Step[]; truncated: boolean } {
  const steps: Step[] = [];
  let truncated = false;
  const walk = (blocks: Block[], loops: Step["loops"]) => {
    for (const b of blocks) {
      if (truncated) return;
      if (b.kind === "repeat") {
        for (let i = 1; i <= b.times; i++) {
          walk(b.body, [...loops, { id: b.id, iter: i, times: b.times }]);
          if (truncated) return;
        }
      } else {
        if (steps.length >= limit) {
          truncated = true;
          return;
        }
        steps.push({ action: b.kind, blockId: b.id, loops });
      }
    }
  };
  walk(program, []);
  return { steps, truncated };
}

export function countBlocks(program: Block[]): number {
  return program.reduce((n, b) => n + 1 + (b.kind === "repeat" ? countBlocks(b.body) : 0), 0);
}

/* ───────────────────────── simulation ───────────────────────── */

export type SimStatus = "ready" | "moving" | "success" | "crash" | "edge" | "short" | "missed" | "battery" | "empty";

export interface Sim {
  x: number;
  y: number;
  dir: Dir;
  /** cumulative heading in degrees (keeps rotation animations turning the short way) */
  angle: number;
  collected: string[];
  trail: Pt[];
  status: SimStatus;
  blocked?: Pt;
  /** increments on every bump so the UI can replay a shake animation */
  bumps: number;
}

export function initSim(level: Level): Sim {
  return {
    x: level.start.x,
    y: level.start.y,
    dir: level.start.dir,
    angle: level.start.dir * 90,
    collected: [],
    trail: [{ x: level.start.x, y: level.start.y }],
    status: "ready",
    bumps: 0,
  };
}

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

export function allGems(level: Level, sim: Sim) {
  return sim.collected.length >= level.gems.length;
}

/** Apply one primitive action. Returns the new sim (status: moving | success | crash | edge). */
export function applyAction(level: Level, sim: Sim, action: Action): Sim {
  if (action === "left") return { ...sim, dir: ((sim.dir + 3) % 4) as Dir, angle: sim.angle - 90, status: "moving" };
  if (action === "right") return { ...sim, dir: ((sim.dir + 1) % 4) as Dir, angle: sim.angle + 90, status: "moving" };
  const nx = sim.x + DX[sim.dir];
  const ny = sim.y + DY[sim.dir];
  if (nx < 0 || ny < 0 || nx >= level.w || ny >= level.h) return { ...sim, status: "edge", blocked: { x: nx, y: ny }, bumps: sim.bumps + 1 };
  if (level.rocks.has(key(nx, ny))) return { ...sim, status: "crash", blocked: { x: nx, y: ny }, bumps: sim.bumps + 1 };
  const k = key(nx, ny);
  const gem = level.gems.some((g) => g.x === nx && g.y === ny) && !sim.collected.includes(k);
  const next: Sim = { ...sim, x: nx, y: ny, collected: gem ? [...sim.collected, k] : sim.collected, trail: [...sim.trail, { x: nx, y: ny }], status: "moving" };
  if (nx === level.flag.x && ny === level.flag.y && allGems(level, next)) next.status = "success";
  return next;
}

/** Status once the program has run out of blocks without finishing. */
export function endStatus(level: Level, sim: Sim, truncated: boolean): SimStatus {
  if (sim.status === "success") return "success";
  if (truncated) return "battery";
  if (sim.x === level.flag.x && sim.y === level.flag.y) return "missed";
  return "short";
}

/** Run a whole program instantly (used for checks & tests). */
export function runProgram(level: Level, program: Block[]): Sim {
  const { steps, truncated } = compile(program);
  let sim = initSim(level);
  if (!steps.length) return { ...sim, status: "empty" };
  for (const s of steps) {
    sim = applyAction(level, sim, s.action);
    if (sim.status !== "moving") return sim;
  }
  return { ...sim, status: endStatus(level, sim, truncated) };
}

export function starsFor(level: LevelDef, blocks: number): 1 | 2 | 3 {
  if (blocks <= level.par) return 3;
  if (blocks <= level.par + 2) return 2;
  return 1;
}

/* ───────────────────────── program tree helpers ───────────────────────── */

let seq = 0;
export function newId() {
  seq += 1;
  return `b${seq}`;
}

export function makeBlock(kind: BlockKind): Block {
  return kind === "repeat" ? { id: newId(), kind, times: 3, body: [] } : { id: newId(), kind };
}

/** Build a program quickly from a compact spec, e.g. ["F","F",["R",3,["F","L"]]] */
export type Spec = "F" | "L" | "R" | ["R", number, Spec[]];
export function fromSpec(spec: Spec[]): Block[] {
  return spec.map((s) => {
    if (Array.isArray(s)) return { id: newId(), kind: "repeat", times: s[1], body: fromSpec(s[2]) } as RepeatBlock;
    return { id: newId(), kind: s === "F" ? "forward" : s === "L" ? "left" : "right" } as SimpleBlock;
  });
}

export function findBlock(program: Block[], id: string): Block | null {
  for (const b of program) {
    if (b.id === id) return b;
    if (b.kind === "repeat") {
      const f = findBlock(b.body, id);
      if (f) return f;
    }
  }
  return null;
}

/** Depth of nesting of a container (null = main program → 0). */
export function containerDepth(program: Block[], containerId: string | null): number {
  if (containerId === null) return 0;
  const walk = (blocks: Block[], depth: number): number => {
    for (const b of blocks) {
      if (b.kind === "repeat") {
        if (b.id === containerId) return depth + 1;
        const d = walk(b.body, depth + 1);
        if (d > 0) return d;
      }
    }
    return 0;
  };
  return walk(program, 0);
}

/** Map over every list in the tree; `fn` receives (list, containerId) and returns a new list. */
function mapLists(program: Block[], fn: (list: Block[], containerId: string | null) => Block[], containerId: string | null = null): Block[] {
  const mapped = program.map((b) => (b.kind === "repeat" ? { ...b, body: mapLists(b.body, fn, b.id) } : b));
  return fn(mapped, containerId);
}

export function insertBlock(program: Block[], containerId: string | null, index: number, block: Block): Block[] {
  return mapLists(program, (list, cid) => {
    if (cid !== containerId) return list;
    const i = index < 0 || index > list.length ? list.length : index;
    return [...list.slice(0, i), block, ...list.slice(i)];
  });
}

export function removeBlock(program: Block[], id: string): Block[] {
  return mapLists(program, (list) => list.filter((b) => b.id !== id));
}

export function moveWithin(program: Block[], id: string, delta: -1 | 1): Block[] {
  return mapLists(program, (list) => {
    const i = list.findIndex((b) => b.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
}

export function setTimes(program: Block[], id: string, times: number): Block[] {
  return mapLists(program, (list) => list.map((b) => (b.id === id && b.kind === "repeat" ? { ...b, times } : b)));
}

/** Is `id` the block `ancestorId` itself or nested anywhere inside it? */
export function isInside(program: Block[], ancestorId: string, id: string): boolean {
  const anc = findBlock(program, ancestorId);
  if (!anc) return false;
  if (anc.id === id) return true;
  return anc.kind === "repeat" && !!findBlock(anc.body, id);
}

/** Move an existing block to (containerId, index). No-op when dropping a repeat into itself. */
export function relocate(program: Block[], id: string, containerId: string | null, index: number): Block[] {
  const block = findBlock(program, id);
  if (!block) return program;
  if (containerId && isInside(program, id, containerId)) return program;
  // index is relative to the target list *before* removal — adjust when moving down inside the same list
  let target = index;
  const sameList = mapListsFind(program, containerId);
  const from = sameList ? sameList.findIndex((b) => b.id === id) : -1;
  if (from >= 0 && from < index) target -= 1;
  return insertBlock(removeBlock(program, id), containerId, target, block);
}

function mapListsFind(program: Block[], containerId: string | null): Block[] | null {
  if (containerId === null) return program;
  const c = findBlock(program, containerId);
  return c && c.kind === "repeat" ? c.body : null;
}

export function listOf(program: Block[], containerId: string | null): Block[] {
  return mapListsFind(program, containerId) ?? [];
}

/** Find which container a block lives in. */
export function parentOf(program: Block[], id: string, containerId: string | null = null): string | null | undefined {
  for (const b of program) {
    if (b.id === id) return containerId;
    if (b.kind === "repeat") {
      const p = parentOf(b.body, id, b.id);
      if (p !== undefined) return p;
    }
  }
  return undefined;
}
