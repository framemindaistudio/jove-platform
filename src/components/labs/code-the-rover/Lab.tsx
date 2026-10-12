"use client";

import { Check } from "lucide-react";
import { LabJourney, Quiz, StageHeader, useLab, type QuizQuestion } from "@/components/labs/framework/LabJourney";
import { CHALLENGE_LEVELS, LEVELS } from "./levels";
import { Playground } from "./Playground";
import { RoverDemo } from "./Demo";
import { RoverTheory } from "./Theory";

const QUIZ: QuizQuestion[] = [
  {
    q: "What is an algorithm?",
    options: ["A kind of robot", "A list of steps, in order, that solves a problem", "A very big number", "A computer game"],
    answer: 1,
    explain: "Recipes, morning routines and rover programs are all algorithms — steps in the right order.",
  },
  {
    q: "The rover is facing East. It runs one Turn Left block. Which way is it facing now?",
    options: ["North", "South", "West", "Still East"],
    answer: 0,
    explain: "Facing East, your left hand points North. A quarter-turn left means it now faces North.",
  },
  {
    q: "Does a Turn Right block move the rover to a new square?",
    options: ["Yes, one square to the right", "Yes, two squares", "No — it only spins on the same square", "Only on rocky ground"],
    answer: 2,
    explain: "Turns change the direction the rover faces. Only Forward moves it.",
  },
  {
    q: "How many squares does “Repeat 4 times { Forward }” move the rover?",
    options: ["1", "4", "5", "8"],
    answer: 1,
    explain: "The Forward block inside runs 4 times — 4 squares.",
  },
  {
    q: "Your rover crashed into a rock. What is the best thing to do first?",
    options: ["Give up", "Delete the whole program", "Find the block where it went wrong and fix it", "Add more Forward blocks at the end"],
    answer: 2,
    explain: "That's debugging: find the bug, fix it, run again. Using Step helps you spot it.",
  },
  {
    q: "Which program does the same job as Forward, Forward, Forward — with fewer blocks?",
    options: ["Turn Left, Turn Right", "Repeat 3 times { Forward }", "Repeat 2 times { Forward }", "Forward, Turn Right"],
    answer: 1,
    explain: "A loop says it once and does it many times: 2 blocks instead of 3.",
  },
  {
    q: "The rover faces North and runs “Repeat 2 times { Turn Right }”. Which way does it face at the end?",
    options: ["East", "South", "West", "North"],
    answer: 1,
    explain: "Two quarter-turns right = a half-turn. North becomes South.",
  },
  {
    q: "Why do programmers use loops?",
    options: ["To make the robot slower", "So they don't have to write the same blocks again and again", "Because loops look nice", "To delete bugs automatically"],
    answer: 1,
    explain: "Loops make programs shorter, easier to read and easier to fix.",
  },
];

function HandsOn() {
  const { progress } = useLab();
  const done = progress.done.includes("hands-on");
  return (
    <div>
      <StageHeader
        index="03"
        kicker="Hands-on"
        title="Your turn: code the rover!"
        intro="Add blocks to your program, then press Run. Collect every gem and finish at the flag. Fewer blocks = more stars. Repeat blocks unlock at level 4."
      />
      {done && (
        <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-graphite px-4 py-2 text-sm font-semibold text-paper">
          <Check className="size-4" aria-hidden /> Hands-on complete — keep going for more stars, or head to the Challenge.
        </p>
      )}
      <Playground levels={LEVELS} mode="hands-on" />
    </div>
  );
}

function Challenge() {
  return (
    <div>
      <StageHeader
        index="04"
        kicker="Challenge"
        title="Loops inside loops"
        intro="Two tough levels with a strict block limit — you'll need a Repeat inside another Repeat. Then take the quiz: score 60% or more to unlock your certificate."
      />
      <Playground levels={CHALLENGE_LEVELS} mode="challenge" />
      <div className="mt-12">
        <Quiz questions={QUIZ} title="Rover quiz — 8 questions" />
      </div>
    </div>
  );
}

export default function Lab() {
  return <LabJourney slug="code-the-rover" stages={{ theory: <RoverTheory />, demo: <RoverDemo />, handsOn: <HandsOn />, challenge: <Challenge /> }} />;
}
