"use client";

import { ConceptCard, KeyIdea, StageHeader } from "@/components/labs/framework/LabJourney";
import { ik } from "./kinematics";
import { Arm, GREY, INK, MONO, PAPER, Scene, Tag } from "./Scene";

const Leader = ({ d }: { d: string }) => <path d={d} fill="none" stroke={INK} strokeOpacity={0.6} strokeWidth={1.1} />;

function FigLinks() {
  return (
    <Scene vb="-235 -205 600 345" envelope={false} rulers={false} axes={false} label="A robot arm with its parts labelled: base, joint 1 the shoulder, link 1 of 16 centimetres, joint 2 the elbow, link 2 of 12 centimetres, and the gripper as end-effector.">
      <Arm pose={{ t1: 60, t2: -75 }} />
      <Leader d="M-38 -38 L-11 -7" />
      <Tag x={-42} y={-36} anchor="end">
        JOINT 1 · SHOULDER
      </Tag>
      <Leader d="M-4 -100 L31 -80" />
      <Tag x={-8} y={-96} anchor="end">
        LINK 1 · 16 cm
      </Tag>
      <Leader d="M97 -168 L86 -149" />
      <Tag x={100} y={-172}>
        JOINT 2 · ELBOW
      </Tag>
      <Leader d="M118 -80 L124 -116" />
      <Tag x={70} y={-64}>
        LINK 2 · 12 cm
      </Tag>
      <Tag x={250} y={-104} bold>
        END-EFFECTOR
      </Tag>
      <Tag x={250} y={-86} muted size={13}>
        (our gripper)
      </Tag>
      <Leader d="M-68 58 L-36 58" />
      <Tag x={-72} y={63} anchor="end">
        BASE
      </Tag>
    </Scene>
  );
}

function FigDof() {
  const chain = (pts: [number, number][]) => (
    <g>
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={PAPER} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      {pts.slice(0, -1).map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={8.5} fill={PAPER} stroke={INK} strokeWidth={1.6} />
          <text x={x} y={y + 3.6} textAnchor="middle" fontFamily={MONO} fontSize={10} fontWeight={700} fill={INK}>
            {i + 1}
          </text>
        </g>
      ))}
      <line x1={pts[0][0] - 22} y1={pts[0][1] + 12} x2={pts[0][0] + 22} y2={pts[0][1] + 12} stroke={INK} strokeWidth={2} />
    </g>
  );
  const cap = (x: number, big: string, small: string) => (
    <g>
      <text x={x} y={182} textAnchor="middle" fontFamily={MONO} fontSize={15} fontWeight={700} fill={INK}>
        {big}
      </text>
      <text x={x} y={199} textAnchor="middle" fontFamily={MONO} fontSize={10.5} fill={GREY}>
        {small}
      </text>
    </g>
  );
  return (
    <svg viewBox="0 0 480 210" className="h-auto w-full" role="img" aria-label="Three arms compared: one joint gives 1 degree of freedom, two joints give 2, and a factory robot with six joints has 6 degrees of freedom.">
      {chain([
        [55, 140],
        [108, 76],
      ])}
      <path d="M92 140 A37 37 0 0 0 80 112" fill="none" stroke={INK} strokeWidth={1.3} strokeDasharray="3 3" />
      {cap(78, "1 DOF", "like a door hinge")}
      {chain([
        [205, 140],
        [222, 84],
        [276, 96],
      ])}
      {cap(240, "2 DOF", "this lab's arm")}
      {chain([
        [370, 140],
        [370, 108],
        [398, 70],
        [432, 84],
        [452, 58],
        [466, 76],
        [474, 62],
      ])}
      {cap(415, "6 DOF", "a factory robot")}
      <line x1={160} y1={30} x2={160} y2={200} stroke={INK} strokeOpacity={0.15} strokeDasharray="3 4" />
      <line x1={322} y1={30} x2={322} y2={200} stroke={INK} strokeOpacity={0.15} strokeDasharray="3 4" />
      <text x={240} y={20} textAnchor="middle" fontFamily={MONO} fontSize={9.5} fill={GREY} letterSpacing={1.4}>
        ONE NUMBERED JOINT = ONE DEGREE OF FREEDOM
      </text>
    </svg>
  );
}

function FigAngles() {
  return (
    <Scene vb="-120 -262 480 402" envelope={false} rulers={false} label="The shoulder angle theta 1 is measured from the horizontal x-axis up to link 1. The elbow angle theta 2 is measured from the direction of link 1 to link 2.">
      <Arm pose={{ t1: 50, t2: -70 }} showAngles />
      <Tag x={78} y={21} muted size={13}>
        x-axis = 0°
      </Tag>
      <Tag x={148} y={-172} muted size={13}>
        link 1 extended = 0°
      </Tag>
      <Tag x={-110} y={-232} size={13}>
        θ₁ = 50° · θ₂ = −70°
      </Tag>
      <Tag x={-110} y={-212} muted size={12}>
        counter-clockwise is positive
      </Tag>
    </Scene>
  );
}

function FigWorkspace() {
  return (
    <Scene shade rulers={false} label="The reach envelope: a ring around the shoulder. The outer edge is 28 centimetres away, the inner edge about 8 centimetres. The table cuts off the bottom.">
      <Arm pose={{ t1: 40, t2: 0 }} gripper={false} />
      <Tag x={0} y={-248} anchor="middle" size={19} bold>
        REACH ENVELOPE
      </Tag>
      <Tag x={62} y={-128} anchor="end" size={17}>
        16 + 12 = 28 cm
      </Tag>
      <Tag x={-96} y={-52} anchor="end" size={16} muted>
        inner limit ≈ 8 cm
      </Tag>
      <Tag x={-288} y={86} size={16} muted>
        table
      </Tag>
    </Scene>
  );
}

function FigFk() {
  return (
    <Scene vb="-110 -262 430 398" envelope={false} rulers={false} label="Forward kinematics example: with theta 1 at 60 degrees and theta 2 at minus 30 degrees, the tip lands at x 18.4 and y 19.9 centimetres.">
      <g stroke={INK} strokeWidth={1.2} strokeDasharray="5 4" fill="none">
        <path d="M183.9 -198.6 V0" />
        <path d="M183.9 -198.6 H0" />
      </g>
      <Arm pose={{ t1: 60, t2: -30 }} showAngles gripper={false} />
      <circle cx={183.9} cy={-198.6} r={6} fill={PAPER} stroke={INK} strokeWidth={2} />
      <Tag x={183.9} y={22} anchor="middle" bold>
        x = 18.4
      </Tag>
      <Tag x={-12} y={-194} anchor="end" bold>
        y = 19.9
      </Tag>
      <Tag x={196} y={-212} size={13} muted>
        tip (x, y)
      </Tag>
      <Tag x={300} y={-120} anchor="middle" size={12} muted>
        angles in
      </Tag>
      <Tag x={300} y={-102} anchor="middle" size={12} muted>
        → position out
      </Tag>
    </Scene>
  );
}

function FigIk() {
  const sols = ik(12, 20).solutions;
  return (
    <Scene vb="-110 -262 430 398" envelope={false} rulers={false} label="Inverse kinematics example: the target point 12, 20 can be reached in two ways — with the elbow up or with the elbow down.">
      {sols[1] && <Arm pose={sols[1]} ghost tag="elbow down" />}
      {sols[0] && <Arm pose={sols[0]} gripper={false} />}
      <g transform="translate(120 -200)" fill="none" stroke={INK} strokeWidth={2}>
        <circle r={10} fill={PAPER} />
        <path d="M-17 0H-5M5 0H17M0 -17V-5M0 5V17" />
      </g>
      <Tag x={140} y={-212} bold>
        target (12, 20)
      </Tag>
      <Tag x={-18} y={-150} anchor="end" size={13} bold>
        elbow up
      </Tag>
      <Tag x={300} y={-120} anchor="middle" size={12} muted>
        position in
      </Tag>
      <Tag x={300} y={-102} anchor="middle" size={12} muted>
        → angles out
      </Tag>
    </Scene>
  );
}

export function ArmTheory() {
  return (
    <div>
      <StageHeader
        index="01"
        kicker="Theory"
        title="How a robot arm knows where its hand is"
        intro="Welding cars, packing biscuits, assisting surgeons — robot arms do it all with the same few ideas. Six of them are below. Learn these and you can read the pose of almost any arm on any factory floor."
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <ConceptCard n={1} title="Links & joints" figure={<FigLinks />}>
          A robot arm is a chain. The rigid bars are <strong>links</strong>; the motors that let them turn are <strong>joints</strong>. Our arm has a base, two links (16 cm and 12 cm) and two joints — a shoulder and an elbow. The tool at the far end is the <strong>end-effector</strong>; ours is a gripper.
        </ConceptCard>
        <ConceptCard n={2} title="Degrees of freedom" figure={<FigDof />}>
          Every independent way a robot can move is one <strong>degree of freedom (DOF)</strong>. A door has 1. Our arm has 2 — enough to put its tip anywhere inside its workspace on a flat plane. Factory arms usually have 6: three to position the tool and three to tilt and twist it.
        </ConceptCard>
        <ConceptCard n={3} title="Joint angles" figure={<FigAngles />}>
          A pose is just two numbers. <strong>θ₁</strong>, the shoulder angle, is measured from the horizontal x-axis. <strong>θ₂</strong>, the elbow angle, is measured from wherever link 1 is pointing — so θ₂ = 0° means a perfectly straight arm. Like a hobby servo, our shoulder turns from 0° to 180°.
        </ConceptCard>
        <ConceptCard n={4} title="Workspace & reach envelope" figure={<FigWorkspace />}>
          All the points the tip can touch make up the <strong>workspace</strong>. Stretched straight the arm reaches 16 + 12 = 28 cm; folded as far as the elbow allows, about 8 cm. Between those limits lies a ring — the <strong>reach envelope</strong>. A point outside it is impossible, however clever the code.
        </ConceptCard>
        <ConceptCard n={5} title="Forward kinematics (FK)" figure={<FigFk />}>
          <strong>Angles in → position out.</strong> Know θ₁ and θ₂ and trigonometry gives the tip:
          <span className="my-2 block rounded-[var(--radius-sm)] bg-graphite/5 px-3 py-2 font-mono text-xs leading-relaxed text-graphite">
            x = L₁·cos θ₁ + L₂·cos(θ₁ + θ₂)
            <br />y = L₁·sin θ₁ + L₂·sin(θ₁ + θ₂)
          </span>
          One pose always gives exactly one answer.
        </ConceptCard>
        <ConceptCard n={6} title="Inverse kinematics (IK)" figure={<FigIk />}>
          <strong>Position in → angles out.</strong> “Put the gripper at (12, 20)” — which angles do that? This is the question a robot really needs answered, and it is harder: there may be <strong>two</strong> answers (elbow up or elbow down), exactly one (arm fully stretched) or <strong>none</strong> (out of reach).
        </ConceptCard>
      </div>

      <KeyIdea>FK asks “I set these angles — where is my hand?” IK asks “I want my hand there — which angles do I set?” Every pick-and-place robot solves both, hundreds of times a second.</KeyIdea>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-6">
          <p className="annot text-blueprint">Worked example · FK by hand</p>
          <h3 className="mt-2 text-lg font-bold">θ₁ = 60°, θ₂ = −30°</h3>
          <ol className="mt-3 space-y-2 font-mono text-[13px] leading-relaxed text-charcoal">
            <li>
              <span className="text-blueprint">1 ·</span> Link 2 points at θ₁ + θ₂ = 60° − 30° = 30°
            </li>
            <li>
              <span className="text-blueprint">2 ·</span> x = 16·cos 60° + 12·cos 30° = 8.0 + 10.4 = <strong className="text-graphite">18.4 cm</strong>
            </li>
            <li>
              <span className="text-blueprint">3 ·</span> y = 16·sin 60° + 12·sin 30° = 13.9 + 6.0 = <strong className="text-graphite">19.9 cm</strong>
            </li>
          </ol>
          <p className="mt-3 text-sm text-charcoal">That is the pose in figure 05. In the Hands-on stage, set these angles and check the read-out.</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-6">
          <p className="annot text-blueprint">For the curious · Grades 9–10</p>
          <h3 className="mt-2 text-lg font-bold">How IK finds the elbow angle</h3>
          <p className="mt-3 text-sm leading-relaxed text-charcoal">The shoulder, elbow and target form a triangle with sides L₁, L₂ and d (the distance to the target). The law of cosines gives the elbow angle directly:</p>
          <p className="my-3 rounded-[var(--radius-sm)] bg-graphite/5 px-3 py-2 font-mono text-xs leading-relaxed text-graphite">cos θ₂ = (x² + y² − L₁² − L₂²) ÷ (2·L₁·L₂)</p>
          <p className="text-sm leading-relaxed text-charcoal">A cosine has two matching angles, +θ₂ and −θ₂ — which is exactly why there are two solutions. If the right-hand side is bigger than 1, the target is out of reach and no angle exists.</p>
        </div>
      </div>
    </div>
  );
}
