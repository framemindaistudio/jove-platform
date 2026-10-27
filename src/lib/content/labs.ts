/**
 * JOVE Virtual Labs — the free 3D bench on the public site (/labs): builds from our workshops, wired pin to pin
 * with the same parts as our kits. Each entry is a public build of src/lib/bench/projects (`public: true`);
 * /labs#<slug> opens that build. The other builds stay in HQ (Practice Lab).
 */
export type LabStage = "parts" | "wire" | "run" | "fix";

export const labStages: { id: LabStage; index: string; label: string; blurb: string }[] = [
  { id: "parts", index: "01", label: "Meet the parts", blurb: "The same parts as our kits, at real size on a 3D bench." },
  { id: "wire", index: "02", label: "Wire it", blurb: "Click a pin, then another. Step by step, like the build guide." },
  { id: "run", index: "03", label: "Switch on", blurb: "It glows, spins, beeps or blinks, if the circuit is right." },
  { id: "fix", index: "04", label: "Break it, fix it", blurb: "Free wiring: try mistakes and see what the bench says." },
];

export interface LabMeta {
  slug: string;
  title: string;
  subtitle: string;
  grades: string;
  minutes: number;
  topic: "Robotics" | "AI & ML" | "Electronics" | "Coding";
  level: "Beginner" | "Intermediate" | "Advanced";
  /** a picture for the card; without one the card draws a blueprint tile */
  image?: string;
  summary: string;
  concepts: string[];
  free: boolean;
  offlineLink: string; // which offline session it previews
}

export const labs: LabMeta[] = [
  {
    slug: "robot-buddy",
    title: "Light-up Robot Buddy",
    subtitle: "Your first circuit",
    grades: "Grades 1–2",
    minutes: 10,
    topic: "Electronics",
    level: "Beginner",
    summary: "Clip a battery, an LED, a fan motor and a buzzer into circles of electricity, and make the Robot Buddy glow, spin and beep.",
    concepts: ["Circuit", "Battery", "LED", "Motor"],
    free: true,
    offlineLink: "Little Inventors",
  },
  {
    slug: "first-led",
    title: "Mission 1: Light one LED",
    subtitle: "Breadboard basics",
    grades: "Grades 3–5",
    minutes: 10,
    topic: "Electronics",
    level: "Beginner",
    summary: "Your first breadboard circuit: a battery, a resistor and an LED. Learn how the hidden strips join the holes.",
    concepts: ["Breadboard", "Resistor", "Polarity", "Closed loop"],
    free: true,
    offlineLink: "Young Makers",
  },
  {
    slug: "blink",
    title: "Blink: your first Arduino program",
    subtitle: "Arduino Uno & code",
    grades: "Grades 6–8",
    minutes: 15,
    topic: "Coding",
    level: "Beginner",
    summary: "Wire an LED to pin 13 of the Arduino Uno, run Blink, then change the code and watch the timing change.",
    concepts: ["Arduino", "digitalWrite", "delay()", "Pins"],
    free: true,
    offlineLink: "Robo Engineers",
  },
];

export function getLab(slug: string) {
  return labs.find((l) => l.slug === slug);
}
