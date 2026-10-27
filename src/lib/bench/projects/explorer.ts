/**
 * Grades 3–5 · Explorer Kit: Mission 1 on the breadboard, then the light-seeking car, wired as in the
 * Young Makers deck (src/lib/decks/young.ts): each eye → 1 kΩ → BC547 base; the transistor switches the motor on the
 * other side, so the car turns towards the torch.
 */
import type { BenchProject, PlacedPart } from "../types";
import { inBoard } from "./place";

/* ── Mission 1: light one LED ── */

const bb1: PlacedPart = { id: "bb", type: "breadboard", at: [1.5, 0, 0] };

export const missionProject: BenchProject = {
  id: "first-led",
  title: "Mission 1: Light one LED",
  audience: "Grades 3–5 · Explorer Kit",
  kit: "Explorer",
  summary: "Your first breadboard circuit: a battery, a resistor and an LED. Learn how the hidden strips join the holes.",
  public: true,
  behaviour: "spark",
  parts: [
    { id: "bat", type: "battery4", at: [-9, 0, 0] },
    bb1,
    inBoard(bb1, "b2", { id: "r", type: "resistor", props: { value: "220 Ω", label: "220 Ω resistor" } }),
    inBoard(bb1, "d6", { id: "led", type: "led", props: { color: "#ff3b30", label: "Red LED" } }),
  ],
  camera: { at: [-1, 12, 13], look: [-1.5, 0.5, 0] },
  steps: [
    { title: "Meet the parts", text: "A 4 × AA battery box (6 volts), a breadboard, a resistor and an LED.", place: ["bat", "bb"], tip: "Click any part to read what it does." },
    { title: "The secret strips", text: "Each short line of 5 holes (A–E, or F–J, in one column) is joined underneath by a metal strip. Two legs in the same line are connected.", tip: "Hover over the holes: they light up and show their names." },
    { title: "Resistor in", text: "Push the resistor's legs into B2 and B6. It is the speed-breaker that protects the LED.", place: ["r"] },
    { title: "LED in", text: "LED long leg (+) into D6, in the same line as the resistor's end. Short leg (−) into D7.", place: ["led"], tip: "Long leg = + . The LED only lights one way round." },
    { title: "Red wire: + to the resistor", text: "Run the red jumper from the battery's + lead to hole A2, in the resistor's line.", wires: [{ from: "bat.+", to: "bb.a2", color: "red" }] },
    { title: "Black wire: back to −", text: "Run the black jumper from hole A7 (the LED's short-leg line) back to the battery's − lead. The circle is complete.", wires: [{ from: "bb.a7", to: "bat.-", color: "black" }] },
    { title: "Switch ON", text: "Slide the battery switch on. Predict first: will it glow?", run: true, tip: "No glow? Check the LED's long leg is in the resistor's line." },
    { title: "Try it yourself", text: "Switch to Free wiring and break the circuit on purpose: pull out a wire, or try without the resistor. Watch what the bench says.", run: true },
  ],
};

/* ── The light-seeking car ── */

const bb: PlacedPart = { id: "bb", type: "breadboard", at: [3.6, 3.75, 0], turn: -90 };
const L = { ldr: "ldrL", r: "rL", q: "qL" };
const R = { ldr: "ldrR", r: "rR", q: "qR" };

export const seekerProject: BenchProject = {
  id: "light-seeker",
  title: "Light-seeking Car",
  audience: "Grades 3–5 · Explorer Kit",
  kit: "Explorer",
  summary: "Two light sensors, two transistors and two motors: a car with no code that chases a torch.",
  behaviour: "seeker",
  parts: [
    { id: "chassis", type: "chassis", at: [0, 0, 0] },
    { id: "mR", type: "bomotor", at: [-3.5, 0, 4.4], props: { label: "Right motor" } },
    { id: "mL", type: "bomotor", at: [-1.5, 0, -4.4], turn: 180, props: { label: "Left motor" } },
    { id: "bat", type: "battery4", at: [-4.6, 3.75, 0] },
    bb,
    inBoard(bb, "a2", { id: L.ldr, type: "ldr", props: { label: "Left eye" } }),
    inBoard(bb, "c3", { id: L.r, type: "resistor", props: { value: "1 kΩ", label: "1 kΩ (left)" } }),
    inBoard(bb, "e6", { id: L.q, type: "bc547", props: { label: "Left transistor" } }),
    inBoard(bb, "a10", { id: R.ldr, type: "ldr", props: { label: "Right eye" } }),
    inBoard(bb, "c11", { id: R.r, type: "resistor", props: { value: "1 kΩ", label: "1 kΩ (right)" } }),
    inBoard(bb, "e14", { id: R.q, type: "bc547", props: { label: "Right transistor" } }),
  ],
  camera: { at: [14, 20, 18], look: [0, 3, 0] },
  steps: [
    { title: "Motors and wheels", text: "Screw a BO motor on each side of the chassis, shafts out, and push on the wheels.", place: ["chassis", "mL", "mR"], tip: "Wires from the motors point toward the middle." },
    { title: "Battery and breadboard", text: "The 4 × AA box at the back, the breadboard at the front. Cells in, switch OFF.", place: ["bat", "bb"], tip: "Trainer checks the + and − marks before the cells go in." },
    { title: "Power lines", text: "Battery + into J1 and − into J17. Now column 1 (F–J) is the + line and column 17 (F–J) the − line.", wires: [{ from: "bat.+", to: "bb.j1", color: "red" }, { from: "bat.-", to: "bb.j17", color: "black" }] },
    { title: "Left eye: sensor, resistor, transistor", text: "Light sensor in A2–A3. 1 kΩ resistor from C3 to C7. BC547 in E6, E7, E8: flat face toward you, C · B · E.", place: [L.ldr, L.r, L.q], tip: "The resistor joins the sensor to the transistor's middle leg (base)." },
    { title: "Feed the left eye", text: "Red jumper from F1 (the + line) to B2, the sensor's first leg.", wires: [{ from: "bb.f1", to: "bb.b2", color: "red" }] },
    { title: "Transistor E to −", text: "Black jumper from B8 (the E leg's line) to I17 (the − line).", wires: [{ from: "bb.b8", to: "bb.i17", color: "black" }] },
    { title: "Join the right motor", text: "Right motor: one wire to G1 (+), the other to B6 (the C leg's line). Switch ON and shine the torch on the left eye.", wires: [{ from: "bb.g1", to: "mR.a", color: "red" }, { from: "mR.b", to: "bb.b6", color: "blue" }], run: true, tip: "Test one side before building the other: faults are easier to find in half a circuit." },
    { title: "Mirror it: the right eye", text: "Sensor in A10–A11, resistor C11 to C15, transistor in E14–E16. Then H1 → B10, B16 → H17.", place: [R.ldr, R.r, R.q], wires: [{ from: "bb.h1", to: "bb.b10", color: "red" }, { from: "bb.b16", to: "bb.h17", color: "black" }] },
    { title: "Join the left motor", text: "Left motor: one wire to I1 (+), the other to B14 (the right transistor's C).", wires: [{ from: "bb.i1", to: "mL.a", color: "red" }, { from: "mL.b", to: "bb.b14", color: "blue" }], run: true, tip: "The eyes cross over: the left eye drives the right wheel." },
    { title: "Torch race!", text: "Press Drive. Drag the torch around the floor: the car turns toward the light.", run: true, tip: "Runs away from the light? Swap the left and right motor wires." },
  ],
};
