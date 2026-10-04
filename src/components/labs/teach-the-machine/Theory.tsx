"use client";

import { useId } from "react";
import { ConceptCard, KeyIdea, StageHeader } from "@/components/labs/framework/LabJourney";

const INK = "#2B2B2B";
const PAPER = "#F5F1E8";
const GREY = "#7A7A7A";
const MONO = "var(--font-mono-jb), monospace";

type P = [number, number];

function Txt({ x, y, children, anchor = "start", size = 9.5, bold, muted }: { x: number; y: number; children: React.ReactNode; anchor?: "start" | "middle" | "end"; size?: number; bold?: boolean; muted?: boolean }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={MONO} fontSize={size} fontWeight={bold ? 700 : 500} fill={muted ? GREY : INK} stroke={PAPER} strokeWidth={3} paintOrder="stroke" strokeLinejoin="round">
      {children}
    </text>
  );
}

/** A bolt (filled dot) or a nut (hollow square). */
function Mark({ p, c, ring, cross }: { p: P; c: 0 | 1; ring?: boolean; cross?: boolean }) {
  const [x, y] = p;
  return (
    <g>
      {ring && <circle cx={x} cy={y} r={8.5} fill={PAPER} stroke={INK} strokeWidth={0.9} strokeDasharray="2 2" />}
      {c === 0 ? <circle cx={x} cy={y} r={4.2} fill={INK} stroke={PAPER} strokeWidth={1} /> : <rect x={x - 3.8} y={y - 3.8} width={7.6} height={7.6} fill={PAPER} stroke={INK} strokeWidth={1.6} />}
      {cross && <path d={`M${x - 7} ${y - 7}L${x + 7} ${y + 7}M${x + 7} ${y - 7}L${x - 7} ${y + 7}`} stroke={INK} strokeWidth={1.8} strokeLinecap="round" />}
    </g>
  );
}

/** L-shaped axes with arrow tips. */
function Axes({ x0, y0, x1, y1, xl = "length →", yl = "weight →" }: { x0: number; y0: number; x1: number; y1: number; xl?: string; yl?: string }) {
  return (
    <g>
      <path d={`M${x0} ${y1} V${y0} H${x1}`} fill="none" stroke={INK} strokeWidth={1.3} />
      <path d={`M${x0 - 3} ${y1 + 5} L${x0} ${y1} L${x0 + 3} ${y1 + 5} M${x1 - 5} ${y0 - 3} L${x1} ${y0} L${x1 - 5} ${y0 + 3}`} fill="none" stroke={INK} strokeWidth={1.3} />
      <Txt x={(x0 + x1) / 2} y={y0 + 13} anchor="middle" size={8.5} muted>
        {xl}
      </Txt>
      <text transform={`translate(${x0 - 7} ${(y0 + y1) / 2}) rotate(-90)`} textAnchor="middle" fontFamily={MONO} fontSize={8.5} fill={GREY}>
        {yl}
      </text>
    </g>
  );
}

function Hatch({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={id} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1={0} y1={0} x2={0} y2={6} stroke={INK} strokeWidth={1} strokeOpacity={0.3} />
      </pattern>
    </defs>
  );
}
const useHatch = () => `tm${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

const BOLTS: P[] = [
  [222, 52],
  [246, 40],
  [262, 66],
  [236, 74],
  [278, 48],
  [254, 88],
  [210, 70],
];
const NUTS: P[] = [
  [86, 118],
  [108, 132],
  [70, 138],
  [124, 112],
  [96, 150],
  [136, 140],
  [58, 116],
];

function FigData() {
  const rows: { l: string; w: string; label: string; c: 0 | 1; p: P }[] = [
    { l: "42", w: "28", label: "bolt", c: 0, p: [276, 54] },
    { l: "12", w: "6", label: "nut", c: 1, p: [214, 132] },
    { l: "36", w: "22", label: "bolt", c: 0, p: [262, 78] },
  ];
  return (
    <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label="A table with the columns length, weight and label. Each row of the table becomes one point on a chart of length against weight.">
      <rect x={10} y={30} width={150} height={104} rx={3} fill={PAPER} stroke={INK} strokeWidth={1.2} />
      <rect x={10} y={30} width={150} height={24} fill={INK} />
      {["length", "weight", "label"].map((h, i) => (
        <text key={h} x={35 + i * 50} y={46} textAnchor="middle" fontFamily={MONO} fontSize={9} fontWeight={700} fill={PAPER}>
          {h}
        </text>
      ))}
      {rows.map((r, i) => (
        <g key={i}>
          {i > 0 && <line x1={10} y1={54 + i * 26.6} x2={160} y2={54 + i * 26.6} stroke={INK} strokeOpacity={0.2} />}
          <Txt x={35} y={71 + i * 26.6} anchor="middle">{`${r.l} mm`}</Txt>
          <Txt x={85} y={71 + i * 26.6} anchor="middle">{`${r.w} g`}</Txt>
          <Txt x={135} y={71 + i * 26.6} anchor="middle" bold>
            {r.label}
          </Txt>
          <path d={`M160 ${67 + i * 26.6} C185 ${67 + i * 26.6} 185 ${r.p[1]} ${r.p[0] - 9} ${r.p[1]}`} fill="none" stroke={INK} strokeOpacity={0.5} strokeDasharray="3 3" />
        </g>
      ))}
      <path d="M22 142 v6 h88 v-6" fill="none" stroke={INK} strokeWidth={1} />
      <Txt x={66} y={162} anchor="middle" size={9} bold>
        FEATURES
      </Txt>
      <path d="M118 142 v6 h34 v-6" fill="none" stroke={INK} strokeWidth={1} />
      <Txt x={135} y={162} anchor="middle" size={9} bold>
        LABEL
      </Txt>
      <Axes x0={200} y0={150} x1={308} y1={26} />
      {rows.map((r, i) => (
        <Mark key={i} p={r.p} c={r.c} />
      ))}
      <Txt x={85} y={20} anchor="middle" size={8.5} muted>
        ONE ROW = ONE EXAMPLE
      </Txt>
    </svg>
  );
}

function FigSplit() {
  const id = useHatch();
  const testB = new Set([1, 4]);
  const testN = new Set([2, 5]);
  return (
    <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label="A scatter plot where four of the fourteen points are ringed as test data. A bar below shows about 70 percent training data and 30 percent test data.">
      <Hatch id={id} />
      <Axes x0={36} y0={132} x1={306} y1={10} />
      {BOLTS.map((p, i) => (
        <Mark key={`b${i}`} p={[p[0], p[1] - 16]} c={0} ring={testB.has(i)} />
      ))}
      {NUTS.map((p, i) => (
        <Mark key={`n${i}`} p={[p[0] + 10, p[1] - 30]} c={1} ring={testN.has(i)} />
      ))}
      <rect x={36} y={154} width={189} height={14} fill={INK} />
      <rect x={225} y={154} width={81} height={14} fill={PAPER} stroke={INK} strokeWidth={1.2} />
      <rect x={225} y={154} width={81} height={14} fill={`url(#${id})`} />
      <text x={130} y={164.5} textAnchor="middle" fontFamily={MONO} fontSize={8.5} fontWeight={700} fill={PAPER}>
        TRAIN ≈ 70% · learn from these
      </text>
      <Txt x={265} y={164.5} anchor="middle" size={8.5} bold>
        TEST ≈ 30%
      </Txt>
      <Txt x={296} y={22} anchor="end" size={8.5} muted>
        ringed = locked away for the test
      </Txt>
    </svg>
  );
}

function FigBoundary() {
  const id = useHatch();
  return (
    <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label="Two groups of points separated by a line called the decision boundary. The side with bolts is hatched. A new unknown part lands on the bolt side, so it is classified as a bolt.">
      <Hatch id={id} />
      <path d="M118 10 L306 10 L306 150 L226 150 Z" fill={`url(#${id})`} />
      <Axes x0={36} y0={150} x1={306} y1={10} />
      <path d="M112 2 L230 158" stroke={INK} strokeWidth={2} />
      {BOLTS.map((p, i) => (
        <Mark key={`b${i}`} p={p} c={0} />
      ))}
      {NUTS.map((p, i) => (
        <Mark key={`n${i}`} p={[p[0], p[1] - 14]} c={1} />
      ))}
      <circle cx={206} cy={104} r={9} fill={PAPER} stroke={INK} strokeWidth={1.8} />
      <text x={206} y={108} textAnchor="middle" fontFamily={MONO} fontSize={11} fontWeight={700} fill={INK}>
        ?
      </text>
      <Txt x={220} y={126} size={8.5}>
        new part → “bolt”
      </Txt>
      <Txt x={104} y={22} anchor="end" size={8.5} bold>
        decision boundary ↘
      </Txt>
      <Txt x={300} y={24} anchor="end" size={8.5} muted>
        bolt territory
      </Txt>
      <Txt x={46} y={142} size={8.5} muted>
        nut territory
      </Txt>
    </svg>
  );
}

function FigLearners() {
  return (
    <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label="Left: k-nearest neighbours — a new point looks at its three nearest neighbours, two bolts and one nut, and becomes a bolt. Right: a perceptron — a straight line that is nudged whenever a point is on the wrong side.">
      <line x1={160} y1={22} x2={160} y2={172} stroke={INK} strokeOpacity={0.15} strokeDasharray="3 4" />
      {/* k-NN */}
      <circle cx={80} cy={92} r={36} fill="none" stroke={INK} strokeWidth={1.1} strokeDasharray="5 3" />
      {(
        [
          [102, 74, 0],
          [56, 80, 0],
          [92, 118, 1],
        ] as const
      ).map(([x, y, c], i) => (
        <g key={i}>
          <line x1={80} y1={92} x2={x} y2={y} stroke={INK} strokeWidth={1.4} />
          <Mark p={[x, y]} c={c} />
        </g>
      ))}
      {(
        [
          [128, 50, 0],
          [136, 96, 0],
          [30, 126, 1],
          [44, 148, 1],
          [118, 146, 1],
          [26, 52, 0],
        ] as const
      ).map(([x, y, c], i) => (
        <Mark key={i} p={[x, y]} c={c} />
      ))}
      <circle cx={80} cy={92} r={8} fill={PAPER} stroke={INK} strokeWidth={1.8} />
      <text x={80} y={96} textAnchor="middle" fontFamily={MONO} fontSize={10} fontWeight={700} fill={INK}>
        ?
      </text>
      <Txt x={80} y={16} anchor="middle" size={10} bold>
        k-NN
      </Txt>
      <Txt x={80} y={172} anchor="middle" size={8.5} muted>
        the 3 nearest vote: 2–1 → bolt
      </Txt>
      {/* perceptron */}
      <path d="M196 150 L296 44" stroke={INK} strokeOpacity={0.35} strokeWidth={1.4} strokeDasharray="5 4" />
      <path d="M184 136 L306 58" stroke={INK} strokeWidth={2} />
      <path d="M282 62 q8 6 4 16 m-5 -3 l5 3 l2 -6" fill="none" stroke={INK} strokeWidth={1.1} />
      {(
        [
          [222, 60, 0],
          [248, 48, 0],
          [204, 84, 0],
          [258, 124, 1],
          [282, 108, 1],
          [234, 142, 1],
        ] as const
      ).map(([x, y, c], i) => (
        <Mark key={i} p={[x, y]} c={c} />
      ))}
      <Txt x={240} y={16} anchor="middle" size={10} bold>
        PERCEPTRON
      </Txt>
      <Txt x={240} y={172} anchor="middle" size={8.5} muted>
        one line, nudged after each mistake
      </Txt>
    </svg>
  );
}

function FigOverfit() {
  const id = useHatch();
  const pts: [number, number, 0 | 1][] = [
    [96, 50, 0],
    [116, 36, 0],
    [126, 64, 0],
    [104, 76, 0],
    [42, 104, 1],
    [58, 122, 1],
    [34, 128, 1],
    [72, 106, 1],
    [108, 54, 1],
    [52, 112, 0],
  ];
  return (
    <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label="Two boundaries for the same data. On the left a wiggly boundary bends around two odd points — it has overfitted. On the right a simple smooth boundary ignores the odd points.">
      <Hatch id={id} />
      <line x1={160} y1={22} x2={160} y2={172} stroke={INK} strokeOpacity={0.15} strokeDasharray="3 4" />
      {/* overfitted */}
      <path d="M62 26 L146 26 L146 148 L112 148 C104 120 96 104 84 96 C74 90 70 84 66 76 C60 60 62 44 62 26 Z M100 54 a9 9 0 1 0 17 0 a9 9 0 1 0 -17 0 Z" fillRule="evenodd" fill={`url(#${id})`} />
      <path d="M62 26 C62 44 60 60 66 76 C70 84 74 90 84 96 C96 104 104 120 112 148" fill="none" stroke={INK} strokeWidth={1.6} />
      <circle cx={108.5} cy={54} r={9} fill={PAPER} stroke={INK} strokeWidth={1.4} />
      <circle cx={52} cy={112} r={9} fill={`url(#${id})`} stroke={INK} strokeWidth={1.4} />
      {pts.map(([x, y, c], i) => (
        <Mark key={i} p={[x, y]} c={c} />
      ))}
      <Txt x={84} y={16} anchor="middle" size={9.5} bold>
        OVERFITTED
      </Txt>
      <Txt x={84} y={166} anchor="middle" size={8.5} muted>
        memorised every dot
      </Txt>
      {/* simple */}
      <g transform="translate(160 0)">
        <path d="M58 26 L146 26 L146 148 L120 148 Z" fill={`url(#${id})`} />
        <path d="M58 26 L120 148" stroke={INK} strokeWidth={1.6} />
        {pts.map(([x, y, c], i) => (
          <Mark key={i} p={[x, y]} c={c} cross={i >= 8} />
        ))}
        <Txt x={84} y={16} anchor="middle" size={9.5} bold>
          JUST RIGHT
        </Txt>
        <Txt x={84} y={166} anchor="middle" size={8.5} muted>
          ignores the two odd ones
        </Txt>
      </g>
    </svg>
  );
}

function FigBias() {
  const id = useHatch();
  const many: P[] = [
    [34, 56],
    [50, 44],
    [66, 58],
    [82, 46],
    [98, 60],
    [42, 74],
    [58, 84],
    [74, 72],
    [90, 86],
    [106, 74],
    [50, 100],
    [82, 102],
  ];
  return (
    <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label="A training set with twelve bolts but only two nuts leads to an unfair model: in this lab's Biased dataset it scores 100 percent on bolts but only 50 percent on nuts.">
      <Hatch id={id} />
      <rect x={18} y={28} width={134} height={118} rx={3} fill="none" stroke={INK} strokeWidth={1.1} strokeDasharray="4 3" />
      {many.map((p, i) => (
        <Mark key={i} p={p} c={0} />
      ))}
      <Mark p={[58, 128]} c={1} />
      <Mark p={[90, 128]} c={1} />
      <Txt x={85} y={20} anchor="middle" size={9} bold>
        TRAINING DATA
      </Txt>
      <Txt x={85} y={164} anchor="middle" size={8.5} muted>
        12 bolts · only 2 nuts
      </Txt>
      <path d="M158 88 h18 m-5 -4 l5 4 l-5 4" fill="none" stroke={INK} strokeWidth={1.3} />
      <line x1={196} y1={146} x2={306} y2={146} stroke={INK} strokeWidth={1.3} />
      <rect x={212} y={46} width={30} height={100} fill={INK} />
      <rect x={262} y={96} width={30} height={50} fill={PAPER} stroke={INK} strokeWidth={1.3} />
      <rect x={262} y={96} width={30} height={50} fill={`url(#${id})`} />
      <Txt x={227} y={40} anchor="middle" size={10} bold>
        100%
      </Txt>
      <Txt x={277} y={90} anchor="middle" size={10} bold>
        50%
      </Txt>
      <Txt x={227} y={160} anchor="middle" size={8.5}>
        bolts
      </Txt>
      <Txt x={277} y={160} anchor="middle" size={8.5}>
        nuts
      </Txt>
      <Txt x={251} y={20} anchor="middle" size={9} bold>
        TEST ACCURACY
      </Txt>
    </svg>
  );
}

export function MlTheory() {
  return (
    <div>
      <StageHeader
        index="01"
        kicker="Theory"
        title="How does a machine learn from examples?"
        intro="Nobody writes a rule that says “a bolt is longer than 30 mm”. Instead we show the machine examples and let it work out the pattern itself. That is machine learning — and these six ideas are behind everything from spam filters to self-driving cars."
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <ConceptCard n={1} title="Data, features & labels" figure={<FigData />}>
          Machine learning starts with <strong>data</strong>: lots of examples. Each example is described by <strong>features</strong> — things the machine can measure, here length and weight. The answer we want is the <strong>label</strong>: bolt or nut. Put the features on two axes and every table row becomes a dot.
        </ConceptCard>
        <ConceptCard n={2} title="Training vs testing" figure={<FigSplit />}>
          We never show the machine all our examples. Most become <strong>training data</strong> — it learns from these. The rest are locked away as <strong>test data</strong>. Checking it on parts it has never seen is the only honest way to know whether it learned the pattern or just memorised the answers — like an exam with fresh questions.
        </ConceptCard>
        <ConceptCard n={3} title="Classification & the decision boundary" figure={<FigBoundary />}>
          Sorting things into groups is called <strong>classification</strong>. A trained classifier divides the chart into regions — bolt territory and nut territory. The border between them is the <strong>decision boundary</strong>. A new part simply gets the label of the region it lands in.
        </ConceptCard>
        <ConceptCard n={4} title="Two ways to learn" figure={<FigLearners />}>
          <strong>k-NN</strong> (k-nearest neighbours) remembers every example and lets the k closest ones vote. A <strong>perceptron</strong> — the ancestor of today&apos;s neural networks — draws one straight line and nudges it every time it gets a part wrong. You will train both.
        </ConceptCard>
        <ConceptCard n={5} title="Overfitting" figure={<FigOverfit />}>
          A boundary that twists around every single dot has <strong>overfitted</strong>: it memorised the training data, mistakes included. It scores 100% on what it has seen and worse on anything new. A simpler boundary that accepts a few errors usually works better in the real world.
        </ConceptCard>
        <ConceptCard n={6} title="Bias & fairness" figure={<FigBias />}>
          A machine only knows what its data shows. Train it on many bolts but hardly any nuts and it will be unfair to nuts. That is <strong>bias</strong>. When machines help decide things about people — loans, jobs, face unlock — biased data means real people are treated unfairly. Fair AI needs balanced data, tested group by group.
        </ConceptCard>
      </div>
      <KeyIdea>A machine-learning model is only as good — and only as fair — as the examples it learned from. Better data beats cleverer code.</KeyIdea>
      <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-6">
        <p className="annot text-blueprint">The recipe · every ML project</p>
        <ol className="mt-3 grid gap-3 text-sm text-charcoal sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Collect", "Gather labelled examples that represent every kind of case."],
            ["Split", "Lock some away as a test set before training starts."],
            ["Train", "Let the algorithm find the boundary from the training data."],
            ["Test & check fairness", "Measure accuracy on the test set — overall and for each group."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-graphite/40 font-mono text-xs font-semibold text-graphite">{i + 1}</span>
              <span>
                <strong className="block text-graphite">{t}</strong>
                {d}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
