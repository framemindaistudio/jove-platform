"use client";

import { ConceptCard, KeyIdea, StageHeader } from "@/components/labs/framework/LabJourney";

const G = "#2B2B2B";
const B = "#7A7A7A";
const P50 = "#FBF9F4";
const mono = "font-mono";

function Head({ x, y, a = 0, color = G }: { x: number; y: number; a?: number; color?: string }) {
  const h = 7;
  const p = (o: number) => `${(x - h * Math.cos(a + o)).toFixed(1)} ${(y - h * Math.sin(a + o)).toFixed(1)}`;
  return <path d={`M${p(-0.45)}L${x} ${y}L${p(0.45)}`} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />;
}

/* ───────────────────────── figures ───────────────────────── */

function IrModule({ x }: { x: number }) {
  return (
    <g stroke={G} strokeWidth={1.6} strokeLinejoin="round">
      <rect x={x - 34} y={18} width={68} height={20} rx={3} fill={P50} />
      <path d={`M${x - 22} 38v6a6 6 0 0 0 12 0v-6`} fill={P50} />
      <path d={`M${x + 10} 38v6a6 6 0 0 0 12 0v-6`} fill={G} />
      <text x={x - 16} y={14} textAnchor="middle" fontSize={8.5} fill={B} stroke="none" className={mono}>
        IR LED
      </text>
      <text x={x + 18} y={14} textAnchor="middle" fontSize={8.5} fill={B} stroke="none" className={mono}>
        EYE
      </text>
    </g>
  );
}

function FigIR() {
  return (
    <svg viewBox="0 0 320 160" role="img" aria-label="Two infrared sensors. Over white floor the light bounces back into the detector. Over black tape the light is absorbed and almost nothing returns." className="h-auto w-full">
      {/* white floor */}
      <IrModule x={82} />
      <rect x={20} y={112} width={124} height={10} fill={P50} stroke={G} strokeWidth={1.4} />
      <g stroke={G} strokeWidth={1.8} strokeLinecap="round">
        <line x1={66} y1={52} x2={80} y2={108} />
        <line x1={84} y1={108} x2={98} y2={54} />
      </g>
      <Head x={80} y={108} a={Math.atan2(56, 14)} />
      <Head x={98} y={54} a={Math.atan2(-54, 14)} />
      <text x={82} y={140} textAnchor="middle" fontSize={10} fill={G} className={`${mono} font-bold`}>
        WHITE → BOUNCES BACK
      </text>
      <text x={82} y={153} textAnchor="middle" fontSize={8.5} fill={B} className={mono}>
        reading: “bright”
      </text>
      {/* black tape */}
      <IrModule x={238} />
      <rect x={176} y={112} width={124} height={10} fill={G} stroke={G} strokeWidth={1.4} />
      <line x1={222} y1={52} x2={236} y2={108} stroke={G} strokeWidth={1.8} strokeLinecap="round" />
      <Head x={236} y={108} a={Math.atan2(56, 14)} />
      <line x1={240} y1={104} x2={246} y2={82} stroke={B} strokeWidth={1.1} strokeDasharray="2 4" strokeLinecap="round" />
      <text x={238} y={140} textAnchor="middle" fontSize={10} fill={G} className={`${mono} font-bold`}>
        BLACK → SOAKED UP
      </text>
      <text x={238} y={153} textAnchor="middle" fontSize={8.5} fill={B} className={mono}>
        reading: “dark”
      </text>
      <line x1={160} y1={12} x2={160} y2={150} stroke={B} strokeWidth={0.8} strokeDasharray="2 5" />
    </svg>
  );
}

function FigCases() {
  const cases = [
    { shift: 0, cross: false, l: false, r: false, dx: 0, text: "STRAIGHT" },
    { shift: -10, cross: false, l: true, r: false, dx: -16, text: "LEFT" },
    { shift: 10, cross: false, l: false, r: true, dx: 16, text: "RIGHT" },
    { shift: 0, cross: true, l: true, r: true, dx: 0, text: "STRAIGHT" },
  ];
  return (
    <svg viewBox="0 0 320 160" role="img" aria-label="The four situations two sensors can be in: line between them, line under the left sensor, line under the right sensor, and both on black at a crossing." className="h-auto w-full">
      {cases.map((c, i) => {
        const cx = 42 + i * 79;
        return (
          <g key={i}>
            <rect x={cx - 33} y={8} width={66} height={118} rx={4} fill="none" stroke={B} strokeWidth={0.8} strokeDasharray="3 4" />
            <rect x={cx + c.shift - 6} y={50} width={12} height={76} fill={G} opacity={0.88} />
            {c.cross && <rect x={cx - 33} y={86} width={66} height={12} fill={G} opacity={0.88} />}
            {/* steering arrow */}
            <path d={`M${cx} 46Q${cx} 30 ${cx + c.dx} 20`} fill="none" stroke={G} strokeWidth={1.8} strokeLinecap="round" />
            <Head x={cx + c.dx} y={20} a={Math.atan2(-10, c.dx)} />
            {/* sensor bar */}
            <rect x={cx - 20} y={84} width={40} height={16} rx={5} fill={P50} stroke={G} strokeWidth={1.4} />
            <circle cx={cx - 10} cy={92} r={5} fill={c.l ? G : P50} stroke={G} strokeWidth={1.6} />
            <circle cx={cx + 10} cy={92} r={5} fill={c.r ? G : P50} stroke={G} strokeWidth={1.6} />
            <text x={cx} y={142} textAnchor="middle" fontSize={9.5} fill={G} className={`${mono} font-bold`}>
              {c.text}
            </text>
            <text x={cx} y={154} textAnchor="middle" fontSize={8} fill={B} className={mono}>
              L {c.l ? "■" : "□"} · R {c.r ? "■" : "□"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function FigLoop() {
  const box = (x: number, label: string, sub: string) => (
    <g key={label}>
      <rect x={x} y={30} width={80} height={40} rx={5} fill={P50} stroke={G} strokeWidth={1.7} />
      <text x={x + 40} y={48} textAnchor="middle" fontSize={11} fill={G} className={`${mono} font-bold`}>
        {label}
      </text>
      <text x={x + 40} y={61} textAnchor="middle" fontSize={8} fill={B} className={mono}>
        {sub}
      </text>
    </g>
  );
  return (
    <svg viewBox="0 0 320 160" role="img" aria-label="A feedback loop: sense with the sensors, decide with the rules, act with the motors, then the robot has moved so it senses again." className="h-auto w-full">
      {box(16, "SENSE", "IR sensors")}
      {box(120, "DECIDE", "rules / maths")}
      {box(224, "ACT", "two motors")}
      <g stroke={G} strokeWidth={1.7} strokeLinecap="round" fill="none">
        <line x1={98} y1={50} x2={116} y2={50} />
        <line x1={202} y1={50} x2={220} y2={50} />
        <path d="M264 72v38a10 10 0 0 1-10 10H66a10 10 0 0 1-10-10V76" strokeDasharray="6 5" />
      </g>
      <Head x={118} y={50} />
      <Head x={222} y={50} />
      <Head x={56} y={73} a={-Math.PI / 2} />
      <rect x={84} y={110} width={152} height={20} fill={P50} />
      <text x={160} y={124} textAnchor="middle" fontSize={9} fill={G} className={`${mono} font-semibold`}>
        bot moves · readings change
      </text>
      <text x={160} y={150} textAnchor="middle" fontSize={9} fill={B} className={mono}>
        ROUND AND ROUND — HUNDREDS OF TIMES A SECOND
      </text>
    </svg>
  );
}

function FigP() {
  return (
    <svg viewBox="0 0 320 160" role="img" aria-label="Graph of steering against error. Rules give an all-or-nothing step. Proportional control gives a straight sloping line: small error, small correction." className="h-auto w-full">
      <g stroke={B} strokeWidth={1}>
        <line x1={30} y1={82} x2={296} y2={82} />
        <line x1={163} y1={14} x2={163} y2={146} />
      </g>
      <Head x={296} y={82} color={B} />
      <Head x={163} y={14} a={-Math.PI / 2} color={B} />
      <text x={296} y={98} textAnchor="end" fontSize={9} fill={B} className={mono}>
        error →
      </text>
      <text x={170} y={22} fontSize={9} fill={B} className={mono}>
        steer
      </text>
      {/* rules: a step */}
      <path d="M46 122H163V42H280" fill="none" stroke={G} strokeWidth={1.5} strokeDasharray="5 4" />
      {/* proportional: a slope */}
      <line x1={50} y1={134} x2={276} y2={30} stroke={G} strokeWidth={2.4} strokeLinecap="round" />
      <text x={34} y={40} fontSize={9} fill={G} className={mono}>
        RULES (dashed):
      </text>
      <text x={34} y={52} fontSize={9} fill={G} className={mono}>
        all or nothing
      </text>
      <text x={178} y={124} fontSize={9} fill={G} className={`${mono} font-bold`}>
        P-CONTROL (solid):
      </text>
      <text x={178} y={136} fontSize={9} fill={G} className={`${mono} font-bold`}>
        steer = Kp × error
      </text>
      <circle cx={163} cy={82} r={3} fill={G} />
    </svg>
  );
}

function FigTuning() {
  const wave = (y: number, amp: (t: number) => number, freq: number) => {
    let d = "";
    for (let i = 0; i <= 110; i++) {
      const t = i / 110;
      d += `${i ? "L" : "M"}${(84 + t * 220).toFixed(1)} ${(y + amp(t) * Math.cos(t * freq)).toFixed(1)}`;
    }
    return d;
  };
  const rows: [string, number, string][] = [
    ["TOO LOW", 30, wave(30, (t) => -14 * Math.exp(-t * 1.1), 0)],
    ["TOO HIGH", 80, wave(80, (t) => -14 * (0.75 + t * 0.5), 34)],
    ["JUST RIGHT", 130, wave(130, (t) => -14 * Math.exp(-t * 6), 9)],
  ];
  return (
    <svg viewBox="0 0 320 160" role="img" aria-label="Three paths after the robot is nudged off the line: gain too low returns very slowly, gain too high wobbles wildly, gain just right settles quickly." className="h-auto w-full">
      {rows.map(([label, y, d]) => (
        <g key={label}>
          <line x1={84} y1={y} x2={304} y2={y} stroke={G} strokeWidth={9} opacity={0.16} strokeLinecap="round" />
          <path d={d} fill="none" stroke={G} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={84} cy={y - 14} r={3} fill={G} />
          <text x={8} y={y + 3} fontSize={9} fill={G} className={`${mono} font-bold`}>
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function FigThreshold() {
  const tiles = [
    { cover: 0.1, label: "10%" },
    { cover: 0.5, label: "50%" },
    { cover: 0.95, label: "95%" },
  ];
  return (
    <svg viewBox="0 0 320 160" role="img" aria-label="A sensor a little, half and almost fully over the tape reads 10, 50 and 95 percent dark. A threshold at 50 percent decides which readings count as black." className="h-auto w-full">
      {tiles.map((t, i) => {
        const x = 24 + i * 100;
        const r = 15;
        const tapeX = x + 36 + r - t.cover * 2 * r;
        return (
          <g key={t.label}>
            <rect x={x} y={12} width={72} height={58} fill={P50} stroke={B} strokeWidth={0.8} />
            <rect x={tapeX} y={12} width={x + 72 - tapeX} height={58} fill={G} opacity={0.85} />
            <circle cx={x + 36} cy={41} r={r} fill="none" stroke={P50} strokeWidth={4} />
            <circle cx={x + 36} cy={41} r={r} fill="none" stroke={G} strokeWidth={1.8} strokeDasharray="4 3" />
            <text x={x + 36} y={84} textAnchor="middle" fontSize={10} fill={G} className={`${mono} font-bold`}>
              {t.label} dark
            </text>
          </g>
        );
      })}
      {/* the meter */}
      <rect x={24} y={104} width={272} height={14} rx={7} fill={P50} stroke={G} strokeWidth={1.4} />
      <rect x={160} y={104} width={136} height={14} fill={G} opacity={0.85} />
      <line x1={160} y1={96} x2={160} y2={126} stroke={G} strokeWidth={2} />
      <text x={160} y={142} textAnchor="middle" fontSize={9.5} fill={G} className={`${mono} font-bold`}>
        THRESHOLD 50%
      </text>
      <text x={92} y={142} textAnchor="middle" fontSize={9} fill={B} className={mono}>
        “white”
      </text>
      <text x={232} y={142} textAnchor="middle" fontSize={9} fill={B} className={mono}>
        “BLACK”
      </text>
    </svg>
  );
}

/* ───────────────────────── the stage ───────────────────────── */

const TRUTH: [string, string, string, string][] = [
  ["white", "white", "Straight", "The line is between the sensors. All good."],
  ["BLACK", "white", "Steer left", "The line has slipped under the left sensor."],
  ["white", "BLACK", "Steer right", "The line has slipped under the right sensor."],
  ["BLACK", "BLACK", "Straight", "A crossing — carry on over it."],
];

export function LineTheory() {
  return (
    <div>
      <StageHeader
        index="01"
        kicker="Theory"
        title="How a robot stays on the line"
        intro="Warehouse robots, factory carts and competition racers all follow lines painted on the floor. None of them can “see” the line the way you do. They have two tiny infrared eyes, two motors and a loop that runs hundreds of times a second."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <ConceptCard n={1} title="Black absorbs, white reflects" figure={<FigIR />}>
          <p>
            Each sensor is an infrared LED sitting next to a light detector, both pointing at the floor. White paper bounces the light straight back. <strong>Black tape soaks most of it up</strong>, so the detector sees almost nothing.
          </p>
          <p className="mt-2">Infrared is invisible to us, but to the sensor a black line on a white floor is as clear as day and night.</p>
        </ConceptCard>

        <ConceptCard n={2} title="Two sensors, four situations" figure={<FigCases />}>
          <p>
            Put one sensor on each side of the line. Whichever sensor sees black tells the robot which way the line has wandered — <strong>steer towards the sensor that sees black</strong>.
          </p>
        </ConceptCard>

        <ConceptCard n={3} title="The feedback loop" figure={<FigLoop />}>
          <p>
            The robot never plans the whole lap. It just repeats three tiny steps — <strong>sense, decide, act</strong> — over and over. Every action changes what the sensors see next, which feeds back into the next decision.
          </p>
          <p className="mt-2">That circle is called a feedback loop. Your fridge, a cruise-control car and a drone all run one.</p>
        </ConceptCard>

        <ConceptCard n={4} title="A threshold makes it yes or no" figure={<FigThreshold />}>
          <p>
            A real sensor does not say “black” or “white” — it gives a number for <em>how dark</em> the floor is. A <strong>threshold</strong> turns that number into a decision: darker than this counts as black.
          </p>
        </ConceptCard>

        <ConceptCard n={5} title="Proportional steering" figure={<FigP />}>
          <p>
            If-then rules are all-or-nothing, so the robot zig-zags. <strong>Proportional (P) control</strong> is smoother: measure how far off you are (the <em>error</em>) and steer by that much.
          </p>
          <p className="mt-2 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper px-3 py-2 font-mono text-[13px] font-semibold text-graphite">
            error = L − R
            <br />
            steer = Kp × error
          </p>
        </ConceptCard>

        <ConceptCard n={6} title="Tuning is engineering" figure={<FigTuning />}>
          <p>
            The number Kp is the <strong>gain</strong>. Too low and the robot is lazy — it drifts off on bends. Too high and it over-corrects and wobbles. Engineers find the sweet spot by testing, changing one thing and testing again.
          </p>
          <p className="mt-2">Speed matters too: the faster you go, the less time the loop has to react.</p>
        </ConceptCard>
      </div>

      <div className="mt-6 overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50">
        <div className="border-b border-graphite/10 px-5 py-3">
          <p className="annot text-charcoal">Truth table · the classic two-sensor line follower</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-sm">
            <thead>
              <tr className="border-b border-graphite/10 font-mono text-[11px] uppercase tracking-wider text-blueprint">
                <th scope="col" className="px-5 py-2 font-medium">
                  Left sensor
                </th>
                <th scope="col" className="px-5 py-2 font-medium">
                  Right sensor
                </th>
                <th scope="col" className="px-5 py-2 font-medium">
                  Action
                </th>
                <th scope="col" className="px-5 py-2 font-medium">
                  Why
                </th>
              </tr>
            </thead>
            <tbody>
              {TRUTH.map(([l, r, act, why]) => (
                <tr key={l + r} className="border-b border-graphite/8 last:border-0">
                  <td className={l === "BLACK" ? "px-5 py-2.5 font-mono font-bold" : "px-5 py-2.5 font-mono text-blueprint"}>{l}</td>
                  <td className={r === "BLACK" ? "px-5 py-2.5 font-mono font-bold" : "px-5 py-2.5 font-mono text-blueprint"}>{r}</td>
                  <td className="px-5 py-2.5 font-semibold">{act}</td>
                  <td className="px-5 py-2.5 text-charcoal">{why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <KeyIdea>Sense → decide → act → repeat. A line follower is not clever because of one big decision, but because of thousands of tiny corrections every lap.</KeyIdea>
    </div>
  );
}
