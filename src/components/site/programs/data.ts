/**
 * Helpers shared by /programs and /packages.
 * Every number is derived from src/lib/content/business.ts (single source of truth) —
 * nothing here hard-codes a price, duration or rule that business.ts already defines.
 */
import { gradeBands, joveDaySchedule, joveDayRules, kits, mediaPack, packages, type GradeBand, type GradeBandId, type KitId, type PackageId } from "@/lib/content/business";
import { labs } from "@/lib/content/labs";
import { formatINR, pad2 } from "@/lib/utils";

/* ── Grade bands ──────────────────────────────────────────────────────── */

/** Public shop slugs (same rule as the catalog fallback in lib/public-data.ts). */
export function kitSlug(id: KitId) {
  return id === "innovator" ? "innovator-ai-kit" : `${id}-kit`;
}

export function kitFor(band: GradeBand) {
  return kits.find((k) => k.id === band.kitId);
}

/** Free Virtual Labs that preview this band's offline session (labs.ts → offlineLink names the band). */
export function labsFor(band: GradeBand) {
  return labs.filter((l) => l.offlineLink.includes(band.name));
}

/** "Grades 1–2" → "Gr 1–2" for compact UI. */
export function shortGrades(band: GradeBand) {
  return band.grades.replace("Grades ", "Gr ");
}

/** "Grades 1–2" → "1–2" */
export function gradeRange(band: GradeBand) {
  return band.grades.replace("Grades ", "");
}

/** 105 → "1 h 45 min", 75 → "1 h 15 min", 45 → "45 min" */
export function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Minutes from session start → "00:45" */
export function clockOffset(min: number) {
  return `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;
}

/** Activities with cumulative start/end minutes. */
export function runSheet(band: GradeBand) {
  let t = 0;
  return band.activities.map((a, i) => {
    const start = t;
    t += a.minutes;
    return { ...a, index: i + 1, start, end: t };
  });
}

/** "07:30" → 450 */
export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** 450 → "07:30" */
export function toClock(min: number) {
  return `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;
}

export const BAND_IDS = gradeBands.map((b) => b.id) as GradeBandId[];

/* ── JOVE Day schedule (two halls + assembly) ─────────────────────────── */

export const DAY_LANES = ["Assembly", "Hall A", "Hall B", "Office"] as const;
export type DayLane = (typeof DAY_LANES)[number];

export type DayBlockKind = "session" | "assembly" | "team" | "optional";

export interface DayBlock {
  index: number;
  time: string;
  end: string;
  hall: string;
  title: string;
  detail: string;
  who: string;
  /** minutes from the start of the day */
  from: number;
  to: number;
  lanes: DayLane[];
  kind: DayBlockKind;
}

export const DAY_START = Math.min(...joveDaySchedule.map((s) => toMinutes(s.time)));
export const DAY_END = Math.max(...joveDaySchedule.map((s) => toMinutes(s.end)));
export const DAY_SPAN = DAY_END - DAY_START;

function blockKind(s: (typeof joveDaySchedule)[number]): DayBlockKind {
  if (s.hall === "Assembly") return "assembly";
  if (/as booked/i.test(s.who)) return "optional";
  if (/team|founders/i.test(s.who)) return "team";
  return "session";
}

export function dayBlocks(): DayBlock[] {
  return joveDaySchedule.map((s, i) => ({
    index: i + 1,
    time: s.time,
    end: s.end,
    hall: s.hall,
    title: s.title,
    detail: s.detail,
    who: s.who,
    from: toMinutes(s.time) - DAY_START,
    to: toMinutes(s.end) - DAY_START,
    lanes: s.hall === "Both" ? ["Hall A", "Hall B"] : DAY_LANES.includes(s.hall as DayLane) ? [s.hall as DayLane] : ["Office"],
    kind: blockKind(s),
  }));
}

export const TEAM_ON_SITE = joveDayRules.teamSize.founders + joveDayRules.teamSize.trainers + joveDayRules.teamSize.media;

/** Largest single-session batch across bands (for the "per session" stat). */
export const MAX_PER_SESSION = Math.max(...gradeBands.map((b) => b.maxPerSession));
export const MIN_PER_SESSION = Math.min(...gradeBands.map((b) => b.maxPerSession));

/* ── Packages ─────────────────────────────────────────────────────────── */

/** Sessions per package (business.ts: Quarter = 3 JOVE Days, Year = 8 sessions). */
export const SESSIONS: Record<Exclude<PackageId, "jove-club">, number> = {
  "jove-day": 1,
  "jove-quarter": 3,
  "jove-year": 8,
};

/**
 * JOVE Club pricing lives only in the package's priceNote in business.ts
 * ("₹799 per student per month · min. 25 students"), so we read it from there.
 */
const clubNote = packages.find((p) => p.id === "jove-club")?.priceNote ?? "";
export const CLUB_PRICE = Number(/₹\s?([\d,]+)/.exec(clubNote)?.[1]?.replace(/,/g, "")) || 799;
export const CLUB_MIN_STUDENTS = Number(/min\.\s?(\d+)/i.exec(clubNote)?.[1]) || 25;
/** "4 × 60-minute sessions per month" → 4 */
const clubSessionsLine = packages.find((p) => p.id === "jove-club")?.includes.find((i) => /sessions per month/i.test(i)) ?? "";
export const CLUB_SESSIONS_PER_MONTH = Number(/(\d+)\s?×/.exec(clubSessionsLine)?.[1]) || 4;

/** JOVE Year includes "30% off Social Media Management add-on" — read the % from business.ts. */
const yearSmmLine = packages.find((p) => p.id === "jove-year")?.includes.find((i) => /social media/i.test(i)) ?? "";
export const YEAR_SMM_DISCOUNT = Number(/(\d+)%/.exec(yearSmmLine)?.[1]) || 0;

export function bandPrice(band: GradeBand, pkg: PackageId) {
  switch (pkg) {
    case "jove-day":
      return band.pricePerStudent;
    case "jove-quarter":
      return band.quarterPricePerStudent;
    case "jove-year":
      return band.yearPricePerStudent;
    case "jove-club":
      return CLUB_PRICE;
  }
}

export function priceRange(pkg: PackageId) {
  const values = gradeBands.map((b) => bandPrice(b, pkg));
  return { min: Math.min(...values), max: Math.max(...values) };
}

/** Saving of a multi-session package vs. booking the same number of separate JOVE Days, per band. */
export function savingPct(band: GradeBand, pkg: "jove-quarter" | "jove-year") {
  const separate = band.pricePerStudent * SESSIONS[pkg];
  return ((separate - bandPrice(band, pkg)) / separate) * 100;
}

export function savingRange(pkg: "jove-quarter" | "jove-year") {
  const values = gradeBands.map((b) => savingPct(b, pkg));
  return { min: Math.round(Math.min(...values)), max: Math.round(Math.max(...values)) };
}

export function unitLabel(pkg: PackageId) {
  return pkg === "jove-day" ? "per student" : pkg === "jove-quarter" ? "per student / quarter" : pkg === "jove-year" ? "per student / year" : "per student / month";
}

export function priceLabel(pkg: PackageId) {
  const r = priceRange(pkg);
  const price = r.min === r.max ? formatINR(r.min) : `${formatINR(r.min)} – ${formatINR(r.max)}`;
  return { price, unit: unitLabel(pkg) };
}

/** A one-line, data-derived commercial note for each package card. */
export function packageNote(pkg: PackageId) {
  switch (pkg) {
    case "jove-day":
      return `Min. ${joveDayRules.minimumStudents} students · ${formatINR(joveDayRules.minimumBilling)} minimum billing`;
    case "jove-quarter":
    case "jove-year": {
      const s = savingRange(pkg);
      return `Save ${s.min}–${s.max}% vs ${SESSIONS[pkg]} separate JOVE Days`;
    }
    case "jove-club":
      return `Min. ${CLUB_MIN_STUDENTS} students · ${CLUB_SESSIONS_PER_MONTH} sessions a month`;
  }
}

/** Media included per package — only ₹-valued where business.ts says a full Media Pack is included. */
export function mediaIncluded(pkg: PackageId): { value: number | null; label: string } {
  switch (pkg) {
    case "jove-day":
      return { value: mediaPack.marketValue, label: "1 FrameMind Media Pack" };
    case "jove-quarter":
      return { value: mediaPack.marketValue * SESSIONS["jove-quarter"], label: `Media Pack every month (×${SESSIONS["jove-quarter"]})` };
    case "jove-year":
      return { value: null, label: "Annual showcase film + monthly reels" };
    case "jove-club":
      return { value: null, label: "Monthly project video" };
  }
}

/* ── Package comparison matrix ────────────────────────────────────────── */

/** true = included, false = not included, string = included with a note ("Add-on" renders as an outline tag). */
export type MatrixCell = boolean | string;

const quarterLevels = SESSIONS["jove-quarter"];

export const comparisonRows: { feature: string; hint?: string; cells: Record<PackageId, MatrixCell> }[] = [
  {
    feature: "Format",
    cells: {
      "jove-day": "1 full day on campus",
      "jove-quarter": `${quarterLevels} JOVE Days, one a month`,
      "jove-year": `${SESSIONS["jove-year"]} sessions + Innovation Showcase`,
      "jove-club": `${CLUB_SESSIONS_PER_MONTH} × 60-min sessions a month`,
    },
  },
  {
    feature: "Price (ex-GST)",
    cells: {
      "jove-day": `${priceLabel("jove-day").price} per student`,
      "jove-quarter": `${priceLabel("jove-quarter").price} per student`,
      "jove-year": `${priceLabel("jove-year").price} per student`,
      "jove-club": `${priceLabel("jove-club").price} per student / month`,
    },
  },
  {
    feature: "Age-specific sessions, Grades 1–10",
    cells: { "jove-day": true, "jove-quarter": "Level 1 → 2 → 3", "jove-year": true, "jove-club": "Enrolled students" },
  },
  {
    feature: "All kits, tools & consumables",
    cells: { "jove-day": true, "jove-quarter": true, "jove-year": "Robotics Corner — kits stay at school", "jove-club": "During sessions" },
  },
  {
    feature: "Opening robot + drone show",
    cells: { "jove-day": true, "jove-quarter": "Every JOVE Day", "jove-year": false, "jove-club": false },
  },
  {
    feature: "Certificates for every student",
    cells: { "jove-day": true, "jove-quarter": "+ skill badges", "jove-year": true, "jove-club": false },
  },
  {
    feature: "FrameMind media",
    hint: "Produced by our in-house film studio",
    cells: {
      "jove-day": `Media Pack (≈ ${formatINR(mediaPack.marketValue)} value)`,
      "jove-quarter": `Media Pack ×${quarterLevels} (≈ ${formatINR(mediaPack.marketValue * quarterLevels)} value)`,
      "jove-year": "Showcase film + monthly reels",
      "jove-club": "Monthly project video",
    },
  },
  {
    feature: "Reporting",
    cells: { "jove-day": "Management report", "jove-quarter": "Progress report per student", "jove-year": false, "jove-club": "Monthly parent update" },
  },
  {
    feature: "Teacher training",
    cells: { "jove-day": "Add-on", "jove-quarter": "2-hour orientation", "jove-year": "2 teachers trained & certified", "jove-club": "Add-on" },
  },
  {
    feature: "Parent showcase",
    cells: { "jove-day": false, "jove-quarter": "End-of-quarter mini-showcase", "jove-year": "Annual Innovation Showcase", "jove-club": false },
  },
  {
    feature: "Robotics Corner on campus",
    cells: { "jove-day": false, "jove-quarter": false, "jove-year": true, "jove-club": false },
  },
  {
    feature: "Inter-school JOVE Robo League entry",
    cells: { "jove-day": false, "jove-quarter": false, "jove-year": true, "jove-club": false },
  },
  {
    feature: "Priority booking dates",
    cells: { "jove-day": false, "jove-quarter": true, "jove-year": false, "jove-club": false },
  },
  {
    feature: "Social Media Management add-on",
    cells: { "jove-day": "Add-on", "jove-quarter": "Add-on", "jove-year": YEAR_SMM_DISCOUNT ? `${YEAR_SMM_DISCOUNT}% off` : "Add-on", "jove-club": "Add-on" },
  },
];

/** Event the package cards fire to pre-select a package in the estimator. */
export const ESTIMATE_EVENT = "jove:estimate";
export const ESTIMATOR_ID = "estimate";
