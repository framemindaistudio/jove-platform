/**
 * Sales helpers shared by Leads, Schools CRM and Proposals.
 * Pure functions only — safe to import from client and server code.
 */
import { gradeBands, joveDayRules, type GradeBandId } from "@/lib/content/business";
import { SCHOOL_STAGES, totalStudents, type BaseRecord } from "@/lib/hq/collections";
import { isoDate } from "@/lib/utils";

/* ─────────────────────────── stages ─────────────────────────── */

export type StageId = "lead" | "contacted" | "meeting" | "proposal" | "negotiation" | "won" | "lost" | "nurture";

/** Probability a school in each stage ends up booking (used for the weighted forecast). */
export const STAGE_PROBABILITY: Record<StageId, number> = {
  lead: 0.05,
  contacted: 0.1,
  meeting: 0.25,
  proposal: 0.5,
  negotiation: 0.7,
  won: 1,
  lost: 0,
  nurture: 0,
};

/** Stages that are still being actively worked. */
export const OPEN_STAGES: StageId[] = ["lead", "contacted", "meeting", "proposal", "negotiation"];

/** Linear sales track shown on the school profile (lost / nurture sit outside it). */
export const TRACK_STAGES: StageId[] = ["lead", "contacted", "meeting", "proposal", "negotiation", "won"];

export function stageLabel(stage: unknown) {
  return SCHOOL_STAGES.find((s) => s.value === stage)?.label ?? (stage ? String(stage) : "Lead");
}

export function stageProbability(stage: unknown) {
  return STAGE_PROBABILITY[(stage as StageId) ?? "lead"] ?? 0;
}

export function stageIndex(stage: unknown) {
  return TRACK_STAGES.indexOf((stage as StageId) ?? "lead");
}

/* ─────────────────────────── grade bands ─────────────────────────── */

/** Grade band → the student-count field used on schools, workshops and proposals. */
export const BAND_FIELDS: Record<GradeBandId, "studentsG12" | "studentsG35" | "studentsG68" | "studentsG910"> = {
  "g1-2": "studentsG12",
  "g3-5": "studentsG35",
  "g6-8": "studentsG68",
  "g9-10": "studentsG910",
};

export function bandCounts(r: Record<string, unknown>) {
  return gradeBands.map((b) => ({ band: b, students: Math.max(0, Math.round(Number(r[BAND_FIELDS[b.id]]) || 0)) }));
}

/** Students on a school record: band split if present, else the total field. */
export function schoolStudents(r: Record<string, unknown>) {
  return totalStudents(r) || Math.max(0, Number(r.studentsTotal) || 0);
}

/* ─────────────────────────── deal value ─────────────────────────── */

/**
 * JOVE Day estimate from student counts:
 * band split → Σ students × band price; total only → students × target average price.
 * The minimum billing applies whenever there are students.
 */
export function estimateJoveDayValue(r: Record<string, unknown>) {
  const byBand = bandCounts(r).reduce((s, x) => s + x.students * x.band.pricePerStudent, 0);
  if (byBand > 0) return Math.max(byBand, joveDayRules.minimumBilling);
  const total = Math.max(0, Number(r.studentsTotal) || 0);
  if (total > 0) return Math.max(total * joveDayRules.targetAvgPricePerStudent, joveDayRules.minimumBilling);
  return 0;
}

/** Deal value used by the pipeline: the entered expected value, or an estimate. */
export function schoolValue(r: Record<string, unknown>): { value: number; estimated: boolean } {
  const entered = Number(r.dealValue) || 0;
  if (entered > 0) return { value: entered, estimated: false };
  const est = estimateJoveDayValue(r);
  return { value: est, estimated: est > 0 };
}

/* ─────────────────────────── dates ─────────────────────────── */

/** YYYY-MM-DD shifted by n days (local time). */
export function addDays(base: string, n: number) {
  const [y, m, d] = base.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + n);
  return isoDate(dt);
}

export function todayIso() {
  return isoDate(new Date());
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). */
export function daysBetween(from: string, to: string) {
  const a = Date.UTC(...(from.split("-").map(Number) as [number, number, number]));
  const b = Date.UTC(...(to.split("-").map(Number) as [number, number, number]));
  return Math.round((b - a) / 86_400_000);
}

export type FollowUpState = "none" | "overdue" | "today" | "soon" | "later";

export function followUpState(date: unknown, today: string): FollowUpState {
  const d = typeof date === "string" ? date.slice(0, 10) : "";
  if (!d || !today) return "none";
  if (d < today) return "overdue";
  if (d === today) return "today";
  return daysBetween(today, d) <= 3 ? "soon" : "later";
}

/** "Today", "Yesterday" or a short date, for inbox timestamps. */
export function relativeDay(value: unknown, today: string) {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  const iso = isoDate(d);
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (today && iso === today) return `Today · ${time}`;
  if (today && iso === addDays(today, -1)) return `Yesterday · ${time}`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: today && iso.slice(0, 4) === today.slice(0, 4) ? undefined : "numeric" });
}

/** Records created within the last n days. */
export function isWithinDays(value: unknown, n: number, today: string) {
  if (!value || !today) return false;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return false;
  const diff = daysBetween(isoDate(d), today);
  return diff >= 0 && diff < n;
}

/* ─────────────────────────── misc ─────────────────────────── */

export function str(v: unknown) {
  return v === undefined || v === null ? "" : String(v);
}

export function byDateDesc<T extends BaseRecord>(key: string) {
  return (a: T, b: T) => str(b[key]).localeCompare(str(a[key])) || str(b.createdAt).localeCompare(str(a.createdAt));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
