"use client";

import { ConceptCard, KeyIdea, StageHeader } from "@/components/labs/framework/LabJourney";
import { Arcs, Arrow, B, Dim, G, HatchDefs, P50, PencilRect, SensorRight } from "./parts";

const mono = "font-mono";

/* ───────────────────────── figures ───────────────────────── */

function FigWave() {
  // Air molecules bunch up and spread out: line spacing = 5.6 + 4.3·cos(0.72·i)
  const lines = Array.from({ length: 41 }, (_, i) => 62 + i * 5.6 + 6 * Math.sin(i * 0.72));
  const curve = Array.from({ length: 58 }, (_, i) => {
    const x = 62 + i * 4.1;
    return `${i ? "L" : "M"}${x.toFixed(1)} ${(116 + 10 * Math.cos((0.72 * (x - 62)) / 5.6)).toFixed(1)}`;
  }).join("");
  return (
    <svg viewBox="0 0 320 160" role="img" aria-label="A speaker pushing air into bands of squeezed and stretched air, drawn above a matching pressure wave." className="h-auto w-full">
      <path d="M16 54h13l15-13v52l-15-13H16z" fill={P50} stroke={G} strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M21 58v18" stroke={G} strokeWidth={0.8} opacity={0.4} />
      {lines.map((x, i) => (
        <line key={i} x1={x} y1={38} x2={x} y2={96} stroke={G} strokeWidth={1.1} opacity={0.75} />
      ))}
      <path d={curve} fill="none" stroke={G} strokeWidth={1.6} strokeLinecap="round" />
      <line x1={62} y1={116} x2={300} y2={116} stroke={B} strokeWidth={0.8} strokeDasharray="2 4" />
      <Dim x1={86.4} x2={135.3} y={150} label="1 wave" size={9} />
      <text x={62} y={26} fontSize={9.5} fill={B} className={mono}>
        SQUEEZED · STRETCHED · SQUEEZED …
      </text>
      <text x={300} y={150} fontSize={9.5} fill={B} textAnchor="end" className={mono}>
        air pressure
      </text>
    </svg>
  );
}

function FigEcho() {
  return (
    <svg viewBox="0 0 320 160" role="img" aria-label="A child shouts towards a cliff. The sound travels out, bounces off the rock and comes back as an echo." className="h-auto w-full">
      <HatchDefs id="echo-th-cliff" />
      <line x1={10} y1={136} x2={310} y2={136} stroke={B} strokeWidth={1} strokeDasharray="2 4" />
      {/* child */}
      <g stroke={G} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx={36} cy={78} r={9} fill={P50} />
        <path d="M36 87v28M36 115l-9 21M36 115l9 21M36 95l13-9M36 95l-10 8" />
        <path d="M43 79l4 1" />
      </g>
      {/* cliff */}
      <path d="M262 136V44l13-10 11 9 14-7 10 8v92z" fill="url(#echo-th-cliff)" stroke={G} strokeWidth={1.8} strokeLinejoin="round" />
      <Arcs x={52} y={72} n={4} r0={12} gap={10} />
      <Arrow x1={104} y1={58} x2={248} y2={58} />
      <text x={176} y={50} fontSize={10} fill={G} textAnchor="middle" className={`${mono} font-semibold`}>
        SHOUT →
      </text>
      <Arcs x={258} y={104} n={4} r0={12} gap={10} dir={-1} dashed />
      <Arrow x1={206} y1={118} x2={62} y2={118} dashed />
      <text x={134} y={110} fontSize={10} fill={B} textAnchor="middle" className={`${mono} font-semibold`}>
        ← ECHO
      </text>
    </svg>
  );
}

function FigSpeed() {
  return (
    <svg viewBox="0 0 320 160" role="img" aria-label="A 343 metre track, as long as about 17 cricket pitches placed end to end, that sound covers in one second." className="h-auto w-full">
      <HatchDefs id="echo-th-pitch" gap={4} opacity={0.4} />
      {/* stopwatch */}
      <g stroke={G} strokeWidth={1.7} fill={P50} strokeLinecap="round">
        <circle cx={160} cy={36} r={17} />
        <path d="M160 19v-6M154 12h12M160 36V25M160 36l7 5" fill="none" />
      </g>
      <text x={186} y={41} fontSize={13} fill={G} className={`${mono} font-bold`}>
        1 s
      </text>
      {/* 17 cricket pitches */}
      {Array.from({ length: 17 }, (_, i) => (
        <rect key={i} x={24 + i * 16} y={78} width={16} height={18} fill={i % 2 ? P50 : "url(#echo-th-pitch)"} stroke={G} strokeWidth={1} />
      ))}
      <Arcs x={8} y={87} n={3} r0={8} gap={6} width={1.3} />
      <Arrow x1={24} y1={66} x2={296} y2={66} />
      <Dim x1={24} x2={296} y={116} label="343 m" size={11} color={G} />
      <text x={160} y={142} fontSize={9.5} fill={B} textAnchor="middle" className={mono}>
        ≈ 17 CRICKET PITCHES, EVERY SECOND
      </text>
    </svg>
  );
}

function FigHalf() {
  return (
    <svg viewBox="0 0 320 160" role="img" aria-label="A sensor and a wall. The sound travels the distance d to the wall and the same distance d back, so the total trip is two times d." className="h-auto w-full">
      <HatchDefs id="echo-th-wall" />
      <SensorRight x={62} y={72} s={0.9} />
      <rect x={268} y={22} width={16} height={100} fill="url(#echo-th-wall)" stroke={G} strokeWidth={1.8} />
      <Arrow x1={70} y1={54} x2={262} y2={54} />
      <text x={166} y={46} fontSize={11} fill={G} textAnchor="middle" className={`${mono} font-bold`}>
        d (out)
      </text>
      <Arrow x1={262} y1={90} x2={70} y2={90} dashed />
      <text x={166} y={106} fontSize={11} fill={B} textAnchor="middle" className={`${mono} font-bold`}>
        d (back)
      </text>
      <Dim x1={62} x2={268} y={140} label="TRIP = 2 × d" size={10} color={G} />
    </svg>
  );
}

function FigTiming() {
  let burst = "M70 92H112";
  for (let k = 0; k < 8; k++) burst += "V78h3V92h3";
  burst += "H304";
  return (
    <svg viewBox="0 0 320 170" role="img" aria-label="Timing diagram of an HC-SR04: a 10 microsecond trigger pulse, then eight clicks of 40 kilohertz sound, then the echo pin stays high for as long as the sound is travelling." className="h-auto w-full">
      {[
        ["TRIG", 46],
        ["40 kHz", 92],
        ["ECHO", 142],
      ].map(([label, y]) => (
        <text key={label} x={10} y={(y as number) - 3} fontSize={10} fill={G} className={`${mono} font-bold`}>
          {label}
        </text>
      ))}
      <g fill="none" stroke={G} strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round">
        <path d="M70 46H92V28h10V46H304" />
        <path d={burst} strokeWidth={1.3} />
        <path d="M70 142H164V122H272V142H304" />
      </g>
      <text x={97} y={21} fontSize={9} fill={B} textAnchor="middle" className={mono}>
        10 µs
      </text>
      <text x={136} y={70} fontSize={9} fill={B} textAnchor="middle" className={mono}>
        8 clicks
      </text>
      <Dim x1={164} x2={272} y={110} label="= echo time" size={9} color={G} />
      <line x1={102} y1={50} x2={112} y2={74} stroke={B} strokeWidth={0.9} strokeDasharray="2 3" />
      <line x1={160} y1={96} x2={164} y2={118} stroke={B} strokeWidth={0.9} strokeDasharray="2 3" />
      <text x={304} y={162} fontSize={8.5} fill={B} textAnchor="end" className={mono}>
        time →
      </text>
    </svg>
  );
}

function FigThreshold() {
  const x = (cm: number) => 34 + cm * 2.66;
  return (
    <svg viewBox="0 0 320 160" role="img" aria-label="A number line from 0 to 100 centimetres. Readings below the 20 centimetre threshold mean stop, readings above it mean go." className="h-auto w-full">
      <HatchDefs id="echo-th-stop" gap={5} opacity={0.5} />
      <HatchDefs id="echo-th-wall2" gap={4} opacity={0.7} />
      <rect x={20} y={40} width={14} height={62} fill="url(#echo-th-wall2)" stroke={G} strokeWidth={1.6} />
      <rect x={x(0)} y={56} width={x(20) - x(0)} height={46} fill="url(#echo-th-stop)" />
      <line x1={x(0)} y1={102} x2={x(100)} y2={102} stroke={G} strokeWidth={1.6} />
      {[0, 20, 40, 60, 80, 100].map((cm) => (
        <g key={cm}>
          <line x1={x(cm)} y1={98} x2={x(cm)} y2={107} stroke={G} strokeWidth={1.3} />
          <text x={x(cm)} y={121} fontSize={9.5} fill={B} textAnchor="middle" className={mono}>
            {cm}
          </text>
        </g>
      ))}
      <text x={x(100)} y={136} fontSize={8.5} fill={B} textAnchor="end" className={mono}>
        distance to wall (cm)
      </text>
      <line x1={x(20)} y1={22} x2={x(20)} y2={102} stroke={G} strokeWidth={1.5} strokeDasharray="5 4" />
      <text x={x(20) + 6} y={30} fontSize={9.5} fill={G} className={`${mono} font-bold`}>
        THRESHOLD = 20 cm
      </text>
      <text x={x(10)} y={50} fontSize={10} fill={G} textAnchor="middle" className={`${mono} font-bold`}>
        STOP
      </text>
      <text x={x(74)} y={50} fontSize={10} fill={B} textAnchor="middle" className={`${mono} font-bold`}>
        GO
      </text>
      {/* car heading for the wall */}
      <g transform={`translate(${x(52)} 79)`}>
        <PencilRect x={0} y={-11} w={36} h={22} r={5} width={1.5} />
        <rect x={5} y={-15} width={9} height={4} fill={G} />
        <rect x={5} y={11} width={9} height={4} fill={G} />
        <rect x={23} y={-15} width={9} height={4} fill={G} />
        <rect x={23} y={11} width={9} height={4} fill={G} />
        <circle cx={3} cy={-5} r={2} fill={G} />
        <circle cx={3} cy={5} r={2} fill={G} />
      </g>
      <Arcs x={x(52) - 4} y={79} n={2} r0={7} gap={6} dir={-1} width={1.2} />
    </svg>
  );
}

/* ───────────────────────── the stage ───────────────────────── */

export function EchoTheory() {
  return (
    <div>
      <StageHeader
        index="01"
        kicker="Theory"
        title="Seeing with sound"
        intro="Bats fly through dark caves and dolphins hunt in muddy water — neither needs eyes for it. They shout, listen for the echo and work out how far away things are. A robot’s ultrasonic sensor does exactly the same, with a stopwatch and one line of maths."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <ConceptCard n={1} title="Sound is a travelling wave" figure={<FigWave />}>
          <p>
            A vibrating object shoves the air next to it, that air shoves the air beyond, and the push races outward as a wave. How many pushes arrive each second is the <strong>frequency</strong>.
          </p>
          <p className="mt-2">
            We hear up to about 20,000 vibrations a second. The sensor uses <strong>40,000</strong> (40 kHz) — <em>ultrasound</em>, far too high for human ears.
          </p>
        </ConceptCard>

        <ConceptCard n={2} title="An echo is sound coming home" figure={<FigEcho />}>
          <p>
            When a sound wave hits something hard — a cliff, a wall, a cupboard — part of it bounces straight back. That returning sound is the <strong>echo</strong>.
          </p>
          <p className="mt-2">The further away the wall, the longer you wait for the echo. That waiting time is the clue a robot needs.</p>
        </ConceptCard>

        <ConceptCard n={3} title="Sound has a speed: about 343 m/s" figure={<FigSpeed />}>
          <p>
            In air at room temperature (about 20 °C) sound covers roughly <strong>343 metres every second</strong>. Warmer air carries it a little faster, colder air a little slower.
          </p>
          <p className="mt-2">
            For a robot the handy version is: sound needs about <strong className="font-mono">29 µs</strong> to cross 1 cm. (1 second = 10,00,000 µs — ten lakh microseconds.)
          </p>
        </ConceptCard>

        <ConceptCard n={4} title="There and back — so divide by 2" figure={<FigHalf />}>
          <p>
            The stopwatch runs while the sound flies <em>to</em> the wall <em>and back again</em>. Speed × time gives the whole trip, which is twice the distance we want.
          </p>
          <p className="mt-2 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper px-3 py-2 font-mono text-[13px] font-semibold text-graphite">distance = speed × time ÷ 2</p>
        </ConceptCard>

        <ConceptCard n={5} title="Inside the HC-SR04" figure={<FigTiming />}>
          <p>The little blue sensor in most school robot kits has two “eyes”: a transmitter (T) and a receiver (R). Four pins: VCC, TRIG, ECHO, GND.</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              Your code holds <strong>TRIG</strong> high for 10 µs — “go!”.
            </li>
            <li>T fires eight clicks of 40 kHz sound.</li>
            <li>
              <strong>ECHO</strong> goes high and stays high until R hears the echo. The length of that pulse <em>is</em> the echo time.
            </li>
          </ol>
        </ConceptCard>

        <ConceptCard n={6} title="Thresholds turn numbers into decisions" figure={<FigThreshold />}>
          <p>
            A distance is only a number. A <strong>threshold</strong> is the line you draw through it: closer than this → do one thing, further → do another.
          </p>
          <pre className="mt-2 overflow-x-auto rounded-[var(--radius-sm)] border border-graphite/15 bg-paper px-3 py-2 font-mono text-[12px] leading-relaxed text-graphite">
            {"if (distance < 20) stop();\nelse forward();"}
          </pre>
          <p className="mt-2">Pick it too small and the robot brakes too late. Too big and it stops miles away.</p>
        </ConceptCard>
      </div>

      <KeyIdea>
        The sensor never measures distance. It measures <span className="underline decoration-paper/40 underline-offset-4">time</span> — and the maths turns time into distance: distance = 343 m/s × echo time ÷ 2.
      </KeyIdea>

      <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-6">
        <p className="annot text-blueprint">Worked example</p>
        <h3 className="mt-1 text-lg font-bold">The echo took 2,000 µs. How far is the wall?</h3>
        <ol className="mt-4 grid gap-3 font-mono text-sm sm:grid-cols-3">
          {[
            ["Step 1 · time in seconds", "2,000 µs = 0.002 s"],
            ["Step 2 · the whole trip", "343 × 0.002 = 0.686 m"],
            ["Step 3 · halve it", "0.686 ÷ 2 = 0.343 m ≈ 34 cm"],
          ].map(([k, v]) => (
            <li key={k} className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-4 py-3">
              <span className="annot block text-[10px] text-blueprint">{k}</span>
              <span className="mt-1 block font-semibold text-graphite">{v}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm leading-relaxed text-charcoal">
          <strong>Engineer’s shortcut:</strong> distance in cm ≈ echo time in µs ÷ 58. Try it — 2,000 ÷ 58 ≈ 34 cm. Same answer, one step.
        </p>
      </div>
    </div>
  );
}
