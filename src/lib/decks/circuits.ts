/**
 * The wiring pictures used in the build tutorials, one builder per circuit, so each step of a build can show the
 * same picture with one more wire added. Pins and colours follow the kits' assembly instructions
 * (OPERATIONS/06_ROBOTICS_KITS) and the code libraries' pin maps (02_CURRICULUM/*\/08_Code_Library.md).
 */
import type { Diagram, PartSpec, Wire } from "./types";

/* ── Spark Kit (Grades 1–2): battery holder → switch → LED / motor / buzzer, joined with crocodile clips ── */

export type SparkStage = "battery" | "red1" | "red2" | "closed" | "glow" | "fan" | "buzzer" | "open";

export function sparkCircuit(stage: SparkStage): Diagram {
  const parts: PartSpec[] = [
    { id: "bat", type: "battery", cells: 2, x: 150, y: 200, label: "Battery" },
    { id: "sw", type: "switch", x: 330, y: 380, label: "Switch", on: stage === "glow" || stage === "fan" || stage === "buzzer" },
  ];
  const wires: Wire[] = [];
  const on = stage === "glow" || stage === "buzzer";
  if (stage === "fan") parts.push({ id: "mot", type: "motor", fan: true, x: 520, y: 150, label: "Motor + fan", on: true, color: "#e08a1e" });
  else if (stage !== "battery") parts.push({ id: "led", type: "led", color: "#e03131", x: 580, y: 130, label: "LED", labelAt: [76, 70], on });
  if (stage === "buzzer") parts.push({ id: "bz", type: "buzzer", x: 720, y: 140, label: "Buzzer", labelAt: [100, 120], on: true });

  if (stage !== "battery") wires.push({ from: "bat.+", to: "sw.a", color: "red" });
  if (stage === "fan") {
    wires.push({ from: "sw.b", to: "mot.a", color: "red" }, { from: "mot.b", to: "bat.-", color: "black", via: [[590, 540]] });
  } else {
    if (["red2", "closed", "glow", "buzzer", "open"].includes(stage)) wires.push({ from: "sw.b", to: "led.+", color: "red", label: stage === "red2" ? "long leg" : undefined });
    if (["closed", "glow", "buzzer"].includes(stage)) wires.push({ from: "led.-", to: "bat.-", color: "black", via: [[620, 540]], label: stage === "closed" ? "short leg → back home" : undefined, labelAt: [430, 540] });
    if (stage === "buzzer") wires.push({ from: "led.+", to: "bz.+", color: "red" }, { from: "bz.-", to: "bat.-", color: "black", via: [[778, 570]] });
  }
  const notes: Diagram["notes"] = [];
  if (stage === "battery") notes.push({ x: 360, y: 170, text: "Trainers put the cells in.\nFlat end on the spring!" });
  if (stage === "open") notes.push({ x: 300, y: 80, text: "The black clip is missing:\nthe circle is open!", color: "#ffe3e3" });
  return { w: 1000, h: 580, parts, wires, notes, flow: on || stage === "fan" };
}

/* ── Explorer Kit (Grades 3–5): breadboard missions and the light-seeking car ── */

/** Mission 1: battery → resistor → LED → back. With `sw`, a switch in the loop; with `two`, a second LED. */
export function missionCircuit(o: { sw?: boolean; two?: "series" | "parallel"; motor?: boolean; reversed?: boolean } = {}): Diagram {
  const parts: PartSpec[] = [
    { id: "bat", type: "battery", cells: 4, x: 50, y: 180, label: "4 × AA = 6 V" },
    { id: "r", type: "resistor", x: 330, y: 80, value: "220 Ω", bands: ["#e03131", "#e03131", "#8b5a2b"], label: "Resistor", labelAt: [28, 80] },
  ];
  const wires: Wire[] = [];
  if (o.motor) {
    parts.splice(1, 1);
    parts.push({ id: "mot", type: "motor", variant: "geared", x: 560, y: 120, label: o.reversed ? "Spins backwards!" : "BO motor", on: true });
    wires.push(
      { from: o.reversed ? "bat.-" : "bat.+", to: "mot.a", color: o.reversed ? "black" : "red", via: [[520, 330]] },
      { from: "mot.b", to: o.reversed ? "bat.+" : "bat.-", color: o.reversed ? "red" : "black", via: [[630, 470], [300, 470]] },
    );
    return { w: 1000, h: 560, parts, wires, flow: true };
  }
  parts.push({ id: "l1", type: "led", color: "#e03131", x: 640, y: 120, on: true, label: "LED 1", labelAt: [70, 66] });
  if (o.sw) parts.push({ id: "sw", type: "switch", x: 330, y: 400, label: "Switch", on: true });
  wires.push({ from: "bat.+", to: "r.a", color: "red" });
  wires.push({ from: "r.b", to: "l1.+", color: "red" });
  if (o.two === "parallel") {
    parts.push({ id: "l2", type: "led", color: "#2f9e44", x: 820, y: 120, on: true, label: "LED 2", labelAt: [70, 66] });
    wires.push({ from: "l1.+", to: "l2.+", color: "red" }, { from: "l2.-", to: "l1.-", color: "black", via: [[840, 330], [680, 330]] });
  }
  if (o.two === "series") {
    parts.push({ id: "l2", type: "led", color: "#2f9e44", x: 820, y: 120, on: true, label: "LED 2", labelAt: [70, 66] });
    wires.push({ from: "l1.-", to: "l2.+", color: "yellow" });
  }
  const last = o.two === "series" ? "l2.-" : "l1.-";
  if (o.sw) wires.push({ from: last, to: "sw.b", color: "black", via: [[o.two === "series" ? 860 : 680, 480]] }, { from: "sw.a", to: "bat.-", color: "black" });
  else wires.push({ from: last, to: "bat.-", color: "black", via: [[o.two === "series" ? 860 : 680, 470]] });
  return { w: 1000, h: 560, parts, wires, flow: true };
}

/** One side of the light-seeking car: light sensor → transistor → motor. `both` draws the left and right sides. */
export function seekerCircuit(o: { both?: boolean } = {}): Diagram {
  // left eye drives the right motor (and the right eye the left motor): the car turns toward the light
  const side = (k: "L" | "R", ox: number): { parts: PartSpec[]; wires: Wire[] } => {
    const eye = k === "L" ? "Left eye" : "Right eye";
    const motor = k === "L" ? "Right motor" : "Left motor";
    return {
      parts: [
        { id: `ldr${k}`, type: "ldr", x: ox + 30, y: 120, label: eye, labelAt: [-34, -16] },
        { id: `rb${k}`, type: "resistor", x: ox + 90, y: 330, value: "1 kΩ", bands: ["#8b5a2b", "#25262b", "#e03131"] },
        { id: `q${k}`, type: "transistor", x: ox + 300, y: 160, label: "BC547", labelAt: [84, 30] },
        { id: `m${k}`, type: "motor", variant: "geared", x: ox + 260, y: 0, label: motor, labelAt: [-150, 60] },
      ],
      wires: [
        { from: `ldr${k}.b`, to: `rb${k}.a`, color: "yellow", via: [[ox + 75, 350]] },
        { from: `rb${k}.b`, to: `q${k}.B`, color: "yellow", label: "base" },
        { from: `m${k}.b`, to: `q${k}.C`, color: "blue", via: [[ox + 330, 140], [ox + 320, 330]] },
        { from: `q${k}.E`, to: "bat.-", color: "black", via: [[ox + 360, 470]] },
        { from: "bat.+", to: `ldr${k}.a`, color: "red", via: [[ox + 10, 300]] },
        { from: "bat.+", to: `m${k}.a`, color: "red", via: [[ox + 10, 300], [ox + 10, 150], [ox + 290, 150]] },
      ],
    };
  };
  if (!o.both) {
    const s = side("L", 330);
    return {
      w: 1000,
      h: 600,
      parts: [{ id: "bat", type: "battery", cells: 4, x: 40, y: 200, label: "4 × AA = 6 V" }, ...s.parts],
      wires: s.wires,
      notes: [{ x: 760, y: 300, text: "Light on the eye\n→ base current\n→ transistor ON\n→ motor spins" }],
      flow: true,
    };
  }
  const L = side("L", 250), R = side("R", 700);
  return {
    w: 1200,
    h: 600,
    parts: [{ id: "bat", type: "battery", cells: 4, x: 20, y: 200, label: "4 × AA" }, ...L.parts, ...R.parts],
    wires: [...L.wires, ...R.wires],
    flow: true,
  };
}

/* ── Builder Kit (Grades 6–8): Arduino Uno + L293D motor shield ── */

const UNO_SHIELD = (x: number, y: number, extra: Partial<PartSpec> = {}): PartSpec => ({
  id: "uno",
  type: "board",
  x,
  y,
  w: 380,
  h: 300,
  color: "#0b6b8a",
  title: "Arduino Uno + L293D shield",
  titleSize: 19,
  usb: true,
  pins: { top: ["M1", "M1 ", "M2", "M2 "], bottom: ["5V", "GND", "A0", "A1", "A2", "A3", "A4"], right: ["EXT+", "EXT−", "SERVO1"] },
  pinSize: 13,
  ...extra,
});

export type BuilderStage = "motors" | "power" | "ultrasonic" | "servo" | "buzzer" | "ir" | "all";

export function builderCircuit(stage: BuilderStage): Diagram {
  const show = (s: BuilderStage) => stage === s || stage === "all";
  const parts: PartSpec[] = [UNO_SHIELD(310, 150)];
  const wires: Wire[] = [];
  if (show("motors")) {
    parts.push({ id: "ml", type: "motor", variant: "geared", x: 120, y: -80, label: "Left motor", labelAt: [-110, 60] }, { id: "mr", type: "motor", variant: "geared", x: 520, y: -80, label: "Right motor", labelAt: [190, 60] });
    wires.push(
      // each wire in its own lane, so none crosses another
      { from: "ml.a", to: "uno.M1", color: "red", via: [[150, 105]] },
      { from: "ml.b", to: "uno.M1 ", color: "black", via: [[190, 85]] },
      { from: "mr.a", to: "uno.M2", color: "red", via: [[550, 105]] },
      { from: "mr.b", to: "uno.M2 ", color: "black", via: [[590, 85]] },
    );
  }
  if (show("power")) {
    // EXT+ and EXT− sit at 225 and 300 down the shield's right edge: line the leads up with them
    parts.push({ id: "bat", type: "battery", cells: 6, flip: true, x: 860, y: 168, label: "6 × AA = 9 V" });
    wires.push({ from: "bat.+", to: "uno.EXT+", color: "red" }, { from: "bat.-", to: "uno.EXT−", color: "black" });
  }
  if (show("ultrasonic")) {
    parts.push({ id: "us", type: "ultrasonic", x: 70, y: 560 });
    // the sensor's pins point down; the shield's up from below: run them round underneath
    wires.push(
      { from: "us.VCC", to: "uno.5V", color: "red", via: [[145, 730], [370, 730]] },
      { from: "us.TRIG", to: "uno.A0", color: "yellow", via: [[175, 750], [480, 750]] },
      { from: "us.ECHO", to: "uno.A1", color: "green", via: [[205, 770], [530, 770]] },
      { from: "us.GND", to: "uno.GND", color: "black", via: [[235, 710], [420, 710]] },
    );
  }
  if (show("servo")) {
    parts.push({ id: "sv", type: "servo", x: 880, y: 470, label: "SG90 servo" });
    wires.push({ from: "uno.SERVO1", to: "sv.S", color: "orange", via: [[730, 470]], label: "D10", labelAt: [800, 506] });
  }
  if (show("buzzer")) {
    parts.push({ id: "bz", type: "buzzer", x: 760, y: 600, label: "Buzzer", labelAt: [100, 60] });
    wires.push({ from: "bz.+", to: "uno.A4", color: "purple", via: [[792, 760], [690, 760]], label: "A4" }, { from: "bz.-", to: "uno.GND", color: "black", via: [[818, 790], [420, 790]] });
  }
  return { w: 1200, h: 830, parts, wires };
}

/* ── Innovator AI Kit (Grades 9–10): ESP32 + pan-tilt servos, ESP32-CAM, OLED ── */

export function panTiltCircuit(view: "signal" | "power" | "oled"): Diagram {
  const servos: PartSpec[] = [
    { id: "pan", type: "servo", x: 760, y: 60, label: "Pan servo (left–right)" },
    { id: "tilt", type: "servo", x: 760, y: 300, label: "Tilt servo (up–down)" },
  ];
  if (view === "signal")
    return {
      w: 1000,
      h: 480,
      parts: [{ id: "esp", type: "board", x: 60, y: 60, w: 320, h: 360, color: "#1f1f1f", title: "ESP32 DevKit", usb: true, pins: { right: ["GPIO18", "GPIO19"] }, pinSize: 15 }, ...servos],
      wires: [
        { from: "esp.GPIO18", to: "pan.S", color: "orange", label: "GPIO 18" },
        { from: "esp.GPIO19", to: "tilt.S", color: "orange", label: "GPIO 19" },
      ],
      notes: [{ x: 420, y: 430, text: "Orange = signal. Power wires: next step." }],
    };
  if (view === "power")
    return {
      w: 1000,
      h: 700,
      parts: [
        { id: "pwr", type: "board", x: 40, y: 120, w: 220, h: 220, color: "#5c3d99", title: "5 V module", chip: false, pins: { right: ["+5V", "GND"] }, pinSize: 15 },
        { id: "rail", type: "board", x: 430, y: 60, w: 170, h: 340, color: "#e9ecef", title: "Rail", chip: false, pins: { left: ["+", "−"], right: ["+ pan", "− pan", "+ tilt", "− tilt"], bottom: ["GND"] }, pinSize: 12 },
        { id: "esp", type: "board", x: 250, y: 500, w: 300, h: 170, color: "#1f1f1f", title: "ESP32 DevKit", pins: { top: ["", "GND", ""] }, pinSize: 14 },
        ...servos,
      ],
      wires: [
        { from: "pwr.+5V", to: "rail.+", color: "red" },
        { from: "pwr.GND", to: "rail.−", color: "black" },
        { from: "rail.+ pan", to: "pan.+", color: "red" },
        { from: "rail.− pan", to: "pan.-", color: "brown" },
        { from: "rail.+ tilt", to: "tilt.+", color: "red", via: [[700, 356]] },
        { from: "rail.− tilt", to: "tilt.-", color: "brown", via: [[680, 376]] },
        { from: "esp.GND", to: "rail.GND", color: "black", label: "common ground", labelAt: [470, 455] },
      ],
    };
  return {
    w: 1000,
    h: 420,
    parts: [
      { id: "esp", type: "board", x: 60, y: 40, w: 320, h: 330, color: "#1f1f1f", title: "ESP32 DevKit", usb: true, pins: { right: ["GPIO21", "GPIO22", "3V3", "GND"] }, pinSize: 15 },
      { id: "oled", type: "board", x: 660, y: 40, w: 300, h: 330, color: "#0b3d91", screen: "Left 93%", chip: false, pins: { left: ["SDA", "SCL", "VCC", "GND"] }, pinSize: 15 },
    ],
    wires: [
      { from: "esp.GPIO21", to: "oled.SDA", color: "blue" },
      { from: "esp.GPIO22", to: "oled.SCL", color: "green" },
      { from: "esp.3V3", to: "oled.VCC", color: "red" },
      { from: "esp.GND", to: "oled.GND", color: "black" },
    ],
  };
}

/** The camera board seated on its MB programmer: USB to the laptop for power and upload, Wi-Fi for the video. */
export function camCircuit(): Diagram {
  return {
    w: 1000,
    h: 520,
    parts: [
      { id: "cam", type: "board", x: 60, y: 40, w: 260, h: 330, color: "#1f1f1f", title: "ESP32-CAM on MB", titleSize: 19, camera: true, chip: false, pins: { bottom: ["USB"], right: ["Wi-Fi"] }, pinSize: 14 },
      { id: "lap", type: "board", x: 620, y: 90, w: 320, h: 230, color: "#495057", title: "Laptop", chip: false, screen: "http://<camera-IP>", pins: { bottom: ["USB"], left: ["Wi-Fi"] }, pinSize: 14 },
    ],
    wires: [
      { from: "cam.Wi-Fi", to: "lap.Wi-Fi", color: "blue", dashed: true, label: "Wi-Fi: live video" },
      { from: "cam.USB", to: "lap.USB", color: "grey", label: "USB data cable: power + upload", labelAt: [500, 456] },
    ],
  };
}
