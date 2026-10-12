"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { BLOCK, fk, rad, REACH_MAX, REACH_MIN, TABLE_Y, type Pose } from "./kinematics";

/** Drawing scale: 10 SVG units per centimetre. World y points up, SVG y points down. */
export const S = 10;
export const VB = { x: -300, y: -300, w: 600, h: 450 };
export const INK = "#2B2B2B";
export const PAPER = "#F5F1E8";
export const GREY = "#7A7A7A";
export const MONO = "var(--font-mono-jb), monospace";
export const sx = (x: number) => x * S;
export const sy = (y: number) => -y * S;
const TABLE = sy(TABLE_Y);

/** SVG arc around (cx, cy) from world angle a0 to a1 (degrees, counter-clockwise positive). */
export function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const x0 = cx + r * Math.cos(rad(a0));
  const y0 = cy - r * Math.sin(rad(a0));
  const x1 = cx + r * Math.cos(rad(a1));
  const y1 = cy - r * Math.sin(rad(a1));
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 0 : 1} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

/** Text with a paper halo so it stays readable over grid lines and hatching. */
export function Tag({ x, y, children, anchor = "start", size = 14, muted, bold, className }: { x: number; y: number; children: React.ReactNode; anchor?: "start" | "middle" | "end"; size?: number; muted?: boolean; bold?: boolean; className?: string }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={MONO} fontSize={size} fontWeight={bold ? 700 : 500} fill={muted ? GREY : INK} stroke={PAPER} strokeWidth={5} paintOrder="stroke" strokeLinejoin="round" className={className}>
      {children}
    </text>
  );
}

export function BlockShape({ x, y, label, ghost }: { x: number; y: number; label?: string; ghost?: boolean }) {
  const h = (BLOCK * S) / 2;
  if (ghost) return <rect x={sx(x) - h} y={sy(y) - h} width={h * 2} height={h * 2} rx={3} fill="none" stroke={INK} strokeOpacity={0.4} strokeWidth={1.4} strokeDasharray="5 4" />;
  return (
    <g transform={`translate(${sx(x).toFixed(1)} ${sy(y).toFixed(1)})`}>
      <rect x={-h} y={-h} width={h * 2} height={h * 2} rx={3} fill={PAPER} stroke={INK} strokeWidth={2.2} />
      <rect x={-h + 5} y={-h + 5} width={h * 2 - 10} height={h * 2 - 10} rx={2} fill="none" stroke={INK} strokeOpacity={0.22} />
      {label && (
        <text y={6.5} textAnchor="middle" fontFamily={MONO} fontSize={18} fontWeight={700} fill={INK}>
          {label}
        </text>
      )}
    </g>
  );
}

/** A marked drop zone on the table. */
export function TargetPad({ x, label, filled }: { x: number; label: string; filled?: boolean }) {
  return (
    <g>
      {!filled && <BlockShape x={x} y={TABLE_Y + BLOCK / 2} ghost />}
      <rect x={sx(x) - 29} y={TABLE - 5} width={58} height={5} fill={INK} />
      <rect x={sx(x) - 17} y={TABLE + 23} width={34} height={19} rx={3} fill={filled ? INK : PAPER} stroke={INK} strokeWidth={1.4} />
      <text x={sx(x)} y={TABLE + 37} textAnchor="middle" fontFamily={MONO} fontSize={13} fontWeight={700} fill={filled ? PAPER : INK}>
        {label}
      </text>
    </g>
  );
}

interface ArmProps {
  pose: Pose;
  closed?: boolean;
  /** Something gripped (drawn between the links and the fingers). */
  held?: React.ReactNode;
  showAngles?: boolean;
  gripper?: boolean;
  /** Thin dashed "possible pose" drawing. */
  ghost?: boolean;
  tag?: string;
}

/** The two-link arm, drawn pencil-style around the shoulder at (0, 0). */
export function Arm({ pose, closed = false, held, showAngles = false, gripper = true, ghost = false, tag }: ArmProps) {
  const { elbow, tip } = fk(pose);
  const ex = sx(elbow.x);
  const ey = sy(elbow.y);
  const tx = sx(tip.x);
  const ty = sy(tip.y);
  if (ghost) {
    return (
      <g>
        <path d={`M0 0 L${ex.toFixed(1)} ${ey.toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)}`} fill="none" stroke={INK} strokeOpacity={0.6} strokeWidth={2.4} strokeDasharray="9 6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={ex} cy={ey} r={6} fill={PAPER} stroke={INK} strokeOpacity={0.7} strokeWidth={1.6} />
        {tag && (
          <Tag x={ex + (ex >= tx ? 12 : -12)} y={ey + (ey < ty ? -12 : 22)} anchor={ex >= tx ? "start" : "end"} size={13} bold>
            {tag}
          </Tag>
        )}
      </g>
    );
  }
  const a1 = pose.t1;
  const a2 = pose.t1 + pose.t2;
  const m1 = rad(a1 / 2);
  const m2 = rad(a1 + pose.t2 / 2);
  const g = held ? 20.5 : closed ? 6 : 31;
  return (
    <g>
      {showAngles && (
        <g fill="none" stroke={INK}>
          <line x1={0} y1={0} x2={70} y2={0} strokeOpacity={0.5} strokeDasharray="5 4" />
          {Math.abs(a1) > 1 && <path d={arcPath(0, 0, 40, 0, a1)} strokeWidth={1.4} />}
          <line x1={ex} y1={ey} x2={ex + 58 * Math.cos(rad(a1))} y2={ey - 58 * Math.sin(rad(a1))} strokeOpacity={0.5} strokeDasharray="5 4" />
          {Math.abs(pose.t2) > 1 && <path d={arcPath(ex, ey, 34, a1, a2)} strokeWidth={1.4} />}
        </g>
      )}
      <g strokeLinecap="round">
        <line x1={0} y1={0} x2={ex} y2={ey} stroke={INK} strokeWidth={21} />
        <line x1={0} y1={0} x2={ex} y2={ey} stroke={PAPER} strokeWidth={16.5} />
        <line x1={0} y1={0} x2={ex} y2={ey} stroke={INK} strokeOpacity={0.3} strokeWidth={1} strokeDasharray="8 5" />
        <line x1={ex} y1={ey} x2={tx} y2={ty} stroke={INK} strokeWidth={15.5} />
        <line x1={ex} y1={ey} x2={tx} y2={ty} stroke={PAPER} strokeWidth={11.5} />
        <line x1={ex} y1={ey} x2={tx} y2={ty} stroke={INK} strokeOpacity={0.3} strokeWidth={1} strokeDasharray="8 5" />
      </g>
      <circle r={10} fill={INK} />
      <circle r={3.2} fill={PAPER} />
      <circle cx={ex} cy={ey} r={8} fill={INK} />
      <circle cx={ex} cy={ey} r={2.6} fill={PAPER} />
      <circle cx={tx} cy={ty} r={5.2} fill={INK} />
      {held}
      {gripper && (
        <g transform={`translate(${tx.toFixed(1)} ${ty.toFixed(1)})`} fill={INK}>
          {!held && <rect x={-1.6} y={-27} width={3.2} height={22} />}
          <rect x={-g - 6} y={-30} width={g * 2 + 12} height={6} rx={2} />
          <rect x={-g - 6} y={-30} width={6} height={50} rx={2} />
          <rect x={g} y={-30} width={6} height={50} rx={2} />
        </g>
      )}
      {showAngles && (
        <g>
          <Tag x={58 * Math.cos(m1)} y={-58 * Math.sin(m1) + 5} anchor="middle" size={14} bold>
            θ₁
          </Tag>
          <Tag x={ex + 52 * Math.cos(m2)} y={ey - 52 * Math.sin(m2) + 5} anchor="middle" size={14} bold>
            θ₂
          </Tag>
        </g>
      )}
    </g>
  );
}

interface SceneProps {
  label: string;
  children?: React.ReactNode;
  /** Crop to a custom viewBox (theory figures). */
  vb?: string;
  envelope?: boolean;
  shade?: boolean;
  rulers?: boolean;
  axes?: boolean;
  className?: string;
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}

/** The side-elevation workcell: table, pedestal, axes, rulers and the dashed reach envelope. */
export function Scene({ label, children, vb, envelope = true, shade = false, rulers = true, axes = true, className, onClick }: SceneProps) {
  const id = `ra${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const ring = `M${-REACH_MAX * S} 0 A${REACH_MAX * S} ${REACH_MAX * S} 0 1 0 ${REACH_MAX * S} 0 A${REACH_MAX * S} ${REACH_MAX * S} 0 1 0 ${-REACH_MAX * S} 0 Z M${-REACH_MIN * S} 0 A${REACH_MIN * S} ${REACH_MIN * S} 0 1 0 ${REACH_MIN * S} 0 A${REACH_MIN * S} ${REACH_MIN * S} 0 1 0 ${-REACH_MIN * S} 0 Z`;
  return (
    <svg viewBox={vb ?? `${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className={cn("block h-auto w-full select-none", className)} role="img" aria-label={label} onClick={onClick}>
      <defs>
        <pattern id={`${id}h`} width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={8} stroke={INK} strokeWidth={1.2} strokeOpacity={0.32} />
        </pattern>
        <pattern id={`${id}l`} width={11} height={11} patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <line x1={0} y1={0} x2={0} y2={11} stroke={INK} strokeWidth={1} strokeOpacity={0.2} />
        </pattern>
        <clipPath id={`${id}c`}>
          <rect x={-400} y={-400} width={800} height={400 + TABLE} />
        </clipPath>
      </defs>
      {axes && (
        <g stroke={INK} strokeOpacity={0.22} strokeWidth={1}>
          <line x1={-300} y1={0} x2={300} y2={0} />
          <line x1={0} y1={-300} x2={0} y2={0} />
        </g>
      )}
      {(envelope || shade) && (
        <g clipPath={`url(#${id}c)`}>
          {shade && <path d={ring} fillRule="evenodd" fill={`url(#${id}l)`} />}
          <g fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth={1.3} strokeDasharray="8 6">
            <circle r={REACH_MAX * S} />
            <circle r={REACH_MIN * S} />
          </g>
        </g>
      )}
      {/* table */}
      <rect x={-400} y={TABLE} width={800} height={200} fill={PAPER} />
      <rect x={-400} y={TABLE} width={800} height={200} fill={`url(#${id}h)`} />
      <line x1={-400} y1={TABLE} x2={400} y2={TABLE} stroke={INK} strokeWidth={2.2} />
      {rulers && (
        <g>
          {Array.from({ length: 11 }, (_, i) => (i - 5) * 5).map((cm) => (
            <g key={cm}>
              <line x1={sx(cm)} y1={TABLE} x2={sx(cm)} y2={TABLE + (cm % 10 === 0 ? 8 : 5)} stroke={INK} strokeWidth={1.2} />
              {cm % 10 === 0 && (
                <Tag x={sx(cm)} y={TABLE + 20} anchor="middle" size={11} muted className="text-[13px] sm:text-[11px]">
                  {cm}
                </Tag>
              )}
            </g>
          ))}
        </g>
      )}
      {axes && (
        <g>
          <Tag x={288} y={-7} anchor="end" size={12} muted>
            x
          </Tag>
          <Tag x={9} y={-284} size={12} muted>
            y
          </Tag>
        </g>
      )}
      {/* pedestal */}
      <path d={`M-40 ${TABLE} L-21 12 A24 24 0 0 1 21 12 L40 ${TABLE} Z`} fill={PAPER} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <path d={`M-40 ${TABLE} L-21 12 A24 24 0 0 1 21 12 L40 ${TABLE} Z`} fill={`url(#${id}l)`} />
      <rect x={-52} y={TABLE - 7} width={104} height={7} rx={2} fill={INK} />
      {children}
    </svg>
  );
}
