"use client";

import { Check } from "lucide-react";
import { LabJourney, Quiz, StageHeader, useLab, type QuizQuestion } from "@/components/labs/framework/LabJourney";
import { LogicDemo } from "./Demo";
import { CHALLENGE_PUZZLES, PUZZLES } from "./logic";
import { PuzzleSet } from "./Puzzles";
import { LogicTheory } from "./Theory";

const QUIZ: QuizQuestion[] = [
  {
    q: "In binary, what does 1 usually mean for a switch?",
    options: ["OFF", "ON", "Broken", "Half-way"],
    answer: 1,
    explain: "Binary has two values: 1 for ON and 0 for OFF.",
  },
  {
    q: "An AND gate gets A = 1 and B = 0. What is the output?",
    options: ["1", "0", "2", "It depends on the lamp"],
    answer: 1,
    explain: "AND needs BOTH inputs ON. One OFF input makes the output 0.",
  },
  {
    q: "When is the output of an OR gate 0?",
    options: ["When both inputs are 1", "When exactly one input is 1", "Only when both inputs are 0", "Never"],
    answer: 2,
    explain: "OR is ON if at least one input is ON — so it's OFF only when every input is OFF.",
  },
  {
    q: "A NOT gate receives 1. What comes out?",
    options: ["1", "0", "Nothing", "11"],
    answer: 1,
    explain: "NOT flips the signal: 1 becomes 0.",
  },
  {
    q: "Which gate lights the lamp when exactly ONE switch is ON — but not both?",
    options: ["AND", "OR", "XOR", "NOT"],
    answer: 2,
    explain: "XOR (exclusive OR) is “one or the other, but not both”.",
  },
  {
    q: "How many rows does the truth table for a 3-switch circuit have?",
    options: ["3", "6", "8", "9"],
    answer: 2,
    explain: "Each switch doubles the combinations: 2 × 2 × 2 = 8.",
  },
  {
    q: "A staircase light has one switch at the bottom and one at the top. Which gate behaves like it?",
    options: ["AND", "XOR", "NOT", "OR"],
    answer: 1,
    explain: "Flipping either switch changes the light — that's XOR.",
  },
  {
    q: "What does (A AND B) OR C give when A = 1, B = 0 and C = 1?",
    options: ["1", "0", "It can't be worked out", "2"],
    answer: 0,
    explain: "A AND B = 0, but 0 OR C(1) = 1. The lamp lights.",
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
        title="Six circuits. One lamp. Your logic."
        intro="Choose the right gate for each empty slot, then flip the switches to test every combination. When the whole truth table matches, your circuit is proven. Solve 4 puzzles to complete this stage."
      />
      {done && (
        <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-graphite px-4 py-2 text-sm font-semibold text-paper">
          <Check className="size-4" aria-hidden /> Hands-on complete — finish the rest for practice, or take on the Challenge.
        </p>
      )}
      <PuzzleSet puzzles={PUZZLES} mode="hands-on" />
    </div>
  );
}

function Challenge() {
  return (
    <div>
      <StageHeader
        index="04"
        kicker="Challenge"
        title="Engineer-level circuits"
        intro="Three harder circuits with three switches and up to five slots — the kind of logic inside voting machines, hall lights and safe locks. Then take the quiz: 60% or more unlocks your certificate."
      />
      <PuzzleSet puzzles={CHALLENGE_PUZZLES} mode="challenge" />
      <div className="mt-12">
        <Quiz questions={QUIZ} title="Logic quiz — 8 questions" />
      </div>
    </div>
  );
}

export default function Lab() {
  return <LabJourney slug="logic-gates" stages={{ theory: <LogicTheory />, demo: <LogicDemo />, handsOn: <HandsOn />, challenge: <Challenge /> }} />;
}
