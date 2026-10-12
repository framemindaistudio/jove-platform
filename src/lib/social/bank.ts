/**
 * The caption bank of Social Studio: the caption kinds with their boxes to fill, the hook lines, the calls to
 * action by goal, the hashtag sets by name, the caption rules and the lists of what not to write.
 * Source: OPERATIONS/11_CONTENT/04_Caption_and_Hashtag_Bank.md, 01_BRAND/02_Voice_and_Tone.md and
 * 03_Social_Media_Templates_Spec.md (caption structure). Change a line there and here together.
 *
 * Nothing here invents a fact: a number is typed by the person, or read from the price list the website uses.
 */
import { gradeBands, joveDayRules, kits, targets, type KitId } from "@/lib/content/business";
import type { FieldSpec, Values } from "./types";
import { TAGS, hashtags, rupees, val, type CtaKey, type TagSet } from "./words";

/** how much of a caption shows before "more" */
export const FIRST_LINE = 125;

/* ───────────────────────────── caption kinds ───────────────────────────── */

export interface CaptionKind {
  id: string;
  name: string;
  /** when to reach for it */
  when: string;
  /** the boxes to fill: the bracketed parts of the bank's template */
  fields: FieldSpec[];
  /** what the boxes hold to begin with (the bank's own words, where it gives them) */
  start: Values;
  /** the first line: what shows before "more" */
  hook: (v: Values) => string;
  /** the short lines under it */
  body: (v: Values) => string[];
  /** a workshop is shown, so the credit line goes in */
  credit: boolean;
  /** the call to action it starts with ("" = none) */
  cta: CtaKey | "";
  sets: PickableSet[];
  /** a caution shown under the boxes */
  note?: string;
  /** numbers taken from the price list, shown so the person sees where they come from */
  facts?: (v: Values) => { label: string; value: string }[];
}

/** what was typed, or the name of the box in brackets so a gap is easy to see */
const part = (v: Values, key: string, name: string) => val(v, key) || `[${name}]`;
/** "Grades 3–5 · Ages 8–11" → "Grades 3 to 5" */
const gradesOf = (text: string) => text.split("·")[0].trim().replace(/\s*[–-]\s*/g, " to ");

const lowestPrice = Math.min(...gradeBands.map((b) => b.pricePerStudent));
const kitOf = (v: Values) => kits.find((k) => k.id === val(v, "kit")) ?? kits[0];
/** The two junior kits have no code in them, so "code it" would not be true for those. */
const CODED: Record<KitId, boolean> = { spark: false, explorer: false, builder: true, innovator: true };

const school: FieldSpec = { key: "school", label: "School", kind: "text", placeholder: "School name, as the school writes it", help: "Name a school only after it has approved the post.", max: 48 };
const project: FieldSpec = { key: "project", label: "What they built", kind: "text", placeholder: "a light-seeking robot car", max: 60 };

export const CAPTION_KINDS: CaptionKind[] = [
  {
    id: "build",
    name: "Build moment",
    when: "A build that worked, on a real workshop day.",
    fields: [{ key: "grade", label: "Grade", kind: "text", placeholder: "Grade 5", max: 20 }, school, project],
    start: {},
    hook: () => "The moment the motor spins.",
    body: (v) => [`${part(v, "grade", "Grade")} students at ${part(v, "school", "School")} built ${part(v, "project", "project")} today, and every circuit worked by the end of the session.`],
    credit: true,
    cta: "book",
    sets: ["robotics", "schools"],
    note: "Post only what happened. If a circuit did not work by the end, change that line before you copy.",
  },
  {
    id: "lens",
    name: "Behind the lens",
    when: "How the film crew covers a JOVE Day.",
    fields: [{ key: "students", label: "Students that day", kind: "text", placeholder: "250", help: "The real count for that day, never a round guess.", max: 5 }],
    start: {},
    hook: (v) => `One workshop. Two halls. A film crew, a drone and ${part(v, "students", "number")} young engineers.`,
    body: () => ["Here is how we make a JOVE Day look like cinema."],
    credit: true,
    cta: "follow",
    sets: ["studio", "robotics"],
    note: "Drone shots only with the school's permission and within the drone rules.",
  },
  {
    id: "learn",
    name: "Learn with JOVE",
    when: "A mini-lesson or a Virtual Lab walkthrough.",
    fields: [
      { key: "question", label: "The question", kind: "text", max: 60 },
      { key: "answer", label: "The short answer", kind: "text", max: 80 },
      { key: "swipe", label: "What the slides show", kind: "text", help: "It finishes the line “Swipe to see ...”", max: 90 },
    ],
    start: { question: 'How does a robot "see"?', answer: "Three words: sense, think, act.", swipe: "how a light sensor tells a robot car where to go" },
    hook: (v) => part(v, "question", "The question"),
    body: (v) => [part(v, "answer", "The short answer"), `Swipe to see ${part(v, "swipe", "what the slides show")}.`],
    credit: false,
    cta: "learn",
    sets: ["robotics", "ai"],
  },
  {
    id: "schools",
    name: "For schools",
    when: "What a JOVE Day is and what it costs, said plainly.",
    fields: [],
    start: {},
    hook: () => `A full day of Robotics and AI for Grades 1 to 10, from ${rupees(lowestPrice)} per student (ex-GST, minimum ${joveDayRules.minimumStudents} students).`,
    body: () => ["Every kit, trainer and cable is ours.", "The film is on us."],
    credit: false,
    cta: "book",
    sets: ["schools", "robotics"],
    facts: () => [
      { label: "Lowest price per student", value: `${rupees(lowestPrice)}, ex-GST` },
      { label: "Smallest JOVE Day", value: `${joveDayRules.minimumStudents} students` },
    ],
    note: "The price and the minimum are read from the price list. A founder changes them in Prices & Costs, never here.",
  },
  {
    id: "founders",
    name: "Founders",
    when: "Who is building JOVE and why, in your own voice.",
    fields: [
      { key: "why", label: "What you are building", kind: "textarea", rows: 2, help: "It finishes the line “... something we wish our school had:”", max: 90 },
      { key: "today", label: "Where JOVE is today", kind: "text", placeholder: "JOVE launches in October 2026.", help: "One true line. A plan is written as a plan.", max: 80 },
    ],
    // "today" starts empty: a line that is true this month is wrong the next
    start: { why: "a Robotics and AI day with real kits and a real film crew", today: "" },
    hook: (v) => `We are two founders building something we wish our school had: ${part(v, "why", "what you are building")}.`,
    body: (v) => [part(v, "today", "where JOVE is today")],
    credit: false,
    cta: "follow",
    sets: ["founders", "robotics"],
  },
  {
    id: "school",
    name: "School celebration",
    when: "For the school to post from its own handle after its JOVE Day.",
    fields: [school, project],
    start: {},
    hook: (v) => `What an incredible day at ${part(v, "school", "School")}.`,
    body: (v) => [`Our students built ${part(v, "project", "project")}, tested it and presented it with pride.`, "Thank you, JOVE, for bringing Robotics and AI to our campus."],
    credit: true,
    cta: "",
    sets: ["robotics", "schools"],
    note: "Written in the school's voice, for the school's own handle. It goes to the school with its Media Pack: the posting kit is in Media Studio.",
  },
  {
    id: "kit",
    name: "Kit store",
    when: "One kit: what it builds, who it is for, what it costs.",
    fields: [{ key: "kit", label: "Kit", kind: "select", options: kits.map((k) => ({ value: k.id, label: k.name })) }],
    start: { kit: kits[0].id },
    hook: (v) => {
      const kit = kitOf(v);
      return `${kit.name}: ${kit.project.replace(/\s\+\s/g, " and ")}, everything in the box, ${gradesOf(kit.grades)}.`;
    },
    body: (v) => {
      const kit = kitOf(v);
      return [`${rupees(kit.mrp)} incl. GST. Build it, ${CODED[kit.id] ? "code" : "test"} it, show it off.`];
    },
    credit: false,
    cta: "shop",
    sets: ["kits", "robotics"],
    facts: (v) => [
      { label: "Price", value: `${rupees(kitOf(v).mrp)} incl. GST` },
      { label: "For", value: gradesOf(kitOf(v).grades) },
    ],
    note: "The price is read from the price list, so it always matches the shop.",
  },
];

/* ───────────────────────────── hook lines ───────────────────────────── */

/** First lines from the bank, each with the kind of post it opens. */
export const HOOKS: { line: string; fits: string }[] = [
  { line: "Wait for it.", fits: "A build payoff: the motor spins, the light comes on." },
  { line: "Can a machine learn to see a pen?", fits: "An AI session, or the Teach the Machine lab." },
  { line: "7:30 am. Empty hall. 3:20 pm. Whole school cheering.", fits: "A real JOVE Day, start to finish. Use that day's own times." },
  { line: "Robot or not?", fits: "The Grades 1 to 2 game." },
  { line: "They failed six times. Then this.", fits: "A debugging story. Write the real number of attempts." },
  { line: "A robotics workshop that comes with a film crew.", fits: "The studio: what makes JOVE different." },
  { line: "This is what a Grade 5 robot looks like.", fits: "A finished build. Write the real grade." },
];

/* ───────────────────────────── calls to action and hashtags ───────────────────────────── */

/** The bank's seven calls to action, by what the post is for. The sentences themselves are CTAS in words.ts. */
export const CTA_GOALS: { key: CtaKey; goal: string }[] = [
  { key: "book", goal: "Book" },
  { key: "learn", goal: "Learn" },
  { key: "shop", goal: "Shop" },
  { key: "engage", goal: "Engage" },
  { key: "save", goal: "Save" },
  { key: "share", goal: "Share" },
  { key: "follow", goal: "Follow" },
];

/** every set but the core one, which is always in */
export type PickableSet = Exclude<TagSet, "core">;

export const TAG_SETS: { key: PickableSet; name: string }[] = [
  { key: "robotics", name: "Robotics and STEM" },
  { key: "ai", name: "AI and ML" },
  { key: "schools", name: "India and schools" },
  { key: "studio", name: "Studio and film" },
  { key: "kits", name: "Kits" },
  { key: "hiring", name: "Hiring" },
  { key: "founders", name: "Founders" },
];

/** most sets in one caption: more would leave one tag from each */
export const MAX_SETS = 3;

/**
 * The hashtags for the chosen sets. Turn 0 is the standard pick of words.ts; each further turn takes the next
 * tags of every set, because the bank asks not to post the same set of tags twice in a row.
 */
export function tagMix(sets: PickableSet[], turn: number): string[] {
  if (!turn) return hashtags(...sets);
  const out: string[] = ["#JOVE", sets.includes("studio") ? "#FrameMindAIStudio" : "#JOVEDay"];
  const share = Math.max(2, Math.ceil(6 / Math.max(1, sets.length)));
  for (const set of sets) {
    const list = TAGS[set];
    for (let i = 0; i < Math.min(share, list.length); i++) {
      const tag = list[(i + turn * share) % list.length];
      if (!out.includes(tag) && out.length < 8) out.push(tag);
    }
  }
  return out;
}

/* ───────────────────────────── the rules ───────────────────────────── */

/** The caption structure of the template spec, in five lines. */
export const CAPTION_RULES: { name: string; rule: string }[] = [
  { name: "Hook", rule: `The first ${FIRST_LINE} characters show before “more”. Lead with the moment, not the company.` },
  { name: "Body", rule: "Two to four short lines: what the students built and learned. One idea in each sentence." },
  { name: "Credit", rule: "Where a workshop is shown: “Workshop by JOVE · Film by FrameMind AI Studio”." },
  { name: "Action", rule: "One call to action. Only one." },
  { name: "Hashtags", rule: "Five to eight after a line break, two of them core. In the whole caption: one exclamation mark at most, two emoji at most." },
];

/** Section 6 of the bank. */
export const DO_NOT_USE: string[] = [
  "Superlatives we cannot prove (“best”, “number 1”).",
  "Fake urgency (“only 3 slots left”) unless it is true.",
  "Student full names, class lists or uniforms with crests, unless the school approves.",
  "Hashtags of competitors.",
];

/** The vocabulary of Voice and Tone: the words on the left are ours. */
export const SAY_NOT: { say: string; not: string }[] = [
  { say: "workshop day, JOVE Day", not: "seminar, “fun class”" },
  { say: "build, test, debug", not: "play with gadgets" },
  { say: "students, young engineers", not: "customers" },
  { say: `target: ${targets.yearOneSchools} schools in year one`, not: `trusted by ${targets.yearOneSchools} schools` },
  { say: `from ${rupees(lowestPrice)} per student, ex-GST`, not: "cheapest, unbeatable price" },
  { say: "we aim to, we plan to", not: "guaranteed results" },
  { say: "real-world skills", not: "futuristic, revolutionary, game-changing" },
  { say: "in-house film studio", not: "viral content" },
];

/* ───────────────────────────── a quick read of a caption ───────────────────────────── */

export interface Flag {
  /** "fix" breaks a rule · "look" may be fine, but a person should decide */
  level: "fix" | "look";
  text: string;
}

/** Words the brand does not use. "best" can be innocent ("the best moments of the day"), so it only asks for a look. */
const WORDS: { find: RegExp; level: Flag["level"]; text: string }[] = [
  { find: /\bnumber\s*(one|1)\b|\bno\.\s*1\b|#1\b/i, level: "fix", text: "“Number 1” is a superlative we cannot prove." },
  { find: /\bbest\b/i, level: "look", text: "“Best” is a superlative. Keep it only if it is not a claim about JOVE." },
  { find: /\b(cheapest|unbeatable)\b/i, level: "fix", text: "Say the price itself (“from ... per student, ex-GST”), not “cheapest” or “unbeatable”." },
  { find: /\bguarantee[ds]?\b/i, level: "fix", text: "We do not promise results. Say “we aim to” or “we plan to”." },
  { find: /\b(revolutionary|game[- ]changing|futuristic)\b/i, level: "fix", text: "Say “real-world skills”, not “revolutionary”, “game-changing” or “futuristic”." },
  { find: /\bviral\b/i, level: "fix", text: "Say “in-house film studio”, not “viral”." },
  { find: /\btrusted by\b/i, level: "fix", text: "“Trusted by” claims schools we may not have yet. Write the target as a target." },
  { find: /\bonly\s+\d+\s+(slots?|seats?|spots?|places?)\s+left\b/i, level: "look", text: "Urgency (“only ... left”) is allowed only when it is true today." },
];

/** What a quick read of the caption finds against the caption rules. An empty list means nothing stood out. */
export function review(text: string): Flag[] {
  const flags: Flag[] = [];
  const first = text.split("\n")[0] ?? "";
  if (first.length > FIRST_LINE) flags.push({ level: "fix", text: `The first line is ${first.length} characters. Only the first ${FIRST_LINE} show before “more”.` });
  const gaps = [...new Set(text.match(/\[[^\]\n]+\]/g) ?? [])];
  if (gaps.length) flags.push({ level: "fix", text: `Still to fill in: ${gaps.join(", ")}.` });
  const marks = (text.match(/!/g) ?? []).length;
  if (marks > 1) flags.push({ level: "fix", text: `${marks} exclamation marks. A caption has one at most.` });
  const emoji = (text.match(/\p{Extended_Pictographic}/gu) ?? []).length;
  if (emoji > 2) flags.push({ level: "fix", text: `${emoji} emoji. A caption has two at most, and never in place of a word.` });
  if (text.includes("—")) flags.push({ level: "fix", text: "There is a long dash. Use a full stop or a comma." });
  if (text.includes("₹") && !/GST/i.test(text)) flags.push({ level: "fix", text: "A price is shown without its GST status: “ex-GST” for workshops, “incl. GST” for kits." });
  const tags = (text.match(/#[\p{L}\p{N}_]+/gu) ?? []).length;
  if (tags && (tags < 5 || tags > 8)) flags.push({ level: "fix", text: `${tags} ${tags === 1 ? "hashtag" : "hashtags"}. A caption has five to eight.` });
  for (const w of WORDS) if (w.find.test(text)) flags.push({ level: w.level, text: w.text });
  return flags;
}
