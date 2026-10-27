"use client";

/**
 * The 3D bench: a mat on a table, the kit parts on it, and the wires between their pins.
 * Click a pin, then another, to run a wire. In drive mode the bench becomes a floor and the build drives on it.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import { PARTS, pinOf } from "@/lib/bench/parts";
import { pinWorld, type Vec3 } from "@/lib/bench/circuit";
import type { PlacedPart, Wire } from "@/lib/bench/types";
import { PartModel, type ModelState } from "./models";

export const WIRE_COLORS: Record<Wire["color"], string> = {
  red: "#e03131",
  black: "#25262b",
  yellow: "#f2c200",
  green: "#2f9e44",
  blue: "#1c7ed6",
  orange: "#f76707",
  white: "#f1f3f5",
  brown: "#8b5a2b",
  purple: "#7048e8",
};

export type View = "3d" | "top" | "front";

export interface DriveScene {
  /** where the build is and which way it faces (radians, 0 = +x) */
  pose: { x: number; z: number; heading: number };
  torch?: { x: number; z: number };
  onTorch?: (x: number, z: number) => void;
  walls?: { at: [number, number]; size: [number, number] }[];
  /** the ultrasonic beam, for the obstacle-avoider */
  beam?: { from: Vec3; length: number; hit: boolean; angle: number };
}

export interface Bench3DProps {
  parts: PlacedPart[];
  wires: Wire[];
  ghosts?: Wire[];
  states: Record<string, ModelState>;
  /** wires that carry current now (indexes into `wires`) */
  live?: Set<number>;
  pending?: string | null;
  onPin?: (key: string) => void;
  onWireClick?: (index: number) => void;
  showPins?: boolean;
  showLabels?: boolean;
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  camera?: { at: Vec3; look: Vec3 };
  view: View;
  /** bump to put the camera back where it started */
  viewKey: number;
  drive?: DriveScene;
}

const turnOf = (p: PlacedPart) => ((p.turn ?? 0) * Math.PI) / 180;

/** A pin's "out" direction on the bench. */
function outWorld(p: PlacedPart, pinId: string): Vec3 {
  const o = pinOf(p.type, pinId)?.out ?? [0, 1, 0];
  const a = turnOf(p);
  return [o[0] * Math.cos(a) + o[2] * Math.sin(a), o[1], -o[0] * Math.sin(a) + o[2] * Math.cos(a)];
}

function endpoint(parts: PlacedPart[], key: string): { at: Vec3; out: Vec3 } | null {
  const dot = key.indexOf(".");
  const part = parts.find((p) => p.id === key.slice(0, dot));
  if (!part) return null;
  const at = pinWorld(part, key.slice(dot + 1));
  if (!at) return null;
  const out = outWorld(part, key.slice(dot + 1));
  // a leg pointing down takes its wire from its top, a hole from just above it
  return { at, out: out[1] < -0.5 ? [0, 1, 0] : out };
}

function wireCurve(a: { at: Vec3; out: Vec3 }, b: { at: Vec3; out: Vec3 }, clip?: boolean) {
  const A = new THREE.Vector3(...a.at), B = new THREE.Vector3(...b.at);
  const d = A.distanceTo(B);
  const lift = Math.min(6, 0.6 + d * 0.22) + (clip ? 0.8 : 0);
  const reach = Math.min(1.6, 0.35 + d * 0.12);
  const A1 = A.clone().add(new THREE.Vector3(...a.out).multiplyScalar(reach));
  const B1 = B.clone().add(new THREE.Vector3(...b.out).multiplyScalar(reach));
  const mid = A1.clone().add(B1).multiplyScalar(0.5);
  mid.y = Math.max(A1.y, B1.y) + lift;
  return new THREE.CatmullRomCurve3([A, A1, mid, B1, B], false, "catmullrom", 0.4);
}

function WireMesh({ curve, color, clip, ghost, live, onClick }: { curve: THREE.CatmullRomCurve3; color: string; clip?: boolean; ghost?: boolean; live?: boolean; onClick?: () => void }) {
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 64, clip ? 0.075 : 0.05, 8, false), [curve, clip]);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const dots = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ghost && mat.current) mat.current.opacity = 0.25 + Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.35;
    if (live && dots.current) {
      dots.current.children.forEach((c, i) => {
        const t = (clock.elapsedTime * 0.35 + i / dots.current!.children.length) % 1;
        c.position.copy(curve.getPointAt(t));
      });
    }
  });
  const ends = [curve.points[0], curve.points[curve.points.length - 1]];
  return (
    <group>
      <mesh
        geometry={geo}
        castShadow
        raycast={ghost ? () => null : undefined}
        onClick={(e) => {
          // a pin under the pointer wins over the wire
          if (e.intersections.some((i) => i.object.userData.pin)) return;
          e.stopPropagation();
          onClick?.();
        }}
      >
        <meshStandardMaterial ref={mat} color={color} roughness={0.45} transparent={ghost} opacity={ghost ? 0.4 : 1} emissive={ghost ? color : "#000"} emissiveIntensity={ghost ? 0.5 : 0} />
      </mesh>
      {clip &&
        !ghost &&
        ends.map((p, i) => (
          <mesh key={i} position={[p.x, p.y + 0.18, p.z]}>
            <boxGeometry args={[0.35, 0.3, 0.9]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        ))}
      {live && (
        <group ref={dots}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i}>
              <sphereGeometry args={[0.09, 10, 8]} />
              <meshBasicMaterial color="#ffe066" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

function Pins({ parts, pending, onPin, hidden, hover, onHover }: { parts: PlacedPart[]; pending?: string | null; onPin?: (key: string) => void; hidden?: boolean; hover: string | null; onHover: (key: string | null) => void }) {
  const list = useMemo(
    () =>
      parts.flatMap((p) => {
        const pins = PARTS[p.type].pins;
        return pins.map((pin) => {
          // the click area reaches halfway to the nearest neighbouring pin, and no further than 3.2 mm
          let near = Infinity;
          for (const o of pins) if (o !== pin) near = Math.min(near, Math.hypot(o.at[0] - pin.at[0], o.at[1] - pin.at[1], o.at[2] - pin.at[2]));
          return { key: `${p.id}.${pin.id}`, at: pinWorld(p, pin.id)!, board: p.type === "breadboard", hit: Math.min(0.32, near / 2) };
        });
      }),
    [parts],
  );
  return (
    <group>
      {list.map((pin) => {
        const on = hover === pin.key || pending === pin.key;
        return (
          <mesh
            key={pin.key}
            userData={{ pin: true }}
            position={pin.at}
            visible={!hidden}
            onPointerOver={hidden ? undefined : (e) => (e.stopPropagation(), onHover(pin.key), (document.body.style.cursor = "pointer"))}
            onPointerOut={hidden ? undefined : () => (onHover(null), (document.body.style.cursor = ""))}
            onClick={hidden ? undefined : (e) => (e.stopPropagation(), onPin?.(pin.key))}
          >
            {/* the click area is bigger than the dot, so pins are easy to hit on a projector or a phone */}
            <sphereGeometry args={[pin.hit, 10, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            <mesh raycast={() => null}>
              <sphereGeometry args={[on ? 0.16 : pin.board ? 0.07 : 0.12, 12, 10]} />
              <meshBasicMaterial color={pending === pin.key ? "#ffd43b" : on ? "#4dabf7" : pin.board ? "#adb5bd" : "#ffa94d"} transparent opacity={on ? 1 : pin.board ? 0.35 : 0.9} />
            </mesh>
          </mesh>
        );
      })}
    </group>
  );
}

export interface ScreenLabel {
  key: string;
  text: string;
  at: Vec3;
  kind: "part" | "pin";
}

/**
 * Moves the HTML labels drawn over the canvas to where their 3D points are, every frame. Plain DOM labels, not
 * drei's Html: those create a React root each, and unmounting them with the canvas throws in React 19.
 */
function LabelProjector({ labels, els, offset }: { labels: ScreenLabel[]; els: React.RefObject<Map<string, HTMLDivElement>>; offset?: DriveScene["pose"] }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    for (const l of labels) {
      const el = els.current.get(l.key);
      if (!el) continue;
      v.set(...l.at);
      if (offset) v.applyAxisAngle(new THREE.Vector3(0, 1, 0), offset.heading).add(new THREE.Vector3(offset.x, 0, offset.z));
      v.project(camera);
      const hide = v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2;
      el.style.transform = `translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px) translate(-50%, -100%)`;
      el.style.visibility = hide ? "hidden" : "visible";
    }
  });
  return null;
}

function CameraRig({ camera, view, viewKey, drive }: { camera?: { at: Vec3; look: Vec3 }; view: View; viewKey: number; drive?: DriveScene }) {
  const controls = useRef<OrbitImpl>(null);
  const { camera: cam, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  useEffect(() => {
    const look = new THREE.Vector3(...(camera?.look ?? [0, 0, 0]));
    // a narrow canvas (a phone, or the bench beside the steps) needs the camera further back to fit the build
    const fit = Math.min(2, Math.max(1, 1.5 / aspect));
    const at = look.clone().add(new THREE.Vector3(...(camera?.at ?? [0, 18, 22])).sub(look).multiplyScalar(fit));
    const dist = at.distanceTo(look);
    if (drive) {
      cam.position.set(drive.pose.x - 60, 70, drive.pose.z + 80);
      controls.current?.target.set(drive.pose.x, 0, drive.pose.z);
    } else if (view === "top") {
      cam.position.set(look.x, look.y + dist, look.z + 0.01);
      controls.current?.target.copy(look);
    } else if (view === "front") {
      cam.position.set(look.x, look.y + dist * 0.25, look.z + dist);
      controls.current?.target.copy(look);
    } else {
      cam.position.copy(at);
      controls.current?.target.copy(look);
    }
    controls.current?.update();
    // the drive camera is set once when driving starts; it should not jump as the car moves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, viewKey, !!drive, cam, camera, Math.round(aspect * 4)]);
  // while driving, the camera keeps the car in view
  useFrame((state) => {
    if (!drive || !controls.current) return;
    const t = controls.current.target;
    const dx = (drive.pose.x - t.x) * 0.06, dz = (drive.pose.z - t.z) * 0.06;
    if (Math.abs(dx) + Math.abs(dz) < 0.001) return;
    t.x += dx;
    t.z += dz;
    state.camera.position.x += dx;
    state.camera.position.z += dz;
  });
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.12} maxPolarAngle={Math.PI / 2 - 0.05} minDistance={3} maxDistance={drive ? 400 : 80} />;
}

function Torch({ at, onMove, target }: { at: { x: number; z: number }; onMove?: (x: number, z: number) => void; target: { x: number; z: number } }) {
  const [drag, setDrag] = useState(false);
  const get = useThree((s) => s.get);
  const setOrbit = (on: boolean) => {
    const c = get().controls as unknown as { enabled: boolean } | null;
    if (c) c.enabled = on;
  };
  const angle = Math.atan2(-(target.z - at.z), target.x - at.x);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  return (
    <group>
      <group
        position={[at.x, 0, at.z]}
        rotation={[0, angle - Math.PI / 2, 0]}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          (e.target as Element).setPointerCapture?.(e.pointerId);
          setDrag(true);
          setOrbit(false);
        }}
        onPointerUp={(e: ThreeEvent<PointerEvent>) => {
          (e.target as Element).releasePointerCapture?.(e.pointerId);
          setDrag(false);
          setOrbit(true);
        }}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          if (!drag) return;
          e.stopPropagation();
          if (e.ray.intersectPlane(plane, hit)) onMove?.(hit.x, hit.z);
        }}
        onPointerOver={() => (document.body.style.cursor = "grab")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <group scale={2.2}>
          <PartModel part={{ id: "torch", type: "torch", at: [0, 0, 0] }} state={{}} />
        </group>
        <mesh position={[0, 0.05, -16]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[12, 32, 0, Math.PI * 2]} />
          <meshBasicMaterial color="#fff3bf" transparent opacity={0.22} />
        </mesh>
      </group>
    </group>
  );
}

function Scene(p: Bench3DProps & { hover: string | null; onHover: (k: string | null) => void; labels: ScreenLabel[]; els: React.RefObject<Map<string, HTMLDivElement>> }) {
  const curves = useMemo(
    () =>
      p.wires.map((w) => {
        const a = endpoint(p.parts, w.from), b = endpoint(p.parts, w.to);
        return a && b ? wireCurve(a, b, w.clip) : null;
      }),
    [p.wires, p.parts],
  );
  const ghostCurves = useMemo(
    () =>
      (p.ghosts ?? []).map((w) => {
        const a = endpoint(p.parts, w.from), b = endpoint(p.parts, w.to);
        return a && b ? wireCurve(a, b, w.clip) : null;
      }),
    [p.ghosts, p.parts],
  );
  const build = (
    <group>
      {p.parts.map((part) => (
        <group
          key={part.id}
          position={part.at}
          rotation={[0, turnOf(part), 0]}
          onClick={(e) => {
            if (p.drive || e.intersections.some((i) => i.object.userData.pin)) return;
            e.stopPropagation();
            p.onSelect?.(part.id);
          }}
        >
          <PartModel part={part} state={p.states[part.id] ?? {}} />
          {p.selected === part.id && (
            <mesh position={[0, PARTS[part.type].size[1] / 2, 0]}>
              <boxGeometry args={PARTS[part.type].size.map((v) => v + 0.3) as [number, number, number]} />
              <meshBasicMaterial color="#4dabf7" wireframe transparent opacity={0.6} />
            </mesh>
          )}
        </group>
      ))}
      {curves.map((c, i) => c && <WireMesh key={`w${i}-${p.wires[i].from}-${p.wires[i].to}`} curve={c} color={WIRE_COLORS[p.wires[i].color]} clip={p.wires[i].clip} live={p.live?.has(i)} onClick={() => p.onWireClick?.(i)} />)}
      {!p.drive && ghostCurves.map((c, i) => c && <WireMesh key={`g${i}`} curve={c} color={WIRE_COLORS[p.ghosts![i].color]} clip={p.ghosts![i].clip} ghost />)}
      <Pins parts={p.parts} pending={p.pending} onPin={p.onPin} hidden={!!p.drive || !p.showPins} hover={p.hover} onHover={p.onHover} />
      {p.drive?.beam && (
        <group position={p.drive.beam.from} rotation={[0, p.drive.beam.angle, 0]}>
          <mesh position={[p.drive.beam.length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[p.drive.beam.length * 0.18, p.drive.beam.length, 24, 1, true]} />
            <meshBasicMaterial color={p.drive.beam.hit ? "#ff6b6b" : "#74c0fc"} transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      )}
    </group>
  );

  return (
    <>
      <CameraRig camera={p.camera} view={p.view} viewKey={p.viewKey} drive={p.drive} />
      <LabelProjector labels={p.labels} els={p.els} offset={p.drive?.pose} />
      <ambientLight intensity={p.drive?.torch ? 0.35 : 0.75} />
      <directionalLight position={[12, 30, 18]} intensity={p.drive?.torch ? 0.6 : 1.4} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} />
      <hemisphereLight args={["#e7f5ff", "#5c4a32", 0.35]} />

      {p.drive ? (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={() => p.onSelect?.(null)}>
            <planeGeometry args={[400, 400]} />
            <meshStandardMaterial color="#d8d2c4" roughness={0.95} />
          </mesh>
          <gridHelper args={[400, 40, "#b9b09c", "#c9c1ae"]} position={[0, 0.02, 0]} />
          {p.drive.walls?.map((w, i) => (
            <mesh key={i} position={[w.at[0], 6, w.at[1]]} castShadow receiveShadow>
              <boxGeometry args={[w.size[0], 12, w.size[1]]} />
              <meshStandardMaterial color="#c08552" roughness={0.8} />
            </mesh>
          ))}
          {p.drive.torch && <Torch at={p.drive.torch} onMove={p.drive.onTorch} target={{ x: p.drive.pose.x, z: p.drive.pose.z }} />}
        </group>
      ) : (
        <group>
          {/* the table and the JOVE mat */}
          <mesh position={[0, -1.2, 0]} receiveShadow>
            <boxGeometry args={[90, 2.4, 60]} />
            <meshStandardMaterial color="#b98a5a" roughness={0.85} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow onClick={() => p.onSelect?.(null)}>
            <planeGeometry args={[48, 32]} />
            <meshStandardMaterial color="#1f5f4a" roughness={0.9} />
          </mesh>
          <gridHelper args={[48, 48, "#2f7a60", "#2a6d56"]} position={[0, 0.012, 0]} />
        </group>
      )}
      {/* the build keeps one place in the tree on the bench and on the floor, so nothing remounts when driving starts */}
      <group position={p.drive ? [p.drive.pose.x, 0, p.drive.pose.z] : [0, 0, 0]} rotation={[0, p.drive?.pose.heading ?? 0, 0]}>
        {build}
      </group>
    </>
  );
}

export default function Bench3D(props: Bench3DProps) {
  const [hover, setHover] = useState<string | null>(null);
  const els = useRef(new Map<string, HTMLDivElement>());
  const labels = useMemo(() => {
    const out: ScreenLabel[] = [];
    if (props.showLabels && !props.drive)
      for (const p of props.parts)
        if (!["breadboard", "chassis"].includes(p.type)) out.push({ key: `part:${p.id}`, kind: "part", text: p.props?.label ?? PARTS[p.type].name, at: [p.at[0], p.at[1] + PARTS[p.type].size[1] + 0.5, p.at[2]] });
    const dot = hover?.indexOf(".") ?? -1;
    const part = hover ? props.parts.find((x) => x.id === hover.slice(0, dot)) : undefined;
    const pin = part ? PARTS[part.type].pins.find((x) => x.id === hover!.slice(dot + 1)) : undefined;
    if (part && pin && !props.drive) {
      const at = pinWorld(part, pin.id)!;
      out.push({ key: "pin", kind: "pin", text: `${part.props?.label ?? PARTS[part.type].name}: ${pin.label}`, at: [at[0], at[1] + 0.3, at[2]] });
    }
    return out;
  }, [props.parts, props.showLabels, props.drive, hover]);
  return (
    <div className="relative h-full w-full">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 40, near: 0.1, far: 1200, position: props.camera?.at ?? [0, 18, 22] }} gl={{ antialias: true }} onPointerMissed={() => props.onSelect?.(null)}>
        <color attach="background" args={[props.drive ? "#efe9dc" : "#e9edf2"]} />
        <Suspense fallback={null}>
          <Scene {...props} hover={hover} onHover={setHover} labels={labels} els={els} />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {labels.map((l) => (
          <div
            key={l.key}
            ref={(el) => {
              if (el) els.current.set(l.key, el);
              else els.current.delete(l.key);
            }}
            style={{ visibility: "hidden" }}
            className={`absolute left-0 top-0 whitespace-nowrap ${l.kind === "pin" ? "z-20 -mt-1 rounded-md bg-ink/90 px-2 py-1 text-[11px] font-semibold text-white shadow" : "z-10 rounded-full border border-white/40 bg-white/85 px-2 py-0.5 text-[10px] font-bold text-ink shadow-sm"}`}
          >
            {l.text}
          </div>
        ))}
      </div>
    </div>
  );
}
