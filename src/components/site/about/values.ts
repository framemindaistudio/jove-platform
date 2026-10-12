/** The four words on the JOVE logo — used on /about (spec cards) and /careers (how we work). */
export type ValueKey = "precision" | "learning" | "innovation" | "automation";

export interface BrandValue {
  key: ValueKey;
  n: string;
  title: string;
  /** One-line spec, written like a drawing note. */
  spec: string;
  body: string;
  /** What it looks like in a JOVE session. */
  classroom: string;
  /** What it looks like inside the team. */
  atWork: string;
}

export const brandValues: BrandValue[] = [
  {
    key: "precision",
    n: "01",
    title: "Precision",
    spec: "Measure twice. Build once.",
    body: "Engineering starts with care — the right wire in the right pin, a day that runs to the minute, a kit that comes back complete.",
    classroom: "Students test, measure and note what they see before they call a robot “done”.",
    atWork: "We arrive at 7:30 am, run to the published schedule, and count every kit out — and back in.",
  },
  {
    key: "learning",
    n: "02",
    title: "Learning",
    spec: "Hands first. Then the theory clicks.",
    body: "We teach by building. Every idea becomes something a child can hold, wire, run, break — and fix.",
    classroom: "Each grade band is a level: Grades 1–2 meet their first robots; Grades 9–10 build an AI that sees.",
    atWork: "Every JOVE Day ends with feedback, and every next session is a little better because of it.",
  },
  {
    key: "innovation",
    n: "03",
    title: "Innovation",
    spec: "Imagine it. Then make it real.",
    body: "Students get a problem, not a recipe — and the room to try their own idea before we show ours.",
    classroom: "Sessions close with a challenge: a new twist that each team solves by adapting its build.",
    atWork: "Anyone can pitch a better activity, a better shot or a better way of running the day.",
  },
  {
    key: "automation",
    n: "04",
    title: "Automation",
    spec: "Sense. Think. Act.",
    body: "The loop behind every robot and every AI — machines that sense the world, decide, and act. The literacy this generation needs.",
    classroom: "From light-seeking cars to obstacle avoiders and image classifiers, students program the loop themselves.",
    atWork: "We automate the paperwork — proposals, certificates, logistics — so people can focus on students.",
  },
];
