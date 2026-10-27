/**
 * Every part of JOVE's kits that goes on the bench, at its real size, with its pins where the real ones are.
 * Pin spacing is the standard 2.54 mm (0.254 cm), so a leg lands exactly in a breadboard hole.
 * Kit lists: OPERATIONS/06_ROBOTICS_KITS/kit_bom.csv.
 */
import type { PartDef, PartType, PinDef } from "./types";

export const PITCH = 0.254;
const UP: [number, number, number] = [0, 1, 0];
const DOWN: [number, number, number] = [0, -1, 0];

/* ── the breadboards ── */

const ROWS = "abcdefghij".split("");
/** A hole's position on a 17-column mini breadboard (origin at its centre, top surface). */
export function holeAt(col: number, row: string, cols = 17): [number, number, number] {
  const ri = ROWS.indexOf(row);
  const x = (col - (cols + 1) / 2) * PITCH;
  const z = ri < 5 ? -PITCH * (5 - ri) : PITCH * (ri - 4);
  return [x, 0.85, z];
}

function breadboard(cols: number): Pick<PartDef, "pins" | "internal"> {
  const pins: PinDef[] = [];
  const internal: string[][] = [];
  for (let c = 1; c <= cols; c++) {
    for (const r of ROWS) pins.push({ id: `${r}${c}`, label: `${r.toUpperCase()}${c}`, at: holeAt(c, r, cols), out: UP });
    // the five holes of each half-column are one metal strip underneath
    internal.push("abcde".split("").map((r) => `${r}${c}`), "fghij".split("").map((r) => `${r}${c}`));
  }
  return { pins, internal };
}

/* ── the boards' headers ── */

function row(ids: string[], x0: number, z: number, y: number, out = UP): PinDef[] {
  return ids.map((id, i) => ({ id, label: id, at: [x0 + i * PITCH, y, z] as [number, number, number], out }));
}

const UNO_DIGITAL = [...row(["AREF", "GND.1", "D13", "D12", "D11", "D10", "D9", "D8"], -0.95, -2.42, 1.05), ...row(["D7", "D6", "D5", "D4", "D3", "D2", "D1", "D0"], 1.2, -2.42, 1.05)];
const UNO_POWER = [...row(["IOREF", "RESET", "3V3", "5V", "GND", "GND.2", "VIN"], -0.4, 2.42, 1.05), ...row(["A0", "A1", "A2", "A3", "A4", "A5"], 1.75, 2.42, 1.05)];

const ESP_LEFT = ["3V3", "GND", "GPIO15", "GPIO2", "GPIO4", "GPIO16", "GPIO17", "GPIO5", "GPIO18", "GPIO19", "GPIO21", "RX", "TX", "GPIO22", "GPIO23"];
const ESP_RIGHT = ["VIN", "GND.2", "GPIO13", "GPIO12", "GPIO14", "GPIO27", "GPIO26", "GPIO25", "GPIO33", "GPIO32", "GPIO35", "GPIO34", "GPIO39", "GPIO36", "EN"];

/* ── the parts ── */

const DEFS: PartDef[] = [
  {
    type: "battery2",
    name: "2 × AA battery box with switch",
    kits: ["Spark"],
    job: "Two cells give 3 volts. The switch on top turns the circuit on and off.",
    size: [5.8, 1.6, 3.2],
    pins: [
      { id: "+", label: "+ (red lead)", at: [4.6, 0.4, -0.5], out: [1, 0, 0] },
      { id: "-", label: "− (black lead)", at: [4.6, 0.4, 0.5], out: [1, 0, 0] },
    ],
  },
  {
    type: "battery4",
    name: "4 × AA battery box with switch",
    kits: ["Explorer"],
    job: "Four cells give 6 volts for the motors and the sensor circuit.",
    size: [6.2, 1.7, 5.8],
    pins: [
      { id: "+", label: "+ (red lead)", at: [4.8, 0.45, -0.5], out: [1, 0, 0] },
      { id: "-", label: "− (black lead)", at: [4.8, 0.45, 0.5], out: [1, 0, 0] },
    ],
  },
  {
    type: "battery6",
    name: "6 × AA battery box",
    kits: ["Builder"],
    job: "Six cells give 9 volts: enough for two motors and the Arduino through the shield.",
    size: [8.0, 1.7, 5.8],
    pins: [
      { id: "+", label: "+ (red lead)", at: [5.6, 0.45, -0.5], out: [1, 0, 0] },
      { id: "-", label: "− (black lead)", at: [5.6, 0.45, 0.5], out: [1, 0, 0] },
    ],
  },
  {
    type: "led",
    name: "5 mm LED",
    kits: ["Spark", "Explorer", "Builder"],
    job: "Lights up when current flows from the long leg (+) to the short leg (−). Backwards, it stays dark.",
    size: [0.5, 1.4, 0.5],
    pins: [
      { id: "+", label: "long leg (+)", at: [0, 0, 0], out: DOWN },
      { id: "-", label: "short leg (−)", at: [PITCH, 0, 0], out: DOWN },
    ],
  },
  {
    type: "resistor",
    name: "Resistor",
    kits: ["Explorer", "Builder"],
    job: "Slows the current down, like a speed-breaker, so an LED or a transistor is not damaged.",
    size: [1.1, 0.4, 0.3],
    pins: [
      { id: "a", label: "end 1", at: [0, 0, 0], out: DOWN },
      { id: "b", label: "end 2", at: [4 * PITCH, 0, 0], out: DOWN },
    ],
  },
  {
    type: "buzzer",
    name: "Mini buzzer",
    kits: ["Spark", "Builder"],
    job: "Beeps when current flows through it. The + leg is marked on top.",
    size: [1.2, 0.9, 1.2],
    pins: [
      { id: "+", label: "+ leg", at: [0, 0, 0], out: DOWN },
      { id: "-", label: "− leg", at: [3 * PITCH, 0, 0], out: DOWN },
    ],
  },
  {
    type: "minimotor",
    name: "Mini DC motor (with fan)",
    kits: ["Spark"],
    job: "Spins when current flows. Swap the two leads and it spins the other way.",
    size: [2.6, 2.0, 2.0],
    pins: [
      { id: "a", label: "terminal 1", at: [-1.45, 0.55, -0.35], out: [-1, 0, 0] },
      { id: "b", label: "terminal 2", at: [-1.45, 0.55, 0.35], out: [-1, 0, 0] },
    ],
  },
  {
    type: "bomotor",
    name: "BO geared motor and wheel",
    kits: ["Explorer", "Builder"],
    job: "A slow, strong motor with a gearbox, for driving a wheel.",
    size: [7.0, 6.5, 2.4],
    pins: [
      { id: "a", label: "terminal 1", at: [-3.2, 1.6, -0.35], out: [-1, 0, 0] },
      { id: "b", label: "terminal 2", at: [-3.2, 1.6, 0.35], out: [-1, 0, 0] },
    ],
  },
  {
    type: "ldr",
    name: "Light sensor (LDR)",
    kits: ["Explorer"],
    job: "Lets more current through in bright light, less in the dark: the robot's eye.",
    size: [0.5, 0.9, 0.5],
    pins: [
      { id: "a", label: "leg 1", at: [0, 0, 0], out: DOWN },
      { id: "b", label: "leg 2", at: [PITCH, 0, 0], out: DOWN },
    ],
  },
  {
    type: "bc547",
    name: "BC547 transistor",
    kits: ["Explorer"],
    job: "An electronic switch: a small current into B lets a big current flow from C to E. Flat face towards you: C, B, E.",
    size: [0.5, 1.0, 0.4],
    pins: [
      { id: "C", label: "C (collector)", at: [0, 0, 0], out: DOWN },
      { id: "B", label: "B (base)", at: [PITCH, 0, 0], out: DOWN },
      { id: "E", label: "E (emitter)", at: [2 * PITCH, 0, 0], out: DOWN },
    ],
  },
  {
    type: "breadboard",
    name: "Mini breadboard (170 holes)",
    kits: ["Explorer", "Builder"],
    job: "Joins parts without glue or solder. The five holes of each short row are joined by a metal strip underneath.",
    size: [4.6, 0.85, 3.5],
    ...breadboard(17),
  },
  {
    type: "uno",
    name: "Arduino Uno (CH340)",
    kits: ["Builder"],
    job: "The brain: runs the program you upload over USB, and reads and drives its pins.",
    size: [6.86, 1.1, 5.34],
    pins: [...UNO_DIGITAL, ...UNO_POWER],
    internal: [["GND.1", "GND", "GND.2"]],
  },
  {
    type: "unoShield",
    name: "Arduino Uno + L293D motor shield",
    kits: ["Builder"],
    job: "The shield sits on the Uno and gives the motors battery power when the program says so: M1 and M2 for the wheels, SERVO1 for the servo.",
    size: [6.86, 2.0, 5.34],
    pins: [
      { id: "M1a", label: "M1 (1)", at: [-3.05, 1.75, -1.75], out: [-1, 0, 0] },
      { id: "M1b", label: "M1 (2)", at: [-3.05, 1.75, -1.25], out: [-1, 0, 0] },
      { id: "M2a", label: "M2 (1)", at: [-3.05, 1.75, -0.45], out: [-1, 0, 0] },
      { id: "M2b", label: "M2 (2)", at: [-3.05, 1.75, 0.05], out: [-1, 0, 0] },
      { id: "EXT+", label: "EXT_PWR +", at: [-3.05, 1.75, 1.1], out: [-1, 0, 0] },
      { id: "EXT-", label: "EXT_PWR −", at: [-3.05, 1.75, 1.6], out: [-1, 0, 0] },
      ...row(["SERVO1.S", "SERVO1.+", "SERVO1.-"], 2.7, -2.0, 2.05),
      ...row(["5V", "GND"], -0.2, 2.42, 2.05),
      ...row(["A0", "A1", "A2", "A3", "A4", "A5"], 1.75, 2.42, 2.05),
    ],
  },
  {
    type: "hcsr04",
    name: "HC-SR04 ultrasonic sensor",
    kits: ["Builder", "Innovator"],
    job: "Sends a sound pulse and times the echo: the time tells how far away something is.",
    size: [4.5, 2.0, 1.5],
    pins: [
      { id: "VCC", label: "VCC", at: [-1.5 * PITCH, 0, 0], out: DOWN },
      { id: "TRIG", label: "TRIG", at: [-0.5 * PITCH, 0, 0], out: DOWN },
      { id: "ECHO", label: "ECHO", at: [0.5 * PITCH, 0, 0], out: DOWN },
      { id: "GND", label: "GND", at: [1.5 * PITCH, 0, 0], out: DOWN },
    ],
  },
  {
    type: "sg90",
    name: "SG90 micro servo",
    kits: ["Builder", "Innovator"],
    job: "Turns to an exact angle, 0° to 180°, when told by the signal wire.",
    size: [2.3, 2.9, 1.2],
    pins: [
      { id: "S", label: "signal (orange)", at: [-2.6, 0.9, -0.25], out: [-1, 0, 0] },
      { id: "+", label: "+ (red)", at: [-2.6, 0.9, 0], out: [-1, 0, 0] },
      { id: "-", label: "− (brown)", at: [-2.6, 0.9, 0.25], out: [-1, 0, 0] },
    ],
  },
  {
    type: "irsensor",
    name: "IR line sensor",
    kits: ["Builder"],
    job: "Sees whether the floor under it is light or dark, to follow a black line.",
    size: [3.2, 0.8, 1.4],
    pins: row(["VCC", "GND", "OUT"], -1.55, 0, 0.3, [-1, 0, 0]),
  },
  {
    type: "esp32",
    name: "ESP32 DevKit (WROOM-32)",
    kits: ["Innovator"],
    job: "A fast brain with Wi-Fi: runs the server that moves the pan-tilt servos.",
    size: [5.1, 1.3, 2.8],
    pins: [...ESP_LEFT.map((id, i) => ({ id, label: id, at: [-1.8 + i * PITCH, 1.2, -1.15] as [number, number, number], out: UP })), ...ESP_RIGHT.map((id, i) => ({ id, label: id, at: [-1.8 + i * PITCH, 1.2, 1.15] as [number, number, number], out: UP }))],
    internal: [["GND", "GND.2"]],
  },
  {
    type: "esp32cam",
    name: "ESP32-CAM on its MB programmer",
    kits: ["Innovator"],
    job: "A small camera with Wi-Fi: streams video for the AI model in the browser.",
    size: [2.7, 4.0, 1.0],
    pins: [
      { id: "5V", label: "5V", at: [-0.6, 0, 0], out: DOWN },
      { id: "GND", label: "GND", at: [0.6, 0, 0], out: DOWN },
    ],
  },
  {
    type: "oled",
    name: "0.96″ OLED display",
    kits: ["Innovator"],
    job: "A tiny screen: shows what the robot sees, like “Left 93%”.",
    size: [2.7, 0.4, 2.7],
    pins: row(["GND", "VCC", "SCL", "SDA"], -0.381, -1.15, 0.45),
  },
  {
    type: "power5v",
    name: "5 V power module",
    kits: ["Innovator"],
    job: "Gives steady 5 volts for the servos, which need more current than a board pin can give.",
    size: [3.5, 1.2, 5.3],
    pins: [
      { id: "+5V", label: "+5V", at: [1.2, 1.0, -2.2], out: UP },
      { id: "GND", label: "GND", at: [1.2, 1.0, -1.8], out: UP },
    ],
  },
  { type: "chassis", name: "Robot car chassis", kits: ["Explorer", "Builder"], job: "The body that holds the motors, wheels, castor and battery.", size: [16, 0.3, 11], pins: [] },
  { type: "robotBody", name: "Cardboard Robot Buddy", kits: ["Spark"], job: "The robot you pop out, fold and decorate. The light and the fan hat go on it.", size: [6, 9, 4], pins: [] },
  { type: "torch", name: "Torch", kits: [], job: "Drag it around: the light-seeking car follows it.", size: [2.5, 2.5, 9], pins: [] },
];

export const PARTS: Record<PartType, PartDef> = Object.fromEntries(DEFS.map((d) => [d.type, d])) as Record<PartType, PartDef>;

export const pinOf = (type: PartType, pin: string) => PARTS[type].pins.find((p) => p.id === pin);
