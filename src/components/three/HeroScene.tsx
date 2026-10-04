"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Grid, PerformanceMonitor } from "@react-three/drei";
import type { MotionValue } from "motion/react";
import { SketchArm, ARM_HEIGHT } from "./SketchArm";
import { DECOR_LAYER, INK } from "./materials";

type PointerRef = React.RefObject<{ x: number; y: number }>;

export interface HeroSceneProps {
  /** Render loop runs only while the hero is on screen. */
  active: boolean;
  /** Starts the intro dolly (after the preloader has lifted). */
  started: boolean;
  /** 0 → 1 as the hero scrolls out of view. */
  progress?: MotionValue<number>;
  onReady?: () => void;
  /** Classes for the <canvas> wrapper only (e.g. an edge fade mask) — the joint labels stay crisp. */
  canvasClassName?: string;
}

/** Camera look-at: just under the middle of the arm, which stands centred on the origin. */
const TARGET = new THREE.Vector3(0, ARM_HEIGHT * 0.5, 0);
/** Radius and half-angle of the pick / place target marks drawn on the floor. */
const PICK_R = 1.15;
const SPOT_YAW = 0.8;

/** Space (px) a label needs beside its anchor; closer to the canvas edge than this and it flips to the other side. */
const LABEL_ROOM = 250;
const SIDE = {
  left: "right-0 -mr-1 flex-row-reverse group-data-[flip=1]:left-0 group-data-[flip=1]:right-auto group-data-[flip=1]:-ml-1 group-data-[flip=1]:mr-0 group-data-[flip=1]:flex-row",
  right: "left-0 -ml-1 group-data-[flip=1]:left-auto group-data-[flip=1]:right-0 group-data-[flip=1]:-mr-1 group-data-[flip=1]:ml-0 group-data-[flip=1]:flex-row-reverse",
} as const;

const LABELS: { name: string; side: "left" | "right" }[] = [
  { name: "J1 · Base ±170°", side: "left" },
  { name: "J2 · Shoulder", side: "left" },
  { name: "J5 · Wrist", side: "left" },
  { name: "Gripper 2-F", side: "left" },
];

/** Cinematic camera: intro dolly-in, slow idle orbit, pointer parallax, scroll-linked pull-back. */
function CameraRig({ started, progress, pointer }: { started: boolean; progress?: MotionValue<number>; pointer: PointerRef }) {
  const startedRef = useRef(started);
  const st = useRef({ intro: 0, time: 0, px: 0, py: 0 });
  useEffect(() => {
    startedRef.current = started;
  }, [started]);

  useFrame((state, delta) => {
    const s = st.current;
    const dt = Math.min(delta, 1 / 20);
    s.time += dt;
    if (startedRef.current) s.intro = Math.min(1, s.intro + dt / 2.6);
    const e = 1 - Math.pow(1 - s.intro, 3);
    const p = pointer.current ?? { x: 0, y: 0 };
    s.px = THREE.MathUtils.damp(s.px, p.x, 2.2, dt);
    s.py = THREE.MathUtils.damp(s.py, p.y, 2.2, dt);
    const scroll = progress ? THREE.MathUtils.clamp(progress.get(), 0, 1) : 0;

    const tall = state.size.width / Math.max(1, state.size.height) < 1.15;
    const r = THREE.MathUtils.lerp(10.5, tall ? 6.1 : 6.0, e) * (1 + scroll * 0.32);
    const az = THREE.MathUtils.lerp(1.08, 0.6, e) + Math.sin(s.time * 0.11) * 0.06 + s.px * 0.07;
    const el = THREE.MathUtils.lerp(0.16, 0.33, e) + scroll * 0.3 + s.py * 0.035;
    // in the tall desktop column, aim a little left of the arm so it sits right of the headline
    const shift = tall ? 0.24 : 0;
    const tx = TARGET.x - Math.cos(az) * shift;
    const tz = TARGET.z + Math.sin(az) * shift;
    const cam = state.camera;
    cam.position.set(tx + r * Math.cos(el) * Math.sin(az), TARGET.y + r * Math.sin(el), tz + r * Math.cos(el) * Math.cos(az));
    cam.lookAt(tx, TARGET.y + scroll * 0.35, tz);
  });
  return null;
}

function circleXZ(radius: number, seg = 160) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

/** Thin construction rings, tick ring and pick/place target marks drawn on the floor. */
function Construction() {
  const spin = useRef<THREE.Group>(null);
  const gimbal = useRef<THREE.Group>(null);
  const objs = useMemo(() => {
    const solid = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.34, depthWrite: false });
    const faint = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.14, depthWrite: false });
    const dashed = new THREE.LineDashedMaterial({ color: INK, dashSize: 0.07, gapSize: 0.06, transparent: true, opacity: 0.5, depthWrite: false });
    const dotted = new THREE.LineDashedMaterial({ color: INK, dashSize: 0.015, gapSize: 0.045, transparent: true, opacity: 0.45, depthWrite: false });

    const outer = new THREE.LineLoop(circleXZ(2.05, 200), solid);
    const work = new THREE.LineLoop(circleXZ(PICK_R), dashed);
    work.computeLineDistances();
    const inner = new THREE.LineLoop(circleXZ(0.8), dotted);
    inner.computeLineDistances();

    const tickPts: number[] = [];
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const r0 = i % 6 === 0 ? 1.86 : 1.97;
      tickPts.push(Math.cos(a) * r0, 0, Math.sin(a) * r0, Math.cos(a) * 2.05, 0, Math.sin(a) * 2.05);
    }
    const tickGeo = new THREE.BufferGeometry();
    tickGeo.setAttribute("position", new THREE.Float32BufferAttribute(tickPts, 3));
    const ticks = new THREE.LineSegments(tickGeo, solid);

    // target marks: crosshair + square at the pick and place spots
    const markPts: number[] = [];
    const q = 0.14;
    const sq = [
      [-q, -q, q, -q],
      [q, -q, q, q],
      [q, q, -q, q],
      [-q, q, -q, -q],
      [-0.26, 0, 0.26, 0],
      [0, -0.26, 0, 0.26],
    ];
    for (const sgn of [-1, 1]) {
      const yaw = SPOT_YAW * sgn;
      const cx = Math.sin(yaw) * PICK_R;
      const cz = Math.cos(yaw) * PICK_R;
      const c = Math.cos(yaw);
      const s = Math.sin(yaw);
      for (const [x1, z1, x2, z2] of sq) {
        markPts.push(cx + x1 * c + z1 * s, 0, cz - x1 * s + z1 * c, cx + x2 * c + z2 * s, 0, cz - x2 * s + z2 * c);
      }
    }
    const markGeo = new THREE.BufferGeometry();
    markGeo.setAttribute("position", new THREE.Float32BufferAttribute(markPts, 3));
    const marks = new THREE.LineSegments(markGeo, solid);

    // a faint gimbal of two vertical construction circles around the arm
    const gA = new THREE.LineLoop(circleXZ(1.55, 160), faint);
    gA.rotation.x = Math.PI / 2;
    const gB = new THREE.LineLoop(circleXZ(1.55, 160), faint);
    gB.rotation.set(Math.PI / 2, 0, Math.PI / 2);

    const all = [outer, work, inner, ticks, marks, gA, gB];
    for (const o of all) o.layers.set(DECOR_LAYER);
    return { outer, work, inner, ticks, marks, gA, gB, all, materials: [solid, faint, dashed, dotted] };
  }, []);

  useEffect(
    () => () => {
      objs.all.forEach((o) => o.geometry.dispose());
      objs.materials.forEach((m) => m.dispose());
    },
    [objs],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    if (spin.current) spin.current.rotation.y += dt * 0.035;
    if (gimbal.current) gimbal.current.rotation.y -= dt * 0.05;
  });

  return (
    <group position={[0, 0.006, 0]}>
      <primitive object={objs.outer} />
      <primitive object={objs.work} />
      <primitive object={objs.inner} />
      <primitive object={objs.marks} />
      <group ref={spin}>
        <primitive object={objs.ticks} />
      </group>
      <group ref={gimbal} position={[0, 1.15, 0]}>
        <primitive object={objs.gA} />
        <primitive object={objs.gB} />
      </group>
    </group>
  );
}

/** Tells the parent once real frames have been drawn, so the canvas can fade in over the poster. */
function ReadySignal({ onReady }: { onReady?: () => void }) {
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    frames.current += 1;
    if (frames.current >= 3) {
      done.current = true;
      onReady?.();
    }
  });
  return null;
}

export default function HeroScene({ active, started, progress, onReady, canvasClassName }: HeroSceneProps) {
  const pointer = useRef({ x: 0, y: 0 });
  const boxes = useRef<(HTMLDivElement | null)[]>([]);
  const values = useRef<(HTMLSpanElement | null)[]>([]);
  const [maxDpr, setMaxDpr] = useState(1.75);

  const flipped = useRef<boolean[]>([]);

  const placeLabel = useCallback((i: number, x: number, y: number, visible: boolean, canvasWidth: number) => {
    const el = boxes.current[i];
    if (!el) return;
    el.style.transform = visible ? `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)` : "translate3d(-9999px, 0, 0)";
    // keep the label inside the canvas: flip it to the other side of its anchor near an edge (with hysteresis)
    const was = flipped.current[i] ?? false;
    const room = LABELS[i].side === "right" ? canvasWidth - x : x;
    const now = was ? room < LABEL_ROOM + 40 : room < LABEL_ROOM;
    if (now !== was || el.dataset.flip === undefined) {
      flipped.current[i] = now;
      el.dataset.flip = now ? "1" : "0";
    }
  }, []);
  const setLabelValue = useCallback((i: number, text: string) => {
    const el = values.current[i];
    if (el) el.textContent = text;
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, maxDpr]}
        flat
        frameloop={active ? "always" : "never"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 30, near: 0.1, far: 80, position: [7.4, 4, 8.8] }}
        onCreated={({ camera, gl }) => {
          camera.layers.enable(DECOR_LAYER);
          gl.setClearColor(0x000000, 0);
        }}
        style={{ pointerEvents: "none" }}
        className={canvasClassName}
        aria-hidden
      >
        <PerformanceMonitor onDecline={() => setMaxDpr(1)} />
        <CameraRig started={started} progress={progress} pointer={pointer} />
        <Construction />
        <ContactShadows position={[0, 0.012, 0]} scale={5.5} far={2.6} blur={2.4} opacity={0.42} resolution={512} color={INK} />
        <Grid
          position={[0, -0.01, 0]}
          infiniteGrid
          cellSize={0.25}
          cellThickness={0.6}
          cellColor="#cfc7b6"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#a29a8a"
          fadeDistance={10}
          fadeStrength={2.4}
        />
        {/* the ready signal mounts with the model, so the hero is only revealed once the arm is really there */}
        <Suspense fallback={null}>
          <SketchArm pointer={pointer} onLabelPlace={placeLabel} onLabelValue={setLabelValue} />
          <ReadySignal onReady={onReady} />
        </Suspense>
      </Canvas>

      {/* joint annotations — plain DOM, positioned from the arm's anchors every frame */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {LABELS.map((l, i) => (
          <div
            key={l.name}
            ref={(el) => {
              boxes.current[i] = el;
            }}
            className="group absolute left-0 top-0 will-change-transform"
            style={{ transform: "translate3d(-9999px, 0, 0)" }}
          >
            <div className={`absolute top-0 flex -translate-y-1/2 items-center gap-1.5 whitespace-nowrap ${SIDE[l.side]}`}>
              <span className="size-2 shrink-0 rounded-full border border-graphite bg-paper" />
              <span className="h-px w-7 bg-graphite/60 xl:w-12" />
              <span className="border border-graphite/25 bg-paper/90 px-2 py-1 font-mono text-[10px] uppercase leading-none tracking-[0.14em] text-graphite shadow-[var(--shadow-paper)]">
                {l.name}
                <span
                  ref={(el) => {
                    values.current[i] = el;
                  }}
                  className="ml-2 text-blueprint tabular-nums"
                >
                  —
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
