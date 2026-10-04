"use client";

import { LabJourney, Quiz, StageHeader, type QuizQuestion } from "@/components/labs/framework/LabJourney";
import { ArmDemo } from "./Demo";
import { ArmTheory } from "./Theory";
import { ArmWorkbench } from "./Workbench";

const QUIZ: QuizQuestion[] = [
  {
    q: "Our arm has a shoulder joint and an elbow joint. How many degrees of freedom is that?",
    options: ["1", "2", "4", "6"],
    answer: 1,
    explain: "Each independent joint adds one degree of freedom: shoulder + elbow = 2.",
  },
  {
    q: "Which question does forward kinematics answer?",
    options: ["Which angles reach this point?", "How heavy a load can the arm lift?", "Given the joint angles, where is the gripper?", "How fast can the motors spin?"],
    answer: 2,
    explain: "FK: angles in → position out.",
  },
  {
    q: "Link 1 is 16 cm and link 2 is 12 cm. What is the farthest the tip can be from the shoulder?",
    options: ["4 cm", "16 cm", "28 cm", "192 cm"],
    answer: 2,
    explain: "Fully stretched, the links add up: 16 + 12 = 28 cm.",
  },
  {
    q: "With θ₁ = 90° and θ₂ = 0°, where is the tip?",
    options: ["(28, 0)", "(0, 28)", "(16, 12)", "(12, 16)"],
    answer: 1,
    explain: "Both links point straight up, so the tip is 28 cm above the shoulder: (0, 28).",
  },
  {
    q: "With θ₁ = 0° and θ₂ = 90°, where is the tip?",
    options: ["(16, 12)", "(28, 0)", "(12, 16)", "(0, 28)"],
    answer: 0,
    explain: "Link 1 lies along the x-axis (16 cm), then link 2 points straight up (12 cm): (16, 12).",
  },
  {
    q: "Why does inverse kinematics often give two answers for one target point?",
    options: ["The computer makes rounding errors", "The arm can reach it with the elbow up or with the elbow down", "There are two motors, so two answers", "One answer is for the gripper open, one for closed"],
    answer: 1,
    explain: "The same triangle can be flipped — elbow-up and elbow-down both put the tip on the target.",
  },
  {
    q: "You ask the arm to reach a point 35 cm from its shoulder. What does IK return?",
    options: ["Two solutions", "One solution with a straight arm", "No solution — the point is outside the reach envelope", "It stretches the links"],
    answer: 2,
    explain: "35 cm is more than the 28 cm maximum reach. Outside the workspace there is no solution.",
  },
  {
    q: "Why do most factory robot arms have 6 degrees of freedom?",
    options: ["Six motors are cheaper than two", "Three to position the tool and three to orient (tilt and twist) it", "So they can lift six times the weight", "Because they have six links"],
    answer: 1,
    explain: "In 3D space, a tool needs 3 DOF for its position and 3 more for its orientation.",
  },
];

function HandsOn() {
  return (
    <div>
      <StageHeader
        index="03"
        kicker="Hands-on"
        title="Take control of the arm"
        intro="Start in Joint control: you choose the angles, the arm shows you where the tip lands. Then switch to Point control: you choose the point, and the computer works out the angles. Complete any 3 of the 5 missions to finish this stage."
      />
      <ArmWorkbench mode="hands-on" />
    </div>
  );
}

function Challenge() {
  return (
    <div>
      <StageHeader
        index="04"
        kicker="Challenge"
        title="Pick, place — and count every move"
        intro="A real robot cell is judged on cycle time. Put three blocks on three targets in 12 moves or fewer, then take the quiz. Scoring 60% or more on the quiz unlocks your certificate."
      />
      <ArmWorkbench mode="challenge" />
      <div className="mt-12">
        <Quiz questions={QUIZ} title="Kinematics quiz — 8 questions" />
      </div>
    </div>
  );
}

export default function Lab() {
  return <LabJourney slug="robot-arm" stages={{ theory: <ArmTheory />, demo: <ArmDemo />, handsOn: <HandsOn />, challenge: <Challenge /> }} />;
}
