/**
 * Workshop-day mode: what is on now, the head counts, the kit count and the day's log, kept on the workshop record.
 * Pure functions only; DayMode.tsx shows them.
 *
 * Stored on the workshop:
 *   attended  { "g1-2": 58, … }                         students actually present, per grade group
 *   kitCount  { "g1-2": { out, back, damaged }, … }     kits taken to the school and brought back
 *   dayLog    [{ id, at, by, kind, text }]              notes written during the day
 */
import type { GradeBandId } from "@/lib/content/business";
import { bandPlan, bandStudents, bookedBands, CHECKLIST, minutesOf, scheduleOf, sortSchedule, str, type Rec, type ScheduleRow } from "./logic";

export const DAY_PHASE = CHECKLIST.find((p) => p.id === "day")!;

export type LogKind = "note" | "incident" | "kit" | "media" | "safeguarding";
export interface LogEntry {
  id: string;
  /** ISO time */
  at: string;
  by: string;
  kind: LogKind;
  text: string;
}

export const LOG_KINDS: { id: LogKind; label: string; hint: string }[] = [
  { id: "note", label: "Note", hint: "Anything worth remembering for the report." },
  { id: "incident", label: "Accident or first aid", hint: "What happened and what was done. No children's names here." },
  { id: "kit", label: "Kit problem", hint: "Which kit or part, and what is wrong with it." },
  { id: "media", label: "Media moment", hint: "A moment the editors should look for in the footage." },
  { id: "safeguarding", label: "Concern about a child", hint: "" },
];

/** A concern about a child is never written here: everyone with an HQ login can read a workshop. */
export const SAFEGUARDING_TEXT = "A concern about a child was raised and reported to the Safeguarding Lead.";

export interface KitCount {
  out: number;
  back: number;
  damaged: number;
}

const whole = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));

export function attendedOf(w: Rec): Partial<Record<GradeBandId, number>> {
  const a = w.attended;
  if (!a || typeof a !== "object" || Array.isArray(a)) return {};
  return Object.fromEntries(Object.entries(a as Record<string, unknown>).map(([k, v]) => [k, whole(v)])) as Partial<Record<GradeBandId, number>>;
}

/** The kits counted for each booked grade group; "out" starts at the number the kit plan packs. */
export function kitCountOf(w: Rec): { band: ReturnType<typeof bookedBands>[number]; planned: number; count: KitCount }[] {
  const saved = w.kitCount && typeof w.kitCount === "object" && !Array.isArray(w.kitCount) ? (w.kitCount as Record<string, Partial<KitCount>>) : {};
  return bookedBands(w).map((band) => {
    const planned = bandPlan(w, band).kitsToPack;
    const c = saved[band.id] ?? {};
    return { band, planned, count: { out: c.out === undefined ? planned : whole(c.out), back: whole(c.back), damaged: whole(c.damaged) } };
  });
}

export function dayLogOf(w: Rec): LogEntry[] {
  const raw = Array.isArray(w.dayLog) ? (w.dayLog as Partial<LogEntry>[]) : [];
  return raw
    .filter((e) => e && typeof e.text === "string" && typeof e.at === "string")
    .map((e) => ({ id: str(e.id) || str(e.at), at: str(e.at), by: str(e.by), kind: (LOG_KINDS.some((k) => k.id === e.kind) ? e.kind : "note") as LogKind, text: str(e.text) }))
    .sort((a, b) => b.at.localeCompare(a.at));
}

/** The session on now (there can be two, one per hall), the next one to start, and how far the day has gone. */
export function nowAndNext(w: Rec, minutes: number) {
  const rows = sortSchedule(scheduleOf(w).rows);
  const span = (r: ScheduleRow) => ({ start: minutesOf(r.time), end: r.end ? minutesOf(r.end) : minutesOf(r.time) + 30 });
  const now = rows.filter((r) => span(r).start <= minutes && minutes < span(r).end);
  const next = rows.find((r) => span(r).start > minutes) ?? null;
  const first = rows.length ? span(rows[0]).start : 0;
  const last = rows.length ? Math.max(...rows.map((r) => span(r).end)) : 0;
  const progress = last > first ? Math.min(1, Math.max(0, (minutes - first) / (last - first))) : 0;
  return { rows, now, next, progress, started: minutes >= first, over: rows.length > 0 && minutes >= last };
}

export const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** The post-workshop report, written from what was counted and noted during the day. */
export function reportFromDay(w: Rec): string {
  const att = attendedOf(w);
  const bands = bookedBands(w);
  const counted = bands.some((b) => att[b.id] !== undefined);
  const present = bands.reduce((s, b) => s + (att[b.id] ?? 0), 0);
  const expected = bands.reduce((s, b) => s + bandStudents(w, b.id), 0);
  const kits = kitCountOf(w);
  const log = [...dayLogOf(w)].reverse();
  const time = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const lines = (kind: LogKind[]) => log.filter((e) => kind.includes(e.kind)).map((e) => `- ${time(e.at)} ${e.text}${e.by ? ` (${e.by})` : ""}`);
  const team = Array.isArray(w.team) ? (w.team as unknown[]).map(String).filter(Boolean) : [];

  return [
    `Post-workshop report: ${str(w.title)} (${str(w.date)})`,
    counted
      ? `Attendance: ${present} of ${expected} students. ${bands.map((b) => `${b.grades}: ${att[b.id] ?? 0} of ${bandStudents(w, b.id)}`).join("; ")}.`
      : `Attendance: ${expected} students expected (not counted on the day).`,
    `Team on site: ${team.join(", ")}`,
    "What went well:",
    ...(lines(["note"]).length ? lines(["note"]) : ["-"]),
    "What to improve next time:",
    "-",
    "Incidents, damages or kit losses:",
    ...(lines(["incident", "kit", "safeguarding"]).length ? lines(["incident", "kit", "safeguarding"]) : ["- None recorded"]),
    "Kits returned & condition:",
    ...(kits.length ? kits.map(({ band, count }) => `- ${band.grades}: ${count.back} of ${count.out} back${count.out > count.back ? `, ${count.out - count.back} missing` : ""}${count.damaged ? `, ${count.damaged} damaged` : ""}`) : ["-"]),
    "Media captured (reels, film, drone, interview):",
    ...(lines(["media"]).length ? lines(["media"]) : ["-"]),
    "School feedback in one line:",
    "Next step with the school (JOVE Quarter / Year / Club):",
    "",
  ].join("\n");
}
