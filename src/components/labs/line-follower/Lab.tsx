"use client";

import { useState } from "react";
import { Check, Timer, Trophy } from "lucide-react";
import { LabJourney, Missions, Quiz, StageHeader, useLab, type QuizQuestion } from "@/components/labs/framework/LabJourney";
import { cn } from "@/lib/utils";
import { LineDemo } from "./Demo";
import { LineTheory } from "./Theory";
import { TRACK_IDS } from "./tracks";
import { BLANK_RULES, Workbench, type LapRecord } from "./Workbench";

/* ───────────────────────── hands-on ───────────────────────── */

type MissionId = "clean" | "fig8" | "p" | "fast" | "zig";

const MISSIONS: { id: MissionId; label: string }[] = [
  { id: "clean", label: "Write the rule book and finish one clean lap on any track." },
  { id: "fig8", label: "Clean lap on the Figure-8 — survive the crossing." },
  { id: "p", label: "Switch the brain to P-control and finish a clean lap." },
  { id: "fast", label: "Speed run — a clean Oval lap in under 7.0 seconds." },
  { id: "zig", label: "Clean lap on the Zig-zag. (The settings that win the Oval will not survive here.)" },
];

/** The Challenge: a clean Zig-zag lap at or under this many seconds. */
const TARGET = 10;

/** Progress that survives hopping between stages (until the page is reloaded). */
const session: { missions: Partial<Record<MissionId, boolean>>; trial: number | null } = { missions: {}, trial: null };
const rememberMissions = (m: Partial<Record<MissionId, boolean>>) => {
  session.missions = m;
};
const rememberTrial = (t: number) => {
  session.trial = t;
};

function HandsOn() {
  const { completeStage, progress } = useLab();
  const [done, setDone] = useState<Partial<Record<MissionId, boolean>>>(() => session.missions);
  const stageDone = progress.done.includes("hands-on") || !!done.clean;

  const onLap = (lap: LapRecord) => {
    if (!lap.clean) return;
    const next: Partial<Record<MissionId, boolean>> = {
      ...done,
      clean: true,
      fig8: done.fig8 || lap.trackId === "figure8",
      p: done.p || lap.mode === "p",
      fast: done.fast || (lap.trackId === "oval" && lap.time < 7),
      zig: done.zig || lap.trackId === "zigzag",
    };
    setDone(next);
    rememberMissions(next);
    completeStage("hands-on");
  };

  return (
    <div>
      <StageHeader
        index="03"
        kicker="Hands-on"
        title="Build the brain, then tune it"
        intro="The robot is built and the track is taped down — but its rule book is blank, so it just drives straight off. Fill in the four rules, press Run and start tuning. One clean lap on any track completes this stage; the other missions are there to stretch you."
      />

      <div className="mb-8 rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold">Missions</h3>
          <p className="font-mono text-sm tabular-nums text-charcoal">
            {MISSIONS.filter((m) => done[m.id]).length} / {MISSIONS.length} done
          </p>
        </div>
        <Missions items={MISSIONS.map((m) => ({ ...m, done: !!done[m.id] }))} />
        {stageDone && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-graphite px-4 py-2 text-sm font-semibold text-paper">
            <Check className="size-4" aria-hidden /> Hands-on complete — keep tuning, or take on the Challenge.
          </p>
        )}
      </div>

      <Workbench tracks={TRACK_IDS} initial={{ rules: BLANK_RULES }} onLap={onLap} />
    </div>
  );
}

/* ───────────────────────── challenge ───────────────────────── */

const QUIZ: QuizQuestion[] = [
  {
    q: "Why does an IR sensor give a “dark” reading over black tape?",
    options: ["Black tape is colder than the floor", "Black absorbs most of the infrared light, so very little bounces back", "Black tape is magnetic", "The tape blocks the sensor’s wires"],
    answer: 1,
    explain: "White reflects the IR light back to the detector. Black soaks it up.",
  },
  {
    q: "Only the LEFT sensor sees black. What should the robot do?",
    options: ["Steer left", "Steer right", "Stop for good", "Reverse"],
    answer: 0,
    explain: "The line has slipped under the left sensor, so the robot steers left to get it back in the middle.",
  },
  {
    q: "Both sensors see white and the line is between them. The robot should…",
    options: ["Spin on the spot", "Steer right", "Drive straight", "Switch off"],
    answer: 2,
    explain: "The line is exactly where it should be — carry straight on.",
  },
  {
    q: "What is a feedback loop?",
    options: ["Sense, decide, act — then sense again, over and over", "A track shaped like a loop", "A motor that only spins backwards", "A wire that joins the two sensors"],
    answer: 0,
    explain: "Each action changes what the sensors read next, which feeds the next decision.",
  },
  {
    q: "In proportional (P) control, how hard the robot steers depends on…",
    options: ["The colour of the robot", "How big the error is", "The battery brand", "How many laps it has done"],
    answer: 1,
    explain: "steer = Kp × error. Small error, gentle nudge. Big error, hard turn.",
  },
  {
    q: "Your robot wobbles wildly from side to side on a straight. What is the best fix?",
    options: ["Increase the gain", "Lower the gain (or slow down)", "Paint the line white", "Remove one sensor"],
    answer: 1,
    explain: "Wobbling means it is over-correcting. Less gain — or less speed — calms it down.",
  },
  {
    q: "The robot flies off the track at every sharp bend. What should you try first?",
    options: ["Go faster", "Reduce the speed or steer harder", "Use thinner tape", "Raise the sensors higher"],
    answer: 1,
    explain: "At high speed the loop has less time to react and the tyres run out of grip.",
  },
  {
    q: "With P-control, error = 0.5 and Kp = 2. What is the steer value?",
    options: ["0.25", "1.0", "2.5", "4.0"],
    answer: 1,
    explain: "steer = Kp × error = 2 × 0.5 = 1.0.",
  },
];

function Challenge() {
  const [trial, setTrial] = useState<number | null>(() => session.trial);

  const onLap = (lap: LapRecord) => {
    if (!lap.clean || lap.trackId !== "zigzag" || lap.time > TARGET) return;
    if (trial !== null && lap.time >= trial) return;
    setTrial(lap.time);
    rememberTrial(lap.time);
  };

  return (
    <div>
      <StageHeader
        index="04"
        kicker="Challenge"
        title="Time trial on the Zig-zag"
        intro={`Five hairpins, one stopwatch. The default settings will not even finish. Tune the robot until it completes a clean lap in ${TARGET.toFixed(1)} seconds or less — then take the quiz: 60% or more unlocks your certificate.`}
      />

      <div aria-live="polite" className={cn("mb-6 flex flex-wrap items-center gap-4 rounded-[var(--radius-md)] border p-5", trial !== null ? "border-graphite bg-graphite text-paper" : "border-graphite/15 bg-paper-50")}>
        <span className={cn("grid size-12 shrink-0 place-items-center rounded-full border-2", trial !== null ? "border-paper" : "border-graphite/30")}>{trial !== null ? <Trophy className="size-5" aria-hidden /> : <Timer className="size-5" aria-hidden />}</span>
        <div className="min-w-0 flex-1">
          <p className={cn("annot text-[10px]", trial !== null ? "text-paper/60" : "text-blueprint")}>Part A · time trial</p>
          <p className="text-lg font-bold leading-snug">{trial !== null ? `Target beaten — clean lap in ${trial.toFixed(2)} s` : `Clean Zig-zag lap in ${TARGET.toFixed(2)} s or less`}</p>
          <p className={cn("mt-0.5 text-sm", trial !== null ? "text-paper/75" : "text-charcoal")}>{trial !== null ? "Can you shave off another tenth? Then head down to the quiz." : "Hint: more speed needs a stronger turn. Change one slider at a time and watch what happens at the hairpins."}</p>
        </div>
      </div>

      <Workbench tracks={["zigzag"]} targetTime={TARGET} onLap={onLap} />

      <div className="mt-12">
        <p className="annot mb-3 text-blueprint">Part B · quiz</p>
        <Quiz questions={QUIZ} title="Line follower quiz — 8 questions" />
      </div>
    </div>
  );
}

export default function Lab() {
  return <LabJourney slug="line-follower" stages={{ theory: <LineTheory />, demo: <LineDemo />, handsOn: <HandsOn />, challenge: <Challenge /> }} />;
}
