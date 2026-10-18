/**
 * The trainer handbook as a presentation: for training new trainers before their shadow day.
 * Follows OPERATIONS/04_TRAINER_MANUAL (README one-pager, chapters 01 and 05, with pointers to 06, 07, 09 and 11).
 */
import { gradeBands } from "@/lib/content/business";
import type { Deck } from "./types";

const BUILDS = ["Light-up Robot Buddy + spinning fan hat", "Light-seeking robot car", "Obstacle-avoiding Arduino car", "AI vision pan-tilt robot"];

export const trainerDeck: Deck = {
  id: "trainer-handbook",
  group: "trainer",
  title: "The JOVE Trainer Handbook",
  audience: "New trainers, shadows and volunteers",
  blurb: "Who we are, the four promises, the JOVE Way, Wow–Why–Build–Test–Show, demos, questions, stations, showcases, safety, the camera and your first 30 days.",
  minutes: 45,
  theme: { accent: "#2b2b2b", tint: "#ede7da", level: 4, palette: ["#2b2b2b", "#7a5c2e", "#3d5a80"] },
  sources: ["04_TRAINER_MANUAL/README.md", "04_TRAINER_MANUAL/01_Welcome_and_the_JOVE_Way.md", "04_TRAINER_MANUAL/05_Session_Delivery_Playbook.md"],
  slides: () => [
    { kind: "cover", kicker: "For JOVE trainers", title: "The JOVE Trainer Handbook", sub: "How a JOVE trainer thinks, behaves and delivers", art: "/images/studio/trainer-class.webp" },
    { kind: "statement", big: "You are the face of the promise.", sub: "A parent may never meet a founder. They will meet you.", icon: "Users" },
    {
      kind: "cards",
      title: "Our four promises",
      cards: [
        { icon: "Wrench", title: "Every child builds", text: "4–5 per station, rotating roles" },
        { icon: "ShieldCheck", title: "It works, or we make it work", text: "Arrive early, test kits, carry spares" },
        { icon: "Brain", title: "Age-honest learning", text: "Never talk down" },
        { icon: "Heart", title: "Safe and respectful", text: "Consent, no pressure, no shaming" },
      ],
    },
    {
      kind: "points",
      title: "The JOVE Way: five habits",
      points: ["Wow first: explain later", "Hands before slides: talk under 20% of a block", "Questions over answers", "Celebrate attempts", "Leave it tidy"],
      icon: "Star",
    },
    {
      kind: "agenda",
      title: "Every session: Wow · Why · Build · Test · Show",
      rows: [
        { time: "10%", title: "Wow", detail: "Live demo, story or question. Little talking.", phase: "Wow" },
        { time: "15%", title: "Why", detail: "One concept, one picture, one analogy.", phase: "Why" },
        { time: "40–45%", title: "Build", detail: "Teams build; you circulate and step back.", phase: "Build" },
        { time: "20%", title: "Test", detail: "Test, fail, debug, retest. Failure is normal.", phase: "Test" },
        { time: "10–15%", title: "Show", detail: "Teams demo; every child hears applause.", phase: "Show" },
      ],
    },
    { kind: "table", title: "Four programmes, one arc", head: ["Grades", "Programme", "Hero build"], rows: gradeBands.map((b, i) => [b.grades, `${b.name}: ${b.theme}`, BUILDS[i]]), foot: "Read the band's session plan before every delivery: HQ → Curriculum, and its classroom presentation in HQ → Presentations." },
    { kind: "points", title: "Demo technique", points: ["Rehearse it twice; know the backup", "Make it big: projector, hold it high, walk the room", "Predict first: three guesses, then press", "Narrate the invisible", "Show a failure on purpose", "Hand it over to a child"], icon: "Sparkles" },
    {
      kind: "table",
      title: "Questions that work",
      head: ["Technique", "Example"],
      rows: [
        ["Predict", "What will the LED do if I flip the battery?"],
        ["Explain", "Tell your partner why the motor spins."],
        ["Probe", "What if the sensor is covered?"],
        ["Compare", "What is different between your robot and Team 3's?"],
        ["Transfer", "Where else would a robot use this sensor?"],
        ["Wait time", "Count silently to five before rescuing an answer."],
      ],
      foot: "Avoid “Does everyone understand?” Ask: “Show me with your hands what the signal does.”",
    },
    { kind: "points", title: "Running the stations", points: ["Set up before the class arrives", "Every child has a role; swap at each bell", "The 10-minute sweep: progress, participation, safety", "Stuck ladder: teammate → build guide → flag → coach", "Point and ask. Do not take over the build"], icon: "ListChecks" },
    {
      kind: "table",
      title: "Showcase rituals",
      head: ["Grades", "Ritual"],
      rows: [
        ["1–2", "Show & Glow: lights off, every robot switches on, “Beep!”"],
        ["3–5", "Countdown race: “3, 2, 1, JOVE!”; cheer the slowest as loudly as the fastest"],
        ["6–8", "Explain-back: demo and one decision in 60 seconds"],
        ["9–10", "Pitch: 90 seconds, 60 seconds of questions"],
      ],
      foot: "The last team gets the same applause as the first.",
    },
    { kind: "points", title: "Keeping time", points: ["A visible countdown for every phase", "10 minutes behind at halfway? Shorten the next Why, never the Show", "A 5-minute “last mile” before Test: no half-finished robots"], icon: "Clock" },
    { kind: "cards", title: "Children first, always", cards: [{ icon: "ShieldCheck", title: "Never alone with a child" }, { icon: "Battery", title: "Battery power only", text: "No soldering, no hot glue for children" }, { icon: "Package", title: "Count parts out and in", text: "Batteries and small parts" }], sub: "Chapter 07 is mandatory and signed before day 1. A concern about a child goes to the Safeguarding Lead at once." },
    { kind: "points", title: "The camera is a guest, and a guard", points: ["Consent first, always", "Only the media team films; no personal phones", "Children without consent are not filmed or are blurred"], icon: "Camera" },
    { kind: "points", title: "What we do not do", points: ["Promise outcomes we cannot deliver", "Criticise other organisations or schools", "Claim past events, awards or numbers we do not have", "Publish a child's image or name without consent"], icon: "Scale" },
    { kind: "table", title: "Your first 30 days", head: ["Week", "Goal"], rows: [["1", "Read the handbook · sign the child-protection declaration · build each kit once"], ["2", "Shadow a full JOVE Day; watch every role"], ["3", "Co-deliver one band under a Lead"], ["4", "Deliver one session with a Lead observing; written feedback"]] },
    { kind: "points", title: "After every session", points: ["Did every child build or touch the kit?", "Did I talk less than I planned?", "Did every team show something?", "Did I include the quiet students?", "One thing to change next time: write it in the end-of-day report"], icon: "ClipboardList" },
    { kind: "closing", title: "Welcome to JOVE", sub: "Questions: Shivaprasad (operations) · Chinmay (curriculum and technology)", points: ["Keep chapters 05, 06 and 07 on your phone on every workshop day"] },
  ],
};
