"use client";

/**
 * The JOVE Bench: a guided 3D build of one project. Steps on the side, the bench in the middle; wires are made by
 * clicking pin to pin, the circuit is checked as you go, and the finished build runs (glows, drives, scans, turns).
 * Full screen for the projector.
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Cable,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Code,
  Flashlight,
  ListChecks,
  Maximize,
  Minimize,
  Package,
  Play,
  RotateCcw,
  Square,
  Tag,
  TriangleAlert,
  Undo2,
  Volume2,
  VolumeX,
  WandSparkles,
} from "lucide-react";
import { PARTS } from "@/lib/bench/parts";
import { buildNets, solve, type CircuitResult } from "@/lib/bench/circuit";
import { ARENA, bumps, constFrom, eyeLight, raycast, readBlink, stepCar, toWorld, type Pose } from "@/lib/bench/sim";
import type { BenchProject, PlacedPart, Wire, WireColor } from "@/lib/bench/types";
import type { ModelState } from "./models";
import { WIRE_COLORS, type DriveScene, type View } from "./Bench3D";

const Bench3D = dynamic(() => import("./Bench3D"), { ssr: false, loading: () => <div className="grid h-full place-items-center text-sm text-ink/50">Setting up the bench…</div> });

type Tab = "steps" | "parts" | "code" | "checks";
type Issue = { level: "bad" | "warn" | "ok"; text: string };

const samePair = (w: Wire, a: string, b: string) => (w.from === a && w.to === b) || (w.from === b && w.to === a);

/* ── a beep for buzzers, made in the browser ── */
function useBeeper(on: boolean, enabled: boolean, freq = 1800) {
  useEffect(() => {
    if (!on || !enabled) return;
    let ctx: AudioContext | null = null;
    try {
      ctx = new AudioContext();
    } catch {
      return;
    }
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "square";
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    let high = false;
    const timer = setInterval(() => {
      high = !high;
      gain.gain.setTargetAtTime(high ? 0.04 : 0, ctx!.currentTime, 0.005);
    }, 200);
    return () => {
      clearInterval(timer);
      osc.stop();
      ctx?.close();
    };
  }, [on, enabled, freq]);
}

export default function BenchApp({ project, backHref, backLabel, present }: { project: BenchProject; backHref?: string; backLabel?: string; present?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"guided" | "free">("guided");
  const [made, setMade] = useState<Wire[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [freeColor, setFreeColor] = useState<WireColor>("red");
  const [switchOn, setSwitchOn] = useState(false);
  const [tab, setTab] = useState<Tab>("steps");
  const [view, setView] = useState<View>("3d");
  const [viewKey, setViewKey] = useState(0);
  const [labels, setLabels] = useState(true);
  const [sound, setSound] = useState(true);
  const [isFull, setFull] = useState(false);
  const full = isFull || !!present;
  const [selected, setSelected] = useState<string | null>(null);
  const [code, setCode] = useState(project.code ?? "");
  const [note, setNote] = useState<string | null>(null);
  // seeker: torch on the bench (which eyes are lit) and on the floor
  const [benchLight, setBenchLight] = useState<"off" | "left" | "right" | "both">("off");
  const [driving, setDriving] = useState(false);
  const [pose, setPose] = useState<Pose>({ x: 0, z: 0, heading: 0 });
  const [torch, setTorch] = useState({ x: 90, z: -40 });
  // blink
  const [blinkHigh, setBlinkHigh] = useState(false);
  // avoider
  const [servo, setServo] = useState(90);
  const [beam, setBeam] = useState<{ cm: number; hit: boolean }>({ cm: 400, hit: false });
  const [beeping, setBeeping] = useState(false);
  const [avoidState, setAvoidState] = useState("");
  // pan-tilt
  const [pan, setPan] = useState(90);
  const [tilt, setTilt] = useState(90);
  const [seen, setSeen] = useState<string | null>(null);

  const isArduino = project.behaviour === "blink" || project.behaviour === "avoider" || project.behaviour === "pantilt";
  const running = switchOn; // the battery switch, or Run for the boards

  /* ── which parts are on the bench, and which wires the steps ask for ── */
  const placedBy = useMemo(() => {
    const at = new Map<string, number>();
    project.steps.forEach((s, i) => s.place?.forEach((id) => at.has(id) || at.set(id, i)));
    return at;
  }, [project]);
  const visible = useMemo(() => {
    const shown = project.parts.filter((p) => mode === "free" || (placedBy.get(p.id) ?? 0) <= step);
    return shown.map((p) => {
      if (project.behaviour === "avoider" && p.id === "hc") return { ...p, turn: servo };
      if (project.behaviour === "pantilt" && p.id === "tilt") return { ...p, turn: (p.turn ?? 0) + (pan - 90) };
      if (project.behaviour === "pantilt" && p.id === "cam") return { ...p, turn: (p.turn ?? 0) + (pan - 90) };
      return p;
    });
  }, [project, mode, placedBy, step, servo, pan]);
  const expectedUpTo = useCallback((i: number) => project.steps.slice(0, i + 1).flatMap((s) => s.wires ?? []), [project]);
  const expected = useMemo(() => (mode === "free" ? [] : expectedUpTo(step)), [mode, expectedUpTo, step]);
  const stepWires = useMemo(() => (mode === "free" ? [] : (project.steps[step].wires ?? [])), [mode, project, step]);

  const nets = useMemo(() => buildNets(visible, made), [visible, made]);
  const missing = useMemo(() => stepWires.filter((w) => !nets.same(w.from, w.to)), [stepWires, nets]);
  const stepDone = missing.length === 0;

  /** the learner's wires that no step asks for, and that are not the same as one that does */
  const extra = useMemo(() => {
    if (mode === "free") return [];
    const want = buildNets(visible, expected);
    return made.filter((w) => !expected.some((e) => samePair(e, w.from, w.to)) && !want.same(w.from, w.to));
  }, [mode, visible, expected, made]);

  /* ── the battery circuits ── */
  const light = useMemo(() => {
    const out: Record<string, number> = {};
    if (project.behaviour !== "seeker") return out;
    const eyes = visible.filter((p) => p.type === "ldr");
    for (const e of eyes) {
      const left = e.id.endsWith("L");
      if (driving) out[e.id] = eyeLight(pose, e, left ? 0.45 : -0.45, torch);
      else out[e.id] = benchLight === "both" || (benchLight === "left" && left) || (benchLight === "right" && !left) ? 1 : 0;
    }
    return out;
  }, [project.behaviour, visible, driving, pose, torch, benchLight]);

  const circuit: CircuitResult | null = useMemo(() => {
    if (project.behaviour === "spark" || project.behaviour === "seeker") return solve(visible, made, { switchOn: running, light });
    if (project.behaviour === "blink") {
      // the Uno's pin is the battery: + when the code drives it HIGH, back through GND
      const plan = readBlink(code);
      const src: PlacedPart = { id: "__pin", type: "battery4", at: [0, 0, 0] };
      const pinKey = `uno.D${plan.pin ?? 13}`;
      const ws: Wire[] = [...made, { from: "__pin.+", to: pinKey, color: "red" }, { from: "__pin.-", to: "uno.GND", color: "black" }];
      return solve([...visible, src], ws, { switchOn: running && !plan.problem && blinkHigh });
    }
    return null;
  }, [project.behaviour, visible, made, running, light, code, blinkHigh]);

  /* ── blink: run the learner's timing ── */
  const blinkPlan = useMemo(() => (project.behaviour === "blink" ? readBlink(code) : null), [project.behaviour, code]);
  useEffect(() => {
    if (project.behaviour !== "blink" || !running || !blinkPlan || blinkPlan.problem) return;
    let high = false;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      high = !high;
      setBlinkHigh(high);
      t = setTimeout(tick, high ? blinkPlan.onMs : blinkPlan.offMs);
    };
    t = setTimeout(tick, 0);
    return () => clearTimeout(t);
  }, [project.behaviour, running, blinkPlan]);

  /* ── the Arduino and ESP32 builds: is each wire where the code expects it? ── */
  const joinedNow = useCallback((a: string, b: string) => nets.same(a, b), [nets]);
  const motorSign = useCallback(
    (m: string, ta: string, tb: string) => (joinedNow(`${m}.a`, ta) && joinedNow(`${m}.b`, tb) ? 1 : joinedNow(`${m}.a`, tb) && joinedNow(`${m}.b`, ta) ? -1 : 0),
    [joinedNow],
  );
  const avoiderWiring = useMemo(() => {
    if (project.behaviour !== "avoider") return null;
    const has = (id: string) => visible.some((p) => p.id === id);
    const power = joinedNow("bat.+", "sh.EXT+") && joinedNow("bat.-", "sh.EXT-");
    const reversed = joinedNow("bat.+", "sh.EXT-") && joinedNow("bat.-", "sh.EXT+");
    return {
      power,
      reversed,
      left: motorSign("mL", "sh.M1a", "sh.M1b"),
      right: motorSign("mR", "sh.M2a", "sh.M2b"),
      leftOnM2: motorSign("mL", "sh.M2a", "sh.M2b") !== 0,
      servo: has("servo") && joinedNow("servo.S", "sh.SERVO1.S") && joinedNow("servo.+", "sh.SERVO1.+") && joinedNow("servo.-", "sh.SERVO1.-"),
      sensorPower: has("hc") && joinedNow("hc.VCC", "sh.5V") && joinedNow("hc.GND", "sh.GND"),
      trig: has("hc") && joinedNow("hc.TRIG", "sh.A0"),
      echo: has("hc") && joinedNow("hc.ECHO", "sh.A1"),
      buzzer: has("bz") && joinedNow("bz.+", "sh.A4") && joinedNow("bz.-", "sh.GND"),
    };
  }, [project.behaviour, visible, joinedNow, motorSign]);
  const panWiring = useMemo(() => {
    if (project.behaviour !== "pantilt") return null;
    const servoOk = (s: string, gpio: string) => joinedNow(`${s}.S`, `esp.${gpio}`) && joinedNow(`${s}.+`, "pw.+5V") && joinedNow(`${s}.-`, "pw.GND");
    return {
      pan: servoOk("pan", "GPIO18"),
      tilt: servoOk("tilt", "GPIO19"),
      ground: joinedNow("esp.GND", "pw.GND") || joinedNow("esp.GND.2", "pw.GND"),
      on3v3: joinedNow("pan.+", "esp.3V3") || joinedNow("tilt.+", "esp.3V3"),
      oled: visible.some((p) => p.id === "oled") && joinedNow("oled.SDA", "esp.GPIO21") && joinedNow("oled.SCL", "esp.GPIO22") && joinedNow("oled.VCC", "esp.3V3") && (joinedNow("oled.GND", "esp.GND") || joinedNow("oled.GND", "esp.GND.2") || joinedNow("oled.GND", "pw.GND")),
    };
  }, [project.behaviour, visible, joinedNow]);

  /* ── drive loops ── */
  // the drive loops read the latest values through refs, so they do not restart on every change
  const poseRef = useRef(pose);
  const torchRef = useRef(torch);
  const codeRef = useRef(code);
  const seekerParts = useRef(visible);
  const seekerWires = useRef(made);
  const wiringRef = useRef<typeof avoiderWiring>(null);
  useEffect(() => {
    torchRef.current = torch;
    codeRef.current = code;
    seekerParts.current = visible;
    seekerWires.current = made;
    wiringRef.current = avoiderWiring;
  });
  const placeCar = (p: Pose) => {
    poseRef.current = p;
    setPose(p);
  };

  // light-seeker: the circuit decides the wheels
  useEffect(() => {
    if (project.behaviour !== "seeker" || !driving || !running) return;
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const p = poseRef.current, parts = seekerParts.current;
      const lights: Record<string, number> = {};
      for (const e of parts.filter((x) => x.type === "ldr")) lights[e.id] = eyeLight(p, e, e.id.endsWith("L") ? 0.45 : -0.45, torchRef.current);
      const r = solve(parts, seekerWires.current, { switchOn: true, light: lights });
      const speed = 26;
      const l = r.devices.mL?.on ? (r.devices.mL.dir ?? 1) * speed : 0;
      const rr = r.devices.mR?.on ? (r.devices.mR.dir ?? 1) * speed : 0;
      let next = stepCar(p, l, rr, dt);
      if (Math.abs(next.x) > 190 || Math.abs(next.z) > 190) next = { ...p, heading: next.heading };
      poseRef.current = next;
      setPose(next);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [project.behaviour, driving, running]);

  // obstacle-avoider: Sketch 5, step by step
  useEffect(() => {
    if (project.behaviour !== "avoider" || !driving || !running) return;
    let raf = 0, last = performance.now();
    type Phase = { name: "drive" | "stop" | "back" | "lookL" | "lookR" | "centre" | "turn"; until: number; leftCm?: number; rightCm?: number };
    let phase: Phase = { name: "drive", until: 0 };
    let clock = 0;
    let servoAngle = 90;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt * 1000;
      const w = wiringRef.current, c = codeRef.current;
      if (!w) return;
      const k = {
        stop: constFrom(c, "STOP_DISTANCE_CM", 20),
        drive: constFrom(c, "DRIVE_SPEED", 160),
        turn: constFrom(c, "TURN_SPEED", 170),
        backMs: constFrom(c, "BACKUP_MS", 300),
        turnMs: constFrom(c, "TURN_MS", 450),
        left: constFrom(c, "LEFT_ANGLE", 150),
        right: constFrom(c, "RIGHT_ANGLE", 30),
      };
      const p = poseRef.current;
      const [sx, sz] = toWorld(p, [6.15, 0]);
      const measure = () => (w.trig && w.echo && w.sensorPower ? raycast(sx, sz, p.heading + ((servoAngle - 90) * Math.PI) / 180, ARENA) : 0);
      let l = 0, r = 0;
      const ahead = measure();
      switch (phase.name) {
        case "drive":
          if (ahead > k.stop) {
            l = r = k.drive;
          } else phase = { name: "stop", until: clock + 150 };
          break;
        case "stop":
          if (clock > phase.until) phase = { name: "back", until: clock + k.backMs };
          break;
        case "back":
          l = r = -k.drive;
          if (clock > phase.until) phase = { name: "lookL", until: clock + 400 };
          break;
        case "lookL":
          servoAngle = w.servo ? k.left : 90;
          if (clock > phase.until) phase = { name: "lookR", until: clock + 600, leftCm: measure() };
          break;
        case "lookR":
          servoAngle = w.servo ? k.right : 90;
          if (clock > phase.until) phase = { name: "centre", until: clock + 200, leftCm: phase.leftCm, rightCm: measure() };
          break;
        case "centre":
          servoAngle = 90;
          if (clock > phase.until) phase = { name: "turn", until: clock + k.turnMs, leftCm: phase.leftCm, rightCm: phase.rightCm };
          break;
        case "turn":
          if ((phase.leftCm ?? 0) >= (phase.rightCm ?? 0)) [l, r] = [-k.turn, k.turn];
          else [l, r] = [k.turn, -k.turn];
          if (clock > phase.until) phase = { name: "drive", until: 0 };
          break;
      }
      // the shield only drives the motors with battery power, each the way its wires say
      const cm = (v: number) => (v / 255) * 42;
      const leftWheel = w.power ? (w.leftOnM2 ? r : l) * (w.left || (w.leftOnM2 ? 1 : 0)) : 0;
      const rightWheel = w.power ? r * w.right : 0;
      let next = stepCar(p, cm(leftWheel), cm(rightWheel), dt);
      if (bumps(next.x, next.z, ARENA)) next = { ...p, heading: next.heading };
      poseRef.current = next;
      setPose(next);
      setServo(servoAngle);
      setBeam({ cm: ahead, hit: ahead <= k.stop });
      setBeeping(w.buzzer && phase.name === "stop");
      setAvoidState(
        { drive: `Clear ahead (${Math.round(ahead)} cm): driving`, stop: "Too close! Stop and beep", back: "Backing up", lookL: "Looking left…", lookR: "Looking right…", centre: "Deciding…", turn: (phase.leftCm ?? 0) >= (phase.rightCm ?? 0) ? `Turning left (${Math.round(phase.leftCm ?? 0)} cm vs ${Math.round(phase.rightCm ?? 0)} cm)` : `Turning right (${Math.round(phase.rightCm ?? 0)} cm vs ${Math.round(phase.leftCm ?? 0)} cm)` }[phase.name],
      );
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [project.behaviour, driving, running]);

  // pan-tilt: a servo without a common ground twitches
  const [jitter, setJitter] = useState(0);
  useEffect(() => {
    if (project.behaviour !== "pantilt" || !running || !panWiring || panWiring.ground) return;
    const t = setInterval(() => setJitter(Math.round((Math.random() - 0.5) * 24)), 140);
    return () => clearInterval(t);
  }, [project.behaviour, running, panWiring]);

  const beepNow = beeping && driving && running;
  const shake = project.behaviour === "pantilt" && running && panWiring && !panWiring.ground ? jitter : 0;
  const buzzerOn = !!circuit?.devices.bz?.on || beepNow;
  useBeeper(buzzerOn, sound);

  /* ── what each part shows ── */
  const states = useMemo(() => {
    const s: Record<string, ModelState> = {};
    for (const p of visible) {
      const d = circuit?.devices[p.id];
      s[p.id] = { on: d?.on, dir: (d?.dir ?? 1) * (p.turn === 180 ? -1 : 1), burnt: d?.burnt, lit: light[p.id] };
      if (PARTS[p.type].type.startsWith("battery")) s[p.id] = { switchOn: switchOn, onSwitch: () => setSwitchOn((v) => !v) };
    }
    if (project.behaviour === "avoider" && avoiderWiring && running && driving) {
      s.servo = { angle: avoiderWiring.servo ? servo : 90 };
      s.mL = { on: avoiderWiring.power && avoiderWiring.left !== 0, dir: -1 };
      s.mR = { on: avoiderWiring.power && avoiderWiring.right !== 0, dir: 1 };
      s.bz = { on: beepNow };
    }
    if (project.behaviour === "seeker" && driving) {
      // wheels turn the way the car moves
      for (const m of ["mL", "mR"]) if (s[m]) s[m] = { ...s[m], dir: (s[m].dir ?? 1) };
    }
    if (project.behaviour === "pantilt" && panWiring) {
      const live = running;
      s.pan = { angle: live && panWiring.pan ? pan + shake : 90 };
      s.tilt = { angle: live && panWiring.tilt ? tilt + shake : 90 };
      s.oled = { text: live && panWiring.oled ? (seen ?? "Ready") : undefined };
      s.cam = { angle: live && panWiring.tilt ? tilt + shake : 90 };
    }
    return s;
  }, [visible, circuit, light, switchOn, project.behaviour, avoiderWiring, running, driving, servo, beepNow, panWiring, pan, tilt, shake, seen]);

  /* ── wires that carry current: the dots run along them ── */
  const live = useMemo(() => {
    const out = new Set<number>();
    if (!running) return out;
    if (circuit) {
      const onNets = new Set<string>();
      for (const p of visible) if (circuit.devices[p.id]?.on) for (const pin of PARTS[p.type].pins) onNets.add(circuit.nets.find(`${p.id}.${pin.id}`));
      made.forEach((w, i) => onNets.has(circuit.nets.find(w.from)) && out.add(i));
    } else if (project.behaviour === "avoider" && driving) {
      made.forEach((w, i) => /^(mL|mR|bat)\./.test(w.from) && out.add(i));
    } else if (project.behaviour === "pantilt") {
      made.forEach((w, i) => /\.S$/.test(w.from) && out.add(i));
    }
    return out;
  }, [running, circuit, visible, made, project.behaviour, driving]);

  /* ── checks shown to the learner ── */
  const issues: Issue[] = useMemo(() => {
    const out: Issue[] = [];
    if (extra.length) out.push({ level: "warn", text: `${extra.length === 1 ? "One wire is" : `${extra.length} wires are`} not part of this build yet. Click a wire to remove it.` });
    if (project.behaviour === "blink" && blinkPlan?.problem) out.push({ level: "bad", text: blinkPlan.problem });
    if (project.behaviour === "blink" && blinkPlan && !blinkPlan.problem && blinkPlan.pin !== 13 && made.some((w) => samePair(w, "uno.D13", w.from === "uno.D13" ? w.to : w.from)))
      out.push({ level: "warn", text: `The code blinks pin ${blinkPlan.pin}, but the LED's wire is on pin 13.` });
    if (circuit && (running || circuit.short)) for (const i of circuit.issues) out.push(i);
    if (avoiderWiring && step >= 2) {
      const w = avoiderWiring;
      if (w.reversed) out.push({ level: "bad", text: "The battery is the wrong way round on EXT_PWR: red goes to +." });
      else if (!w.power && step >= 3) out.push({ level: "warn", text: "No battery power on EXT_PWR: the code runs, but the motors cannot move." });
      if (w.leftOnM2) out.push({ level: "warn", text: "The left motor is on M2: the code's leftMotor(1) will drive the right side." });
      if (w.left === -1 || w.right === -1) out.push({ level: "warn", text: `The ${w.left === -1 ? "left" : "right"} motor's wires are swapped: that wheel will run backwards. Swap its two wires.` });
      if (step >= 4 && visible.some((p) => p.id === "servo") && !w.servo) out.push({ level: "warn", text: "The servo cable is not on SERVO1 the right way: orange (signal) to S." });
      if (step >= 5 && visible.some((p) => p.id === "hc") && !(w.trig && w.echo && w.sensorPower)) out.push({ level: "warn", text: "The ultrasonic sensor is not fully wired: distance reads 0 cm, so the car thinks a wall is always there." });
      if (running && driving && !out.some((i) => i.level !== "ok")) out.push({ level: "ok", text: avoidState || "Running Sketch 5." });
    }
    if (panWiring && running) {
      if (panWiring.on3v3) out.push({ level: "bad", text: "A servo is on the 3.3 V pin: the ESP32 resets when the servo moves. Power servos from the 5 V module." });
      if (!panWiring.ground) out.push({ level: "warn", text: "No common ground: the servos jitter or ignore the ESP32. Join ESP32 GND to the 5 V module's GND." });
      if (!panWiring.pan || !panWiring.tilt) out.push({ level: "warn", text: `The ${!panWiring.pan ? "pan" : "tilt"} servo is not fully wired: signal to GPIO ${!panWiring.pan ? 18 : 19}, red to +5V, brown to GND.` });
      if (!out.some((i) => i.level !== "ok")) out.push({ level: "ok", text: `Servos answering: pan ${pan}°, tilt ${tilt}°.` });
    }
    return out;
  }, [extra, project.behaviour, blinkPlan, made, circuit, running, avoiderWiring, step, visible, driving, avoidState, panWiring, pan, tilt]);

  /* ── actions ── */
  const flash = (t: string) => {
    setNote(t);
    setTimeout(() => setNote((n) => (n === t ? null : n)), 2600);
  };
  const onPin = (key: string) => {
    if (!pending) return setPending(key);
    if (pending === key) return setPending(null);
    const a = pending, b = key;
    setPending(null);
    if (a.split(".")[0] === b.split(".")[0] && PARTS[visible.find((p) => p.id === a.split(".")[0])?.type ?? "led"]?.type !== "breadboard") return flash("Both ends are on the same part: that would join it to itself.");
    if (made.some((w) => samePair(w, a, b))) return flash("That wire is already there.");
    const guide = [...stepWires, ...expected].find((w) => samePair(w, a, b));
    setMade((m) => [...m, guide ? { ...guide, from: a, to: b } : { from: a, to: b, color: mode === "free" ? freeColor : "yellow", clip: project.kit === "Spark" }]);
    if (guide) flash("Good connection!");
  };
  const showMe = () => setMade((m) => [...m, ...missing.filter((w) => !m.some((x) => samePair(x, w.from, w.to)))]);
  const goTo = (i: number) => {
    // jumping ahead finishes the steps in between, so the bench is where that step expects it
    if (i > step) {
      const need = expectedUpTo(i - 1);
      setMade((m) => {
        const nets2 = buildNets(project.parts, m);
        return [...m, ...need.filter((w) => !nets2.same(w.from, w.to))];
      });
    }
    setStep(i);
    setDriving(false);
    setTab("steps");
  };
  const reset = () => {
    setMade([]);
    setStep(0);
    setSwitchOn(false);
    setDriving(false);
    placeCar({ x: 0, z: 0, heading: 0 });
    setServo(90);
    setPan(90);
    setTilt(90);
    setSeen(null);
    setCode(project.code ?? "");
    setViewKey((k) => k + 1);
  };
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else root.current?.requestFullscreen?.().catch(() => flash("Full screen is not allowed here: use your browser's F11."));
  };
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("textarea, input")) return;
      if (e.key === "ArrowRight" && mode === "guided" && step < project.steps.length - 1 && stepDone) goTo(step + 1);
      if (e.key === "ArrowLeft" && mode === "guided" && step > 0) goTo(step - 1);
      if (e.key === "Escape") setPending(null);
      if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey) toggleFull();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const drive: DriveScene | undefined = driving
    ? {
        pose,
        torch: project.behaviour === "seeker" ? torch : undefined,
        onTorch: (x, z) => setTorch({ x, z }),
        walls: project.behaviour === "avoider" ? ARENA : undefined,
        beam: project.behaviour === "avoider" && avoiderWiring?.trig && avoiderWiring.echo && avoiderWiring.sensorPower ? { from: [6.15, 7.8, 0], length: Math.min(beam.cm, 200), hit: beam.hit, angle: ((servo - 90) * Math.PI) / 180 } : undefined,
      }
    : undefined;

  const cur = project.steps[step];
  const canDrive = project.behaviour === "seeker" || project.behaviour === "avoider";
  const bigText = full ? "text-[17px]" : "text-sm";

  return (
    <div ref={root} className="flex h-full min-h-[560px] flex-col overflow-hidden bg-[#f6f7f9] text-ink">
      {/* top bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink/10 bg-white px-3 py-2">
        {backHref && (
          <a href={backHref} className="rounded-md px-2 py-1 text-xs font-semibold text-ink/60 hover:bg-ink/5">
            ← {backLabel ?? "Back"}
          </a>
        )}
        <div className="min-w-0 flex-1">
          <div className={`truncate font-bold ${full ? "text-xl" : "text-base"}`}>{project.title}</div>
          <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink/50">{project.audience}</div>
        </div>
        <div className="flex rounded-lg border border-ink/10 p-0.5 text-xs font-semibold">
          {(["guided", "free"] as const).map((m) => (
            <button key={m} onClick={() => (setMode(m), setPending(null))} className={`rounded-md px-2.5 py-1 ${mode === m ? "bg-ink text-white" : "text-ink/60 hover:bg-ink/5"}`}>
              {m === "guided" ? "Guided build" : "Free wiring"}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-ink/10 p-0.5 text-xs font-semibold">
          {(["3d", "top", "front"] as const).map((v) => (
            <button key={v} onClick={() => (setView(v), setViewKey((k) => k + 1))} className={`rounded-md px-2 py-1 ${view === v ? "bg-ink/10" : "text-ink/60 hover:bg-ink/5"}`}>
              {v === "3d" ? "3D" : v === "top" ? "Top" : "Front"}
            </button>
          ))}
        </div>
        <IconBtn title="Labels" on={labels} onClick={() => setLabels((v) => !v)} icon={<Tag size={15} />} />
        <IconBtn title={sound ? "Sound on" : "Sound off"} on={sound} onClick={() => setSound((v) => !v)} icon={sound ? <Volume2 size={15} /> : <VolumeX size={15} />} />
        <IconBtn title="Reset the view" onClick={() => setViewKey((k) => k + 1)} icon={<RotateCcw size={15} />} />
        <IconBtn title={isFull ? "Exit full screen (F)" : "Full screen for the projector (F)"} onClick={toggleFull} icon={isFull ? <Minimize size={15} /> : <Maximize size={15} />} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* the bench */}
        <div className="relative min-h-[340px] flex-1">
          <Bench3D
            parts={visible}
            wires={made}
            ghosts={missing}
            states={states}
            live={live}
            pending={pending}
            onPin={onPin}
            onWireClick={(i) => (setMade((m) => m.filter((_, j) => j !== i)), flash("Wire removed."))}
            showPins={!driving}
            showLabels={labels}
            selected={selected}
            onSelect={(id) => (setSelected(id), id && setTab("parts"))}
            camera={project.camera}
            view={view}
            viewKey={viewKey}
            drive={drive}
          />
          {/* bench controls */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-2">
            <div className="pointer-events-auto flex flex-wrap gap-2">
              <button onClick={() => setSwitchOn((v) => !v)} className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold shadow-md ${running ? "bg-emerald-600 text-white" : "bg-white text-ink"}`}>
                {running ? <Square size={14} /> : <Play size={14} />}
                {isArduino ? (running ? "Stop" : "Run") : running ? "Switch OFF" : "Switch ON"}
              </button>
              {canDrive && (
                <button
                  onClick={() => {
                    setDriving((v) => !v);
                    placeCar({ x: 0, z: 0, heading: 0 });
                    if (!running) setSwitchOn(true);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold shadow-md ${driving ? "bg-amber-400 text-ink" : "bg-white text-ink"}`}
                >
                  <Car size={15} /> {driving ? "Back to the bench" : "Drive"}
                </button>
              )}
              {project.behaviour === "seeker" && !driving && (
                <div className="flex items-center gap-1 rounded-xl bg-white px-2 py-1.5 text-xs font-semibold shadow-md">
                  <Flashlight size={14} className="text-amber-500" />
                  {(["off", "left", "right", "both"] as const).map((l) => (
                    <button key={l} onClick={() => setBenchLight(l)} className={`rounded-md px-2 py-1 ${benchLight === l ? "bg-amber-300" : "hover:bg-ink/5"}`}>
                      {l === "off" ? "Dark" : l === "both" ? "Both eyes" : `${l[0].toUpperCase()}${l.slice(1)} eye`}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {mode === "free" && !driving && (
              <div className="pointer-events-auto flex items-center gap-1 rounded-xl bg-white px-2 py-1.5 shadow-md" title="Colour of your next wire">
                <Cable size={14} className="text-ink/50" />
                {(Object.keys(WIRE_COLORS) as WireColor[]).map((c) => (
                  <button key={c} aria-label={c} onClick={() => setFreeColor(c)} className={`h-5 w-5 rounded-full border-2 ${freeColor === c ? "border-ink" : "border-white"}`} style={{ background: WIRE_COLORS[c] }} />
                ))}
              </div>
            )}
          </div>
          {(pending || note) && (
            <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-ink/90 px-4 py-1.5 text-xs font-semibold text-white shadow">
              {note ?? "Now click the pin at the other end · Esc to cancel"}
            </div>
          )}
          {driving && project.behaviour === "seeker" && <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-bold shadow">Drag the torch across the floor: the car follows the light</div>}
          {driving && running && project.behaviour === "avoider" && avoidState && <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold shadow">{avoidState}</div>}
          {project.behaviour === "pantilt" && running && (
            <div className="absolute left-3 top-3 w-60 space-y-2 rounded-xl bg-white/95 p-3 text-xs shadow-md">
              <div className="font-bold">Browser control page</div>
              <Slider label="Pan" value={pan} min={20} max={160} onChange={setPan} />
              <Slider label="Tilt" value={tilt} min={50} max={130} onChange={setTilt} />
              <div className="pt-1 font-bold">The model sees…</div>
              <div className="grid grid-cols-3 gap-1">
                {["Left", "Centre", "Right"].map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      const conf = 80 + Math.floor(Math.random() * 18);
                      setSeen(`${l} ${conf}%`);
                      if (l === "Left") setPan((v) => Math.min(160, v + 10));
                      if (l === "Right") setPan((v) => Math.max(20, v - 10));
                    }}
                    className="rounded-md bg-ink/5 py-1.5 font-semibold hover:bg-ink/10"
                  >
                    {l}
                  </button>
                ))}
              </div>
              <button onClick={() => (setPan(90), setTilt(90), setSeen("Centre"))} className="w-full rounded-md border border-ink/10 py-1 font-semibold hover:bg-ink/5">
                /center
              </button>
            </div>
          )}
        </div>

        {/* the side panel */}
        <aside className={`flex max-h-[48vh] min-h-0 w-full flex-col border-t border-ink/10 bg-white lg:max-h-none lg:w-[380px] lg:border-l lg:border-t-0 ${full ? "lg:w-[440px]" : ""}`}>
          <div className="flex border-b border-ink/10 text-xs font-semibold">
            {(
              [
                ["steps", "Steps", <ListChecks key="s" size={14} />],
                ["parts", "Parts", <Package key="p" size={14} />],
                ...(project.code ? [["code", "Code", <Code key="c" size={14} />]] : []),
                ["checks", "Checks", <CircleCheck key="k" size={14} />],
              ] as [Tab, string, React.ReactNode][]
            ).map(([t, label, icon]) => (
              <button key={t} onClick={() => setTab(t)} className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 ${tab === t ? "border-b-2 border-ink text-ink" : "text-ink/50 hover:text-ink"}`}>
                {icon}
                {label}
                {t === "checks" && issues.some((i) => i.level !== "ok") && <span className="h-2 w-2 rounded-full bg-amber-500" />}
              </button>
            ))}
          </div>

          <div className={`min-h-0 flex-1 overflow-y-auto p-4 ${bigText}`}>
            {tab === "steps" &&
              (mode === "free" ? (
                <div className="space-y-3">
                  <p className="font-semibold">Free wiring</p>
                  <p className="text-ink/70">Every part is on the bench. Click a pin, then another, to run a wire; click a wire to remove it. Try your own circuit and watch the Checks.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setMade([])} className="flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold hover:bg-ink/5">
                      <Undo2 size={13} /> Clear all wires
                    </button>
                    <button onClick={() => setMade(expectedUpTo(project.steps.length - 1))} className="flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold hover:bg-ink/5">
                      <WandSparkles size={13} /> The finished wiring
                    </button>
                  </div>
                  <Issues issues={issues} />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink/45">
                      Step {step + 1} of {project.steps.length}
                    </div>
                    <h3 className={`font-bold leading-snug ${full ? "text-2xl" : "text-lg"}`}>{cur.title}</h3>
                    <p className="mt-2 leading-relaxed text-ink/80">{cur.text}</p>
                    {cur.tip && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-ink/80">💡 {cur.tip}</p>}
                  </div>
                  {stepWires.length > 0 && (
                    <div className="space-y-1.5">
                      {stepWires.map((w) => {
                        const ok = nets.same(w.from, w.to);
                        return (
                          <div key={`${w.from}-${w.to}`} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${ok ? "bg-emerald-50" : "bg-ink/[0.03]"}`}>
                            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: WIRE_COLORS[w.color] }} />
                            <span className="flex-1">
                              {pinName(project.parts, w.from)} → {pinName(project.parts, w.to)}
                            </span>
                            {ok ? <Check size={15} className="text-emerald-600" /> : <span className="text-[11px] text-ink/40">to do</span>}
                          </div>
                        );
                      })}
                      {!stepDone && (
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-xs text-ink/50">Click the glowing pins to make each wire.</span>
                          <button onClick={showMe} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-ink/5 px-2.5 py-1.5 text-xs font-semibold hover:bg-ink/10">
                            <WandSparkles size={13} /> Show me
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {cur.run && !running && (
                    <button onClick={() => setSwitchOn(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 font-bold text-white">
                      <Play size={15} /> {isArduino ? "Run" : "Switch ON"}
                    </button>
                  )}
                  {cur.run && running && canDrive && step === project.steps.length - 1 && !driving && (
                    <button onClick={() => (setDriving(true), placeCar({ x: 0, z: 0, heading: 0 }))} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-2.5 font-bold">
                      <Car size={16} /> Drive
                    </button>
                  )}
                  {issues.length > 0 && <Issues issues={issues} />}
                  <div className="flex items-center gap-2 pt-2">
                    <button disabled={step === 0} onClick={() => goTo(step - 1)} className="flex items-center gap-1 rounded-lg border border-ink/15 px-3 py-2 text-xs font-semibold disabled:opacity-40">
                      <ChevronLeft size={14} /> Back
                    </button>
                    <button
                      disabled={step === project.steps.length - 1 || !stepDone}
                      onClick={() => goTo(step + 1)}
                      title={stepDone ? "" : "Make the wires of this step first, or press Show me"}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      {step === project.steps.length - 1 ? "Finished!" : "Next step"} <ChevronRight size={14} />
                    </button>
                  </div>
                  <ol className="space-y-0.5 border-t border-ink/10 pt-3 text-xs">
                    {project.steps.map((s, i) => (
                      <li key={i}>
                        <button onClick={() => goTo(i)} className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left ${i === step ? "bg-ink/5 font-semibold" : "text-ink/60 hover:bg-ink/5"}`}>
                          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${i < step ? "bg-emerald-500 text-white" : i === step ? "bg-ink text-white" : "bg-ink/10"}`}>{i < step ? <Check size={11} /> : i + 1}</span>
                          {s.title}
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}

            {tab === "parts" && (
              <div className="space-y-2">
                {visible.map((p) => {
                  const d = PARTS[p.type];
                  return (
                    <button key={p.id} onClick={() => setSelected(p.id)} className={`block w-full rounded-xl border p-3 text-left ${selected === p.id ? "border-sky-400 bg-sky-50" : "border-ink/10 hover:bg-ink/[0.03]"}`}>
                      <div className="font-semibold">{p.props?.label ?? d.name}</div>
                      {p.props?.label && <div className="text-[11px] text-ink/50">{d.name}</div>}
                      <div className="mt-1 text-ink/70">{d.job}</div>
                      {d.pins.length > 0 && d.pins.length < 20 && <div className="mt-1.5 text-[11px] text-ink/50">Pins: {d.pins.map((x) => x.label).join(" · ")}</div>}
                    </button>
                  );
                })}
              </div>
            )}

            {tab === "code" && (
              <div className="space-y-2">
                <p className="text-xs text-ink/60">{project.behaviour === "blink" ? "Edit the code, then press Run. Try other delay values." : project.behaviour === "avoider" ? "Change a number (STOP_DISTANCE_CM, DRIVE_SPEED, TURN_MS…) and drive again." : "The code this build runs, from the Code Library."}</p>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  readOnly={project.behaviour === "pantilt"}
                  spellCheck={false}
                  className={`h-[46vh] w-full resize-none rounded-xl bg-[#1b1f24] p-3 font-mono leading-relaxed text-[#e6edf3] outline-none ${full ? "text-[15px]" : "text-[12px]"}`}
                />
                {code !== project.code && (
                  <button onClick={() => setCode(project.code ?? "")} className="flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-ink">
                    <Undo2 size={13} /> Back to the original code
                  </button>
                )}
              </div>
            )}

            {tab === "checks" && (
              <div className="space-y-3">
                <Issues issues={issues.length ? issues : [{ level: "ok", text: running ? "Running." : "Switch on or press Run to test the circuit." }]} />
                <p className="text-xs text-ink/50">The bench follows the build guide and the kit&apos;s wiring card. If the card in the box shows a different layout, the card wins.</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-ink/10 px-4 py-2 text-[11px] text-ink/45">
            <span>{made.length} wire{made.length === 1 ? "" : "s"}</span>
            <button onClick={reset} className="font-semibold hover:text-ink">
              Start over
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function pinName(parts: PlacedPart[], key: string) {
  const dot = key.indexOf(".");
  const p = parts.find((x) => x.id === key.slice(0, dot));
  if (!p) return key;
  const pin = PARTS[p.type].pins.find((x) => x.id === key.slice(dot + 1));
  if (p.type === "breadboard") return `hole ${pin?.label ?? key.slice(dot + 1)}`;
  return `${p.props?.label ?? PARTS[p.type].name.replace(/ \(.*\)$/, "")} ${pin?.label ?? key.slice(dot + 1)}`;
}

function Issues({ issues }: { issues: Issue[] }) {
  return (
    <div className="space-y-1.5">
      {issues.map((i, k) => (
        <div key={k} className={`flex gap-2 rounded-lg px-3 py-2 ${i.level === "bad" ? "bg-red-50 text-red-900" : i.level === "warn" ? "bg-amber-50 text-amber-950" : "bg-emerald-50 text-emerald-900"}`}>
          {i.level === "bad" ? <CircleAlert size={16} className="mt-0.5 shrink-0" /> : i.level === "warn" ? <TriangleAlert size={16} className="mt-0.5 shrink-0" /> : <CircleCheck size={16} className="mt-0.5 shrink-0" />}
          <span>{i.text}</span>
        </div>
      ))}
    </div>
  );
}

function IconBtn({ title, icon, onClick, on }: { title: string; icon: React.ReactNode; onClick: () => void; on?: boolean }) {
  return (
    <button title={title} aria-label={title} onClick={onClick} className={`grid h-8 w-8 place-items-center rounded-lg border border-ink/10 ${on ? "bg-ink/10" : "hover:bg-ink/5"}`}>
      {icon}
    </button>
  );
}

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-8 font-semibold">{label}</span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" />
      <span className="w-9 text-right tabular-nums">{value}°</span>
    </label>
  );
}
