/**
 * What the circuit on the bench does: which pins are joined (wires, breadboard strips, legs pushed into holes),
 * then which parts light, spin or beep, and what is wrong when they do not.
 *
 * Battery circuits are solved as paths: a part works when current can go from the battery's + through it and on
 * to −. LEDs and buzzers only conduct one way; a light sensor conducts when lit; a transistor conducts C→E when
 * its base is fed from + through a lit sensor and a resistor. This is enough for every JOVE Spark and Explorer
 * build, and it explains mistakes in the words a trainer would use.
 */
import { PARTS, pinOf } from "./parts";
import type { PlacedPart, Wire } from "./types";

export type Vec3 = [number, number, number];

/** A pin's position on the bench, with the part's turn applied. */
export function pinWorld(p: PlacedPart, pinId: string): Vec3 | null {
  const pin = pinOf(p.type, pinId);
  if (!pin) return null;
  const a = ((p.turn ?? 0) * Math.PI) / 180;
  const [x, y, z] = pin.at;
  return [p.at[0] + x * Math.cos(a) + z * Math.sin(a), p.at[1] + y, p.at[2] - x * Math.sin(a) + z * Math.cos(a)];
}

/** Union-find over "part.pin" keys. */
class Nets {
  private parent = new Map<string, string>();
  find(k: string): string {
    if (!this.parent.has(k)) this.parent.set(k, k);
    let r = k;
    while (this.parent.get(r) !== r) r = this.parent.get(r)!;
    this.parent.set(k, r);
    return r;
  }
  join(a: string, b: string) {
    const ra = this.find(a), rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
  same(a: string, b: string) {
    return this.find(a) === this.find(b);
  }
}

/** Joins pins by wires, by each part's own internal links, and by legs that sit in a breadboard hole. */
export function buildNets(parts: PlacedPart[], wires: Wire[]): Nets {
  const nets = new Nets();
  for (const w of wires) nets.join(w.from, w.to);
  for (const p of parts) for (const group of PARTS[p.type].internal ?? []) for (let i = 1; i < group.length; i++) nets.join(`${p.id}.${group[0]}`, `${p.id}.${group[i]}`);
  // a leg pointing down that ends on a breadboard hole is in it
  const holes: { key: string; at: Vec3 }[] = [];
  for (const b of parts.filter((p) => p.type === "breadboard")) for (const pin of PARTS.breadboard.pins) holes.push({ key: `${b.id}.${pin.id}`, at: pinWorld(b, pin.id)! });
  for (const p of parts) {
    if (p.type === "breadboard") continue;
    for (const pin of PARTS[p.type].pins) {
      if (!pin.out || pin.out[1] !== -1) continue;
      const at = pinWorld(p, pin.id)!;
      const hole = holes.find((h) => Math.abs(h.at[0] - at[0]) < 0.06 && Math.abs(h.at[2] - at[2]) < 0.06 && Math.abs(h.at[1] - at[1]) < 0.3);
      if (hole) nets.join(`${p.id}.${pin.id}`, hole.key);
    }
  }
  return nets;
}

export interface DeviceState {
  on: boolean;
  /** motor direction, +1 or −1 */
  dir?: number;
  /** an LED with too much current */
  burnt?: boolean;
}

export interface CircuitResult {
  devices: Record<string, DeviceState>;
  issues: { level: "bad" | "warn" | "ok"; text: string }[];
  short: boolean;
  nets: Nets;
}

interface Edge {
  part: string;
  from: string; // net
  to: string; // net
}

const VOLTS: Partial<Record<string, number>> = { battery2: 3, battery4: 6, battery6: 9 };

/**
 * Solves a battery circuit. `switchOn` closes the battery boxes' switches; `light` gives each light sensor's
 * brightness, 0 (dark) to 1 (torch on it).
 */
export function solve(parts: PlacedPart[], wires: Wire[], o: { switchOn: boolean; light?: Record<string, number> }): CircuitResult {
  const nets = buildNets(parts, wires);
  const issues: CircuitResult["issues"] = [];
  const devices: Record<string, DeviceState> = {};
  const batteries = parts.filter((p) => p.type in VOLTS);
  const net = (p: PlacedPart, pin: string) => nets.find(`${p.id}.${pin}`);
  let short = false;

  for (const bat of batteries) {
    const plus = net(bat, "+"), minus = net(bat, "-");
    if (plus === minus) {
      short = true;
      issues.push({ level: "bad", text: "Short circuit: the battery's + and − are joined by a wire alone. Nothing works, and a real battery gets hot. Remove that wire." });
    }
  }

  // conducting links; transistors are decided in two passes (first their bases, then their C→E)
  const lit = (p: PlacedPart) => (o.light?.[p.id] ?? 0) > 0.35;
  const links = (transistorOn: Set<string>, without?: string): { fwd: Edge[] } => {
    const fwd: Edge[] = [];
    const both = (p: PlacedPart, a: string, b: string) => {
      fwd.push({ part: p.id, from: net(p, a), to: net(p, b) }, { part: p.id, from: net(p, b), to: net(p, a) });
    };
    for (const p of parts) {
      if (p.id === without) continue;
      if (p.type === "resistor") both(p, "a", "b");
      else if (p.type === "minimotor" || p.type === "bomotor") both(p, "a", "b");
      else if (p.type === "led" || p.type === "buzzer") fwd.push({ part: p.id, from: net(p, "+"), to: net(p, "-") });
      else if (p.type === "ldr" && lit(p)) both(p, "a", "b");
      else if (p.type === "bc547" && transistorOn.has(p.id)) fwd.push({ part: p.id, from: net(p, "C"), to: net(p, "E") });
    }
    return { fwd };
  };
  const reach = (start: string, edges: Edge[], reverse = false) => {
    const seen = new Set([start]);
    const todo = [start];
    while (todo.length) {
      const n = todo.pop()!;
      for (const e of edges) {
        const [a, b] = reverse ? [e.to, e.from] : [e.from, e.to];
        if (a === n && !seen.has(b)) {
          seen.add(b);
          todo.push(b);
        }
      }
    }
    return seen;
  };

  if (!o.switchOn || short) {
    for (const p of parts) devices[p.id] = { on: false };
  } else {
    // pass 1: which transistor bases are fed from + (through a resistor and/or a lit sensor) with E going to −
    const transistorOn = new Set<string>();
    for (let pass = 0; pass < 2; pass++) {
      for (const bat of batteries) {
        const { fwd } = links(transistorOn);
        const fromPlus = reach(net(bat, "+"), fwd);
        for (const q of parts.filter((p) => p.type === "bc547")) {
          if (fromPlus.has(net(q, "B")) && net(q, "E") === net(bat, "-")) transistorOn.add(q.id);
        }
      }
    }
    // pass 2: each load works when + reaches one end and the other end reaches −, not counting itself
    for (const p of parts) {
      if (!["led", "buzzer", "minimotor", "bomotor", "resistor"].includes(p.type)) continue;
      let state: DeviceState = { on: false };
      for (const bat of batteries) {
        const { fwd } = links(transistorOn, p.id);
        const fromPlus = reach(net(bat, "+"), fwd);
        const toMinus = reach(net(bat, "-"), fwd, true);
        const [a, b] = p.type === "led" || p.type === "buzzer" ? ["+", "-"] : ["a", "b"];
        const forward = fromPlus.has(net(p, a)) && toMinus.has(net(p, b));
        const backward = fromPlus.has(net(p, b)) && toMinus.has(net(p, a));
        if (forward) state = { on: true, dir: 1 };
        else if (backward && (p.type === "minimotor" || p.type === "bomotor" || p.type === "resistor")) state = { on: true, dir: -1 };
        else if (backward && p.type === "led") issues.push({ level: "warn", text: "An LED is the wrong way round: it only lights when its long leg (+) is on the battery's + side. Turn it around." });
        if (state.on && p.type === "led" && (VOLTS[bat.type] ?? 0) >= 4.5) {
          // an LED on 6 V or more needs a resistor in its path
          const { fwd: noRes } = links(transistorOn, p.id);
          const withoutResistors = noRes.filter((e) => !parts.find((x) => x.id === e.part && x.type === "resistor"));
          const direct = reach(net(bat, "+"), withoutResistors).has(net(p, a)) && reach(net(bat, "-"), withoutResistors, true).has(net(p, b));
          if (direct) {
            state = { on: false, burnt: true };
            issues.push({ level: "bad", text: `No resistor in the LED's path: on ${VOLTS[bat.type]} volts it burns out. Put a resistor between the battery and the LED.` });
          }
        }
        if (state.on) break;
      }
      devices[p.id] = state;
    }
    for (const q of parts.filter((p) => p.type === "bc547")) devices[q.id] = { on: transistorOn.has(q.id) };
  }

  // an open loop: something is wired to + but nothing comes back to −
  const LOADS = ["led", "buzzer", "minimotor", "bomotor"];
  const working = parts.some((p) => LOADS.includes(p.type) && devices[p.id]?.on);
  const eyes = parts.filter((p) => p.type === "ldr");
  if (o.switchOn && !short && eyes.length && !eyes.some(lit) && !working) {
    issues.push({ level: "warn", text: "The light sensors are in the dark, so the transistors stay off. Shine the torch on an eye." });
  } else if (o.switchOn && !short && parts.some((p) => LOADS.includes(p.type)) && !working) {
    issues.push({ level: "warn", text: "Nothing is working yet: the circle is not complete. Follow the path from + through each part and back to −." });
  }
  if (!issues.length && working) issues.push({ level: "ok", text: "The circuit is complete: current flows from + through the parts and back to −." });
  return { devices, issues, short, nets };
}

/** Whether two pins end up on the same net (for the Arduino and ESP32 builds, which check their wiring). */
export function joined(parts: PlacedPart[], wires: Wire[], a: string, b: string) {
  return buildNets(parts, wires).same(a, b);
}
