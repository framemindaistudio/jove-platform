"use client";

import { LabJourney, Quiz, StageHeader, type QuizQuestion } from "@/components/labs/framework/LabJourney";
import { RoomSurvey } from "./Challenge";
import { EchoDemo } from "./Demo";
import { EchoHandsOn } from "./HandsOn";
import { EchoTheory } from "./Theory";

const QUIZ: QuizQuestion[] = [
  {
    q: "What does an ultrasonic sensor actually measure?",
    options: ["Distance, with a tiny tape measure", "The time between sending a pulse and hearing its echo", "How loud the room is", "The colour of the wall"],
    answer: 1,
    explain: "It only times the echo. Your code turns that time into a distance.",
  },
  {
    q: "Roughly how fast does sound travel through air at room temperature?",
    options: ["34 m/s", "343 m/s", "3,430 m/s", "3,00,000 km/s"],
    answer: 1,
    explain: "About 343 metres every second. (3,00,000 km/s is the speed of light.)",
  },
  {
    q: "Why does the formula divide by 2?",
    options: ["Because the sensor has two “eyes”", "Because sound slows down on the way back", "Because the sound travels to the wall AND back", "To change centimetres into metres"],
    answer: 2,
    explain: "The stopwatch covers the whole round trip — the wall is only half of that away.",
  },
  {
    q: "The echo comes back after 2,000 µs. About how far away is the wall?",
    options: ["3.4 cm", "34 cm", "68 cm", "343 cm"],
    answer: 1,
    explain: "343 m/s × 0.002 s = 0.686 m for the round trip. Half of that is about 34 cm.",
  },
  {
    q: "On an HC-SR04, which pin does your code pulse to start a measurement?",
    options: ["ECHO", "GND", "VCC", "TRIG"],
    answer: 3,
    explain: "A 10 µs pulse on TRIG fires the sound burst. The answer comes back on ECHO.",
  },
  {
    q: "“Ultrasonic” means the sound is…",
    options: ["Too high-pitched for humans to hear", "Extremely loud", "Faster than normal sound", "Made of light, not sound"],
    answer: 0,
    explain: "The sensor uses 40 kHz. Human hearing stops at roughly 20 kHz.",
  },
  {
    q: "Your robot car now drives twice as fast. What should happen to its stop threshold?",
    options: ["Make it smaller", "Leave it the same", "Make it bigger", "Remove it"],
    answer: 2,
    explain: "A faster car needs more room to brake, so it must react further from the wall.",
  },
  {
    q: "A wall is exactly 1 metre away. How far does the sound travel before the sensor hears it?",
    options: ["0.5 m", "1 m", "2 m", "343 m"],
    answer: 2,
    explain: "1 m there + 1 m back = 2 m. That is why we halve the result.",
  },
];

function Challenge() {
  return (
    <div>
      <StageHeader
        index="04"
        kicker="Challenge"
        title="Measure a room you cannot see"
        intro="No sliders this time — just raw echo times, like the numbers a real robot gets. Survey the room, then take the quiz: 60% or more unlocks your certificate."
      />
      <RoomSurvey />
      <div className="mt-12">
        <Quiz questions={QUIZ} title="Echo quiz — 8 questions" />
      </div>
    </div>
  );
}

export default function Lab() {
  return <LabJourney slug="echo-sensor" stages={{ theory: <EchoTheory />, demo: <EchoDemo />, handsOn: <EchoHandsOn />, challenge: <Challenge /> }} />;
}
