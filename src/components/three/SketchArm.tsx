"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

/**
 * The JOVE hero arm: a real 3D reconstruction of the pencil-sketch six-axis arm, with the drawing
 * baked into its texture. Rendered unlit so it reads as a hand drawing from every angle.
 *
 * Asset pipeline: clean sketch image → Tripo H3.1 image-to-3D → gltf-transform (weld, simplify to
 * ~99k triangles, 2048px WebP texture, meshopt). 1.6 MB. Bump the file's version suffix when replacing it.
 */
export const ARM_URL = "/models/jove-arm-v1.glb";
/** World-space height of the arm. */
export const ARM_HEIGHT = 2.12;

const PAPER = "#f5f1e8";

/**
 * Joint anchors in the model's own space (bounding box centred on the origin, ~0.98 tall):
 * base, shoulder, wrist, gripper. (The elbow sits at the frame edge, so it carries no label.)
 */
const ANCHORS: [number, number, number][] = [
  [0.02, -0.4, -0.19],
  [0.17, -0.175, -0.18],
  [0.1, 0.25, 0.18],
  [0.0, 0.05, 0.33],
];
/** The pose the arm was drawn in (it is holding the cube). */
const POSE_VALUES = ["", "+58.0°", "−31.5°", "GRIP"];

export interface SketchArmProps {
  pointer: React.RefObject<{ x: number; y: number }>;
  /** Yaw (radians) at which the arm faces the camera side-on, reaching towards the headline. */
  facing?: number;
  /** Screen-space position of joint anchor `index` (px in the canvas), every frame. */
  onLabelPlace?: (index: number, x: number, y: number, visible: boolean, canvasWidth: number) => void;
  /** Live readout text for anchor `index`. */
  onLabelValue?: (index: number, text: string) => void;
}

export function SketchArm({ pointer, facing = -0.97, onLabelPlace, onLabelValue }: SketchArmProps) {
  const gltf = useGLTF(ARM_URL, false, true);
  const pivot = useRef<THREE.Group>(null);
  const st = useRef({ t: 0, px: 0, frame: 0 });

  const { center, scale } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    return { center: box.getCenter(new THREE.Vector3()), scale: ARM_HEIGHT / Math.max(size.y, 1e-6) };
  }, [gltf]);

  // Swap the PBR material for an unlit one so the drawing keeps its exact pencil tones (whites sit on the paper).
  useLayoutEffect(() => {
    const made: THREE.Material[] = [];
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || mesh.userData.joveSketch) return;
      const src = mesh.material as THREE.MeshStandardMaterial;
      if (src.map) src.map.anisotropy = 8;
      const mat = new THREE.MeshBasicMaterial({ map: src.map ?? null, color: PAPER, toneMapped: false });
      mesh.material = mat;
      mesh.userData.joveSketch = true;
      made.push(mat);
    });
    return () => made.forEach((m) => m.dispose());
  }, [gltf]);

  useEffect(() => {
    POSE_VALUES.forEach((v, i) => v && onLabelValue?.(i, v));
  }, [onLabelValue]);

  const anchors = useMemo(() => ANCHORS.map((a) => new THREE.Vector3(...a).multiplyScalar(scale)), [scale]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const g = pivot.current;
    if (!g) return;
    const s = st.current;
    const dt = Math.min(delta, 1 / 20);
    s.t += dt;
    s.frame += 1;
    const p = pointer.current ?? { x: 0, y: 0 };
    s.px = THREE.MathUtils.damp(s.px, p.x, 2.4, dt);

    // slow turntable sway + pointer parallax — the drawing turns in space
    const sway = Math.sin(s.t * 0.3) * 0.2 + Math.sin(s.t * 0.13 + 1.2) * 0.07 + s.px * 0.26;
    g.rotation.y = facing + sway;
    g.updateMatrixWorld();

    if (onLabelPlace) {
      const { width, height } = state.size;
      for (let i = 0; i < anchors.length; i++) {
        tmp.copy(anchors[i]);
        g.localToWorld(tmp).project(state.camera);
        onLabelPlace(i, ((tmp.x + 1) / 2) * width, ((1 - tmp.y) / 2) * height, tmp.z < 1, width);
      }
    }
    if (onLabelValue && s.frame % 6 === 0) {
      const deg = THREE.MathUtils.radToDeg(sway);
      onLabelValue(0, `${deg >= 0 ? "+" : "−"}${Math.abs(deg).toFixed(1).padStart(4, "0")}°`);
    }
  });

  return (
    <group ref={pivot} position={[0, ARM_HEIGHT / 2, 0]}>
      <group scale={scale}>
        <primitive object={gltf.scene} position={[-center.x, -center.y, -center.z]} />
      </group>
    </group>
  );
}

useGLTF.preload(ARM_URL, false, true);
