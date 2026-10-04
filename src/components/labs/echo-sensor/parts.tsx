/**
 * Echo lab — shared SVG vocabulary (pencil-on-paper blueprint look).
 */
export const G = "#2B2B2B"; // graphite
export const B = "#7A7A7A"; // blueprint grey
export const P50 = "#FBF9F4"; // paper
export const BAD = "#8B3A3A";

const n1 = (v: number) => v.toFixed(1);

/** Pencil cross-hatching pattern. Reference it with fill={`url(#${id})`}. */
export function HatchDefs({ id, gap = 6, opacity = 0.45 }: { id: string; gap?: number; opacity?: number }) {
  return (
    <defs>
      <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2={gap} stroke={G} strokeWidth="1" opacity={opacity} />
      </pattern>
    </defs>
  );
}

/** A bundle of sound-wave arcs. dir = 1 travels right, dir = -1 travels left. */
export function Arcs({ x, y, n = 3, r0 = 10, gap = 8, dir = 1, spread = 0.62, width = 1.6, opacity = 1, dashed, color = G }: { x: number; y: number; n?: number; r0?: number; gap?: number; dir?: 1 | -1; spread?: number; width?: number; opacity?: number; dashed?: boolean; color?: string }) {
  const arcs = [];
  for (let i = 0; i < n; i++) {
    const r = r0 + i * gap;
    const dx = Math.cos(spread) * r * dir;
    const dy = Math.sin(spread) * r;
    arcs.push(<path key={i} d={`M${n1(x + dx)} ${n1(y - dy)}A${r} ${r} 0 0 ${dir > 0 ? 1 : 0} ${n1(x + dx)} ${n1(y + dy)}`} opacity={opacity * (0.45 + (0.55 * (i + 1)) / n)} />);
  }
  return (
    <g fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? "4 4" : undefined}>
      {arcs}
    </g>
  );
}

/** A straight arrow with an open pencil head. */
export function Arrow({ x1, y1, x2, y2, dashed, color = G, width = 1.5, head = 7 }: { x1: number; y1: number; x2: number; y2: number; dashed?: boolean; color?: string; width?: number; head?: number }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hx = (o: number) => `${n1(x2 - head * Math.cos(a + o))} ${n1(y2 - head * Math.sin(a + o))}`;
  return (
    <g stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={dashed ? "5 5" : undefined} />
      <path d={`M${hx(-0.45)}L${n1(x2)} ${n1(y2)}L${hx(0.45)}`} />
    </g>
  );
}

/** Horizontal engineering dimension line with a centred label. */
export function Dim({ x1, x2, y, label, size = 11, color = B, bg = P50 }: { x1: number; x2: number; y: number; label: string; size?: number; color?: string; bg?: string }) {
  const mid = (x1 + x2) / 2;
  const w = label.length * size * 0.62 + 10;
  const fits = Math.abs(x2 - x1) > w + 8;
  return (
    <g stroke={color} strokeWidth={1.1} fill="none">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} />
      <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} />
      {fits && <rect x={mid - w / 2} y={y - size * 0.75} width={w} height={size * 1.5} fill={bg} stroke="none" />}
      <text x={mid} y={fits ? y + size * 0.36 : y - 9} textAnchor="middle" fontSize={size} fill={color} stroke="none" className="font-mono font-semibold">
        {label}
      </text>
    </g>
  );
}

/**
 * An HC-SR04 seen from the side, facing right. (x, y) is the centre of the front face —
 * the top "eye" is the transmitter (T), the bottom one the receiver (R).
 */
export function SensorRight({ x, y, s = 1, labels = true }: { x: number; y: number; s?: number; labels?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={G} strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round">
      {/* header pins */}
      {[-12, -4, 4, 12].map((py) => (
        <line key={py} x1={-40} y1={py} x2={-27} y2={py} strokeWidth={1.3} />
      ))}
      {/* circuit board, edge-on */}
      <rect x={-27} y={-32} width={9} height={64} rx={2} fill={P50} />
      <line x1={-24} y1={-27} x2={-24} y2={27} strokeWidth={0.8} opacity={0.4} />
      {/* the two transducer cans */}
      {[-25, 5].map((cy, i) => (
        <g key={cy}>
          <rect x={-18} y={cy} width={18} height={20} rx={3} fill={P50} />
          <line x1={-5} y1={cy + 3} x2={-5} y2={cy + 17} strokeWidth={0.9} opacity={0.5} />
          {labels && (
            <text x={-11.5} y={cy + 14} textAnchor="middle" fontSize={10} fill={G} stroke="none" className="font-mono font-bold">
              {i === 0 ? "T" : "R"}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}

/** A rectangle drawn twice, like a pencil line that was gone over. */
export function PencilRect({ x, y, w, h, r = 3, fill = P50, width = 1.8 }: { x: number; y: number; w: number; h: number; r?: number; fill?: string; width?: number }) {
  return (
    <g strokeLinejoin="round">
      <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke={G} strokeWidth={width} />
      <rect x={x - 1.2} y={y + 1} width={w + 2} height={h - 1.4} rx={r + 1} fill="none" stroke={G} strokeWidth={0.7} opacity={0.35} />
    </g>
  );
}
