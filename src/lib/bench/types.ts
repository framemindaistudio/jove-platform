/**
 * The JOVE Bench: a 3D workbench where the parts of JOVE's own kits are placed, wired pin to pin and run.
 * Parts and projects are data; src/components/bench draws them and lib/bench/circuit.ts decides what happens.
 *
 * Units: centimetres in the 3D world (a 5 mm LED is 0.5), x to the right, y up, z towards the viewer.
 */

export type PartType =
  | "battery2"
  | "battery4"
  | "battery6"
  | "led"
  | "resistor"
  | "buzzer"
  | "minimotor"
  | "bomotor"
  | "ldr"
  | "bc547"
  | "breadboard"
  | "uno"
  | "unoShield"
  | "hcsr04"
  | "sg90"
  | "irsensor"
  | "esp32"
  | "esp32cam"
  | "oled"
  | "power5v"
  | "chassis"
  | "torch"
  | "robotBody";

/** A pin: where its tip is, relative to the part's origin (cm), and what it is. */
export interface PinDef {
  id: string;
  label: string;
  at: [number, number, number];
  /** the side a wire leaves from (unit vector), so wires bend away from the part */
  out?: [number, number, number];
}

export interface PartDef {
  type: PartType;
  name: string;
  /** which JOVE kits carry it */
  kits: ("Spark" | "Explorer" | "Builder" | "Innovator")[];
  /** one line on what it does, shown when the part is selected */
  job: string;
  /** footprint (cm) for placing and the selection box */
  size: [number, number, number];
  pins: PinDef[];
  /** pins joined inside the part (a breadboard strip, both ends of a switch when on) */
  internal?: string[][];
}

export interface PlacedPart {
  id: string;
  type: PartType;
  /** where its origin sits on the bench (cm) */
  at: [number, number, number];
  /** turn about the vertical axis, degrees */
  turn?: number;
  /** LED colour, resistor value, motor with a fan… */
  props?: { color?: string; value?: string; fan?: boolean; label?: string };
}

export type WireColor = "red" | "black" | "yellow" | "green" | "blue" | "orange" | "white" | "brown" | "purple";

export interface Wire {
  from: string; // "partId.pinId"
  to: string;
  color: WireColor;
  /** crocodile-clip lead (Spark kit) rather than a jumper wire */
  clip?: boolean;
}

/** One step of a guided build. */
export interface BuildStep {
  title: string;
  text: string;
  /** parts that appear on the bench at this step */
  place?: string[];
  /** wires the learner makes at this step, pin to pin */
  wires?: Wire[];
  /** a tip shown with the step */
  tip?: string;
  /** turn the circuit on at this step (closes the switch, starts the program) */
  run?: boolean;
}

export type Behaviour = "spark" | "seeker" | "blink" | "avoider" | "pantilt" | "missions";

export interface BenchProject {
  id: string;
  title: string;
  /** "Grades 3–5 · Explorer Kit" */
  audience: string;
  kit: "Spark" | "Explorer" | "Builder" | "Innovator";
  summary: string;
  /** shown on the public Virtual Labs too */
  public?: boolean;
  parts: PlacedPart[];
  steps: BuildStep[];
  behaviour: Behaviour;
  /** the Arduino / ESP32 sketch shown in the Code panel */
  code?: string;
  /** where the camera starts: position and target (cm) */
  camera?: { at: [number, number, number]; look: [number, number, number] };
}
