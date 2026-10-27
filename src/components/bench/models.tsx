"use client";

/**
 * The 3D look of each JOVE kit part, built from simple shapes at real size (cm). Each model is drawn at the part's
 * origin; the bench places and turns it. `on` makes an LED glow, a motor spin, a buzzer pulse.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { holeAt, PARTS, PITCH } from "@/lib/bench/parts";
import type { PlacedPart } from "@/lib/bench/types";

const LEG = "#b8bec6";
const PCB_BLUE = "#0f6e8c";
const PCB_GREEN = "#1f6b45";

function Box({ size, at, color, rough = 0.6, metal = 0, opacity }: { size: [number, number, number]; at: [number, number, number]; color: string; rough?: number; metal?: number; opacity?: number }) {
  return (
    <mesh position={at} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} transparent={opacity !== undefined} opacity={opacity ?? 1} />
    </mesh>
  );
}

function Leg({ from, to, r = 0.025 }: { from: [number, number, number]; to: [number, number, number]; r?: number }) {
  const { pos, quat, len } = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const d = b.clone().sub(a);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    return { pos: a.clone().add(b).multiplyScalar(0.5), quat: q, len: d.length() };
  }, [from, to]);
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[r, r, len, 8]} />
      <meshStandardMaterial color={LEG} metalness={0.8} roughness={0.3} />
    </mesh>
  );
}

/** AA cells lying in a holder, `n` of them in `cols` columns. */
function BatteryBox({ n, cols, size, lead, on, onToggle }: { n: number; cols: number; size: [number, number, number]; lead: number; on: boolean; onToggle?: () => void }) {
  const [w, h, d] = size;
  const rows = Math.ceil(n / cols);
  const cells = Array.from({ length: n }, (_, i) => i);
  return (
    <group>
      <Box size={[w, h * 0.55, d]} at={[0, h * 0.275, 0]} color="#22262b" />
      {cells.map((i) => {
        const c = i % cols, r = Math.floor(i / cols);
        const z = (r - (rows - 1) / 2) * (d / rows) * 0.95 + (c - (cols - 1) / 2) * (cols > 1 && rows > 1 ? 0 : d / Math.max(cols, 2) / 2);
        const x = cols > 1 && rows > 1 ? (c - (cols - 1) / 2) * (w / cols) : 0;
        const zz = cols > 1 && rows > 1 ? z : (c - (cols - 1) / 2) * 1.45;
        return (
          <group key={i} position={[x, h * 0.6, zz]} rotation={[0, 0, Math.PI / 2]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.7, 0.7, cols > 1 && rows > 1 ? w / cols - 0.3 : 5.0, 20]} />
              <meshStandardMaterial color={i % 2 ? "#2f9e44" : "#e8590c"} roughness={0.35} />
            </mesh>
          </group>
        );
      })}
      {/* the switch: slides to ON */}
      <group position={[-w / 2 + 0.9, h * 0.55, 0]} onClick={(e) => (e.stopPropagation(), onToggle?.())}>
        <Box size={[1.2, 0.25, 0.7]} at={[0, 0.12, 0]} color="#111" />
        <Box size={[0.45, 0.35, 0.5]} at={[on ? 0.3 : -0.3, 0.35, 0]} color={on ? "#2f9e44" : "#e9ecef"} />
      </group>
      {/* the two leads */}
      <Leg from={[w / 2, 0.45, -0.5]} to={[lead, 0.4, -0.5]} r={0.07} />
      <Leg from={[w / 2, 0.45, 0.5]} to={[lead, 0.4, 0.5]} r={0.07} />
    </group>
  );
}

function Led({ color = "#ff3b30", on, burnt }: { color?: string; on: boolean; burnt?: boolean }) {
  const glow = on && !burnt;
  return (
    <group>
      <Leg from={[0, 0, 0]} to={[0, 0.95, 0]} />
      <Leg from={[PITCH, 0.15, 0]} to={[PITCH, 0.95, 0]} />
      <group position={[PITCH / 2, 0.95, 0]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.29, 0.29, 0.1, 20]} />
          <meshStandardMaterial color={burnt ? "#333" : color} transparent opacity={0.85} emissive={glow ? color : "#000"} emissiveIntensity={glow ? 2.2 : 0} />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.5, 20]} />
          <meshStandardMaterial color={burnt ? "#333" : color} transparent opacity={0.8} emissive={glow ? color : "#000"} emissiveIntensity={glow ? 2.2 : 0} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.25, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={burnt ? "#333" : color} transparent opacity={0.8} emissive={glow ? color : "#000"} emissiveIntensity={glow ? 2.2 : 0} />
        </mesh>
        {glow && <pointLight color={color} intensity={8} distance={8} position={[0, 0.5, 0]} />}
        {glow && (
          <mesh position={[0, 0.45, 0]}>
            <sphereGeometry args={[0.75, 20, 14]} />
            <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function Resistor({ value }: { value?: string }) {
  const bands = value === "1 kΩ" ? ["#8b5a2b", "#111", "#e03131"] : ["#e03131", "#e03131", "#8b5a2b"];
  const L = 4 * PITCH;
  return (
    <group>
      <Leg from={[0, 0, 0]} to={[0, 0.35, 0]} />
      <Leg from={[L, 0, 0]} to={[L, 0.35, 0]} />
      <Leg from={[0, 0.35, 0]} to={[L, 0.35, 0]} />
      <mesh position={[L / 2, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.12, 0.4, 6, 12]} />
        <meshStandardMaterial color="#d9c49a" />
      </mesh>
      {bands.map((b, i) => (
        <mesh key={i} position={[L / 2 - 0.15 + i * 0.1, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 0.04, 12]} />
          <meshStandardMaterial color={b} />
        </mesh>
      ))}
    </group>
  );
}

function Buzzer({ on }: { on: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(on ? 1 + Math.sin(clock.elapsedTime * 40) * 0.03 : 1);
  });
  const x = 1.5 * PITCH;
  return (
    <group>
      <Leg from={[0, 0, 0]} to={[0, 0.4, 0]} />
      <Leg from={[3 * PITCH, 0, 0]} to={[3 * PITCH, 0.4, 0]} />
      <mesh ref={ref} position={[x, 0.8, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.8, 24]} />
        <meshStandardMaterial color="#1b1b1b" roughness={0.5} emissive={on ? "#5f3dc4" : "#000"} emissiveIntensity={on ? 0.4 : 0} />
      </mesh>
      <mesh position={[x, 1.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.12, 16]} />
        <meshStandardMaterial color="#444" />
      </mesh>
    </group>
  );
}

function MiniMotor({ on, dir = 1, fan }: { on: boolean; dir?: number; fan?: boolean }) {
  const blades = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (blades.current && on) blades.current.rotation.x += dt * 22 * dir;
  });
  return (
    <group position={[0, 0.85, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.75, 0.75, 2.4, 24]} />
        <meshStandardMaterial color="#c0c6cc" metalness={0.7} roughness={0.35} />
      </mesh>
      <Box size={[0.2, 1.3, 1.3]} at={[-1.25, 0, 0]} color="#1c1c1c" />
      <Box size={[0.3, 0.25, 0.12]} at={[-1.4, -0.3, -0.35]} color="#d4af37" metal={0.8} />
      <Box size={[0.3, 0.25, 0.12]} at={[-1.4, -0.3, 0.35]} color="#d4af37" metal={0.8} />
      <mesh position={[1.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 8]} />
        <meshStandardMaterial color="#ddd" metalness={0.9} />
      </mesh>
      {fan && (
        <group ref={blades} position={[1.75, 0, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation={[(i * Math.PI * 2) / 3, 0, 0]} position={[0, 0, 0]}>
              <boxGeometry args={[0.08, 2.6, 0.55]} />
              <meshStandardMaterial color="#e08a1e" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

function BoMotor({ on, dir = 1 }: { on: boolean; dir?: number }) {
  const wheel = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (wheel.current && on) wheel.current.rotation.z -= dt * 6 * dir;
  });
  return (
    <group>
      <Box size={[5.2, 1.9, 2.2]} at={[-0.6, 1.6, 0]} color="#f2b705" rough={0.5} />
      <Box size={[1.6, 1.5, 1.8]} at={[-3.4 + 0.2, 1.6, 0]} color="#c0c6cc" metal={0.6} />
      <group ref={wheel} position={[1.0, 3.25, 1.6]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[3.25, 3.25, 2.4, 32]} />
          <meshStandardMaterial color="#1f1f1f" roughness={0.9} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]}>
          <cylinderGeometry args={[2.2, 2.2, 2.45, 6]} />
          <meshStandardMaterial color="#f2b705" />
        </mesh>
      </group>
    </group>
  );
}

function Ldr({ lit }: { lit?: number }) {
  return (
    <group>
      <Leg from={[0, 0, 0]} to={[0, 0.7, 0]} />
      <Leg from={[PITCH, 0, 0]} to={[PITCH, 0.7, 0]} />
      <mesh position={[PITCH / 2, 0.82, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.22, 20]} />
        <meshStandardMaterial color="#f3e5c3" emissive="#ffd43b" emissiveIntensity={(lit ?? 0) * 0.8} />
      </mesh>
      <mesh position={[PITCH / 2, 0.935, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.16, 16, 1]} />
        <meshStandardMaterial color="#b5482c" />
      </mesh>
    </group>
  );
}

function Bc547({ on }: { on: boolean }) {
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <Leg key={i} from={[i * PITCH, 0, 0]} to={[i * PITCH, 0.5, 0]} />
      ))}
      <mesh position={[PITCH, 0.75, 0]} rotation={[0, Math.PI, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.5, 20, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#1c1c1c" emissive={on ? "#2f9e44" : "#000"} emissiveIntensity={on ? 0.35 : 0} side={THREE.DoubleSide} />
      </mesh>
      <Box size={[0.48, 0.5, 0.02]} at={[PITCH, 0.75, 0.0]} color="#2a2a2a" />
    </group>
  );
}

function Breadboard() {
  const holes = useRef<THREE.InstancedMesh>(null);
  const positions = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let c = 1; c <= 17; c++) for (const r of "abcdefghij") list.push(holeAt(c, r));
    return list;
  }, []);
  useLayoutEffect(() => {
    const mesh = holes.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    positions.forEach((p, i) => mesh.setMatrixAt(i, m.makeTranslation(p[0], p[1] + 0.001, p[2])));
    mesh.instanceMatrix.needsUpdate = true;
  }, [positions]);
  return (
    <group>
      <Box size={[4.6, 0.85, 3.5]} at={[0, 0.425, 0]} color="#f4f4f1" rough={0.8} />
      <Box size={[4.4, 0.02, 0.18]} at={[0, 0.86, 0]} color="#d6d6d0" />
      <instancedMesh ref={holes} args={[undefined, undefined, positions.length]}>
        <boxGeometry args={[0.1, 0.01, 0.1]} />
        <meshStandardMaterial color="#3b3b3b" />
      </instancedMesh>
    </group>
  );
}

function Header({ from, count, z, y, color = "#141414" }: { from: number; count: number; z: number; y: number; color?: string }) {
  return <Box size={[count * PITCH, 0.85, 0.25]} at={[from + ((count - 1) * PITCH) / 2, y - 0.42, z]} color={color} />;
}

function Uno({ shield }: { shield?: boolean }) {
  return (
    <group>
      <Box size={[6.86, 0.16, 5.34]} at={[0, 0.2, 0]} color={PCB_BLUE} rough={0.5} />
      <Box size={[1.6, 1.1, 1.2]} at={[-3.1, 0.75, -1.4]} color="#c9ced4" metal={0.8} rough={0.25} />
      <Box size={[1.4, 1.0, 0.9]} at={[-3.1, 0.7, 1.7]} color="#111" />
      <Box size={[3.5, 0.3, 0.8]} at={[1.0, 0.45, 0.9]} color="#1c1c1c" />
      <Header from={-0.95} count={8} z={-2.42} y={1.05} />
      <Header from={1.2} count={8} z={-2.42} y={1.05} />
      <Header from={-0.4} count={7} z={2.42} y={1.05} />
      <Header from={1.75} count={6} z={2.42} y={1.05} />
      <Box size={[0.2, 0.06, 0.12]} at={[-0.45, 0.32, -1.6]} color="#ffb000" />
      {shield && (
        <group>
          <Box size={[6.86, 0.16, 5.34]} at={[0, 1.2, 0]} color="#163a6b" rough={0.5} />
          {[-1.5, -0.2].map((z) => (
            <Box key={z} size={[0.8, 0.8, 1.05]} at={[-2.95, 1.65, z]} color="#1971c2" />
          ))}
          <Box size={[0.8, 0.8, 1.05]} at={[-2.95, 1.65, 1.35]} color="#2f9e44" />
          <Box size={[1.1, 0.35, 0.7]} at={[0, 1.45, -0.6]} color="#111" />
          <Box size={[1.1, 0.35, 0.7]} at={[0, 1.45, 0.7]} color="#111" />
          <Box size={[3 * PITCH, 0.6, 0.25]} at={[2.7 + PITCH, 1.65, -2.0]} color="#111" />
          <Header from={-0.2} count={2} z={2.42} y={2.05} color="#141414" />
          <Header from={1.75} count={6} z={2.42} y={2.05} color="#141414" />
        </group>
      )}
    </group>
  );
}

function Hcsr04() {
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <Leg key={i} from={[(i - 1.5) * PITCH, 0, 0]} to={[(i - 1.5) * PITCH, 0.35, 0]} />
      ))}
      <Box size={[4.5, 2.0, 0.16]} at={[0, 1.35, 0]} color="#1864ab" />
      {[-1.3, 1.3].map((x) => (
        <group key={x} position={[x, 1.35, 0.55]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 1.1, 24]} />
            <meshStandardMaterial color="#c9ced4" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.56]}>
            <circleGeometry args={[0.62, 24]} />
            <meshStandardMaterial color="#3a3a3a" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Sg90({ angle = 90 }: { angle?: number }) {
  return (
    <group>
      <Box size={[2.3, 2.2, 1.2]} at={[0, 1.1, 0]} color="#1c7ed6" />
      <Box size={[3.2, 0.25, 1.2]} at={[0, 1.6, 0]} color="#1971c2" />
      <group position={[0.55, 2.35, 0]} rotation={[0, ((angle - 90) * Math.PI) / 180, 0]}>
        <mesh>
          <cylinderGeometry args={[0.25, 0.25, 0.3, 16]} />
          <meshStandardMaterial color="#f8f9fa" />
        </mesh>
        <Box size={[1.9, 0.12, 0.4]} at={[0.6, 0.12, 0]} color="#f8f9fa" />
      </group>
      {["#f76707", "#e03131", "#8b5a2b"].map((c, i) => (
        <mesh key={c} position={[-1.85, 0.9, -0.25 + i * 0.25]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 1.5, 8]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
    </group>
  );
}

function RobotBody() {
  return (
    <group>
      <Box size={[5, 5.5, 3.2]} at={[0, 2.75, 0]} color="#c8a46e" rough={0.95} />
      <Box size={[4, 3, 3]} at={[0, 7, 0]} color="#d1ae78" rough={0.95} />
      {[-0.9, 0.9].map((x) => (
        <group key={x} position={[x, 7.3, 1.52]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.08, 24]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
          <mesh position={[0.12, -0.1, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.06, 16]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      ))}
      <Box size={[1.6, 0.25, 0.1]} at={[0, 6.2, 1.55]} color="#e03131" />
      <Box size={[0.15, 1.2, 0.15]} at={[0, 9.1, 0]} color="#8b6b3d" />
      <mesh position={[0, 9.8, 0]}>
        <sphereGeometry args={[0.3, 16, 12]} />
        <meshStandardMaterial color="#e08a1e" />
      </mesh>
    </group>
  );
}

function Chassis() {
  return (
    <group>
      <Box size={[16, 0.3, 11]} at={[0, 3.6, 0]} color="#bfe3ff" opacity={0.45} rough={0.1} />
      <mesh position={[6.5, 1.0, 0]}>
        <sphereGeometry args={[1.0, 20, 14]} />
        <meshStandardMaterial color="#c0c6cc" metalness={0.8} roughness={0.2} />
      </mesh>
      <Box size={[0.8, 2.4, 0.8]} at={[6.5, 2.4, 0]} color="#888" metal={0.6} />
    </group>
  );
}

function Esp32() {
  return (
    <group>
      <Box size={[5.1, 0.16, 2.8]} at={[0, 0.4, 0]} color="#1a1a1a" />
      <Box size={[1.8, 0.35, 1.6]} at={[1.4, 0.62, 0]} color="#bfc5cc" metal={0.8} rough={0.3} />
      <Box size={[0.9, 0.4, 0.8]} at={[-2.4, 0.62, 0]} color="#c9ced4" metal={0.8} />
      <Header from={-1.8} count={15} z={-1.15} y={1.2} />
      <Header from={-1.8} count={15} z={1.15} y={1.2} />
    </group>
  );
}

/** The ESP32-CAM standing up, lens forward; `angle` tilts it (90 = level). */
function Esp32Cam({ angle = 90 }: { angle?: number }) {
  return (
    <group rotation={[((90 - angle) * Math.PI) / 180, 0, 0]}>
      <Box size={[2.7, 4.0, 0.16]} at={[0, 2.0, 0]} color="#1a1a1a" />
      <Box size={[2.0, 1.2, 0.3]} at={[0, 0.9, 0.2]} color="#bfc5cc" metal={0.7} rough={0.3} />
      <Box size={[0.85, 0.85, 0.45]} at={[0, 2.9, 0.3]} color="#111" />
      <mesh position={[0, 2.9, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.25, 20]} />
        <meshStandardMaterial color="#1c7ed6" metalness={0.5} roughness={0.1} />
      </mesh>
    </group>
  );
}

/** The OLED's screen is a small canvas texture, redrawn when the text changes. */
function Oled({ text }: { text?: string }) {
  const tex = useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const g = c.getContext("2d")!;
    g.fillStyle = "#03070c";
    g.fillRect(0, 0, 256, 128);
    if (text) {
      g.fillStyle = "#7fdcff";
      g.font = "bold 34px monospace";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(text, 128, 64, 240);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [text]);
  useEffect(() => () => tex?.dispose(), [tex]);
  return (
    <group>
      <Box size={[2.7, 0.16, 2.7]} at={[0, 0.2, 0]} color="#0b3d91" />
      <mesh position={[0, 0.33, 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 1.3]} />
        <meshBasicMaterial map={tex ?? undefined} color={tex ? "#ffffff" : "#050505"} />
      </mesh>
      <Header from={-0.381} count={4} z={-1.15} y={0.45} />
    </group>
  );
}

function Power5v() {
  return (
    <group>
      <Box size={[3.5, 0.16, 5.3]} at={[0, 0.3, 0]} color={PCB_GREEN} />
      <Box size={[1.2, 0.9, 1.0]} at={[-1.0, 0.8, 1.8]} color="#111" />
      <Box size={[0.8, 0.8, 0.8]} at={[1.0, 0.75, 1.9]} color="#c9ced4" metal={0.8} />
      <Header from={1.2} count={2} z={-2.0} y={1.0} />
    </group>
  );
}

function IrSensor() {
  return (
    <group>
      <Box size={[3.2, 0.16, 1.4]} at={[0, 0.3, 0]} color="#1a1a1a" />
      <Box size={[0.5, 0.5, 0.5]} at={[1.2, 0.0, -0.3]} color="#ddd" />
      <Box size={[0.5, 0.5, 0.5]} at={[1.2, 0.0, 0.3]} color="#111" />
    </group>
  );
}

function Torch() {
  return (
    <group rotation={[0, 0, 0]}>
      <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[1.0, 0.8, 8, 20]} />
        <meshStandardMaterial color="#343a40" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.2, -4.05]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 20]} />
        <meshStandardMaterial color="#fff" emissive="#fff3bf" emissiveIntensity={3} side={THREE.DoubleSide} />
      </mesh>
      <spotLight position={[0, 1.2, -4.2]} angle={0.5} penumbra={0.6} intensity={60} distance={40} color="#fff3bf" target-position={[0, 0, -20]} />
    </group>
  );
}

export interface ModelState {
  on?: boolean;
  dir?: number;
  burnt?: boolean;
  lit?: number;
  angle?: number;
  text?: string;
  switchOn?: boolean;
  onSwitch?: () => void;
}

/** The model for a placed part. */
export function PartModel({ part, state }: { part: PlacedPart; state: ModelState }) {
  const on = !!state.on;
  switch (part.type) {
    case "battery2":
      return <BatteryBox n={2} cols={2} size={PARTS.battery2.size} lead={PARTS.battery2.pins[0].at[0]} on={!!state.switchOn} onToggle={state.onSwitch} />;
    case "battery4":
      return <BatteryBox n={4} cols={2} size={PARTS.battery4.size} lead={PARTS.battery4.pins[0].at[0]} on={!!state.switchOn} onToggle={state.onSwitch} />;
    case "battery6":
      return <BatteryBox n={6} cols={3} size={PARTS.battery6.size} lead={PARTS.battery6.pins[0].at[0]} on={!!state.switchOn} onToggle={state.onSwitch} />;
    case "led":
      return <Led color={part.props?.color} on={on} burnt={state.burnt} />;
    case "resistor":
      return <Resistor value={part.props?.value} />;
    case "buzzer":
      return <Buzzer on={on} />;
    case "minimotor":
      return <MiniMotor on={on} dir={state.dir} fan={part.props?.fan} />;
    case "bomotor":
      return <BoMotor on={on} dir={state.dir} />;
    case "ldr":
      return <Ldr lit={state.lit} />;
    case "bc547":
      return <Bc547 on={on} />;
    case "breadboard":
      return <Breadboard />;
    case "uno":
      return <Uno />;
    case "unoShield":
      return <Uno shield />;
    case "hcsr04":
      return <Hcsr04 />;
    case "sg90":
      return <Sg90 angle={state.angle} />;
    case "irsensor":
      return <IrSensor />;
    case "esp32":
      return <Esp32 />;
    case "esp32cam":
      return <Esp32Cam angle={state.angle} />;
    case "oled":
      return <Oled text={state.text} />;
    case "power5v":
      return <Power5v />;
    case "chassis":
      return <Chassis />;
    case "robotBody":
      return <RobotBody />;
    case "torch":
      return <Torch />;
  }
}
