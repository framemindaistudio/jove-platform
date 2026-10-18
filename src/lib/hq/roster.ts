/**
 * A workshop's student list: the names the school sends a few days before a JOVE Day, used to print attendance
 * sheets with the names on them, to issue the participation certificates the day before (handed out at the
 * closing Show), and afterwards to mark who was absent, cancel their certificates and fill in the head counts.
 *
 * Stored per workshop at data/rosters/<workshopId>.json (see app/api/hq/workshops/[id]/students), never on the
 * workshop record, which every role (interns included) reads. Only name, grade and section are kept: no phone
 * numbers, addresses or dates of birth.
 *
 * Pure functions only, shared by the server route and the screens.
 */
import { gradeBands, packages, type GradeBandId } from "@/lib/content/business";

export interface Student {
  id: string;
  name: string;
  /** as the school wrote it: "7", "Grade 7", "VII", "7th" */
  grade: string;
  section?: string;
  /** ticked absent after the day; everyone else on the list counts as present */
  absent?: boolean;
  /** added on the day: not on the school's list */
  walkIn?: boolean;
  /** the participation certificate issued for this student */
  certId?: string;
  certCode?: string;
}

export interface Roster {
  students: Student[];
  updatedAt?: string;
  updatedBy?: string;
}

export const ROSTER_LIMITS = { students: 1500, name: 80, grade: 20, section: 12 };

const ROMAN: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };

/** The grade as a number (1–10), from "7", "Grade 7", "7th", "VII", "Std 7", or null. */
export function gradeNumber(grade: string): number | null {
  const g = grade.toLowerCase().replace(/grade|class|std\.?|standard/g, " ").trim();
  const digits = /\b(\d{1,2})(?:st|nd|rd|th)?\b/.exec(g);
  if (digits) {
    const n = Number(digits[1]);
    return n >= 1 && n <= 12 ? n : null;
  }
  const roman = /\b(x|ix|viii|vii|vi|v|iv|iii|ii|i)\b/.exec(g);
  return roman ? ROMAN[roman[1]] : null;
}

/** The JOVE grade group a grade belongs to. */
export function bandOf(grade: string): GradeBandId | null {
  const n = gradeNumber(grade);
  if (n === null) return null;
  if (n <= 2) return "g1-2";
  if (n <= 5) return "g3-5";
  if (n <= 8) return "g6-8";
  if (n <= 10) return "g9-10";
  return null;
}

/** "Grade 7 B": how a class is named on sheets and certificates. */
export function classLabel(s: Pick<Student, "grade" | "section">): string {
  const n = gradeNumber(s.grade);
  const grade = n !== null ? `Grade ${n}` : s.grade.trim() || "No grade";
  return s.section?.trim() ? `${grade} ${s.section.trim().toUpperCase()}` : grade;
}

/** Sort key: grade number, then section, then name. */
export function studentOrder(a: Student, b: Student) {
  const ga = gradeNumber(a.grade) ?? 99, gb = gradeNumber(b.grade) ?? 99;
  if (ga !== gb) return ga - gb;
  const sa = (a.section ?? "").toUpperCase(), sb = (b.section ?? "").toUpperCase();
  if (sa !== sb) return sa < sb ? -1 : 1;
  return a.name.localeCompare(b.name, "en-IN");
}

/** The students in class order, grouped: [{ label, students }]. */
export function byClass(students: Student[]) {
  const groups = new Map<string, Student[]>();
  for (const s of [...students].sort(studentOrder)) {
    const k = classLabel(s);
    groups.set(k, [...(groups.get(k) ?? []), s]);
  }
  return [...groups.entries()].map(([label, list]) => ({ label, students: list }));
}

export interface ParsedLine {
  name: string;
  grade: string;
  section: string;
  /** the line as typed, for messages */
  line: string;
}

/**
 * A pasted list: one student per line, "Name, Grade, Section" or columns copied from Excel or Google Sheets (tabs).
 * A header row ("Name  Grade  Section") is skipped. `defaultGrade` / `defaultSection` fill lines without them, for
 * a class list pasted on its own.
 */
export function parseRoster(text: string, defaults: { grade?: string; section?: string } = {}): { rows: ParsedLine[]; problems: string[] } {
  const rows: ParsedLine[] = [];
  const problems: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const cells = (line.includes("\t") ? line.split("\t") : line.split(",")).map((c) => c.trim());
    if (rows.length === 0 && /^(student\s*)?name$/i.test(cells[0] ?? "")) continue; // header row
    // a leading serial number ("1", "1.", "12)") is dropped
    if (/^\d{1,4}[.)]?$/.test(cells[0] ?? "") && cells.length > 1) cells.shift();
    const [name = "", grade = defaults.grade ?? "", section = defaults.section ?? ""] = cells;
    // "1. Aarav", "12) Aarav", "3 - Aarav": a serial number in front of the name is dropped
    const clean = name.replace(/\s+/g, " ").trim().replace(/^\d{1,4}\s*[.)\-:]\s*/, "");
    if (!clean) continue;
    if (clean.length > ROSTER_LIMITS.name) problems.push(`Name too long: “${clean.slice(0, 30)}…”`);
    else if (/\d{6,}|@/.test(clean)) problems.push(`Looks like a phone number or email, not a name: “${clean.slice(0, 30)}”`);
    else rows.push({ name: clean, grade: (grade || defaults.grade || "").trim().slice(0, ROSTER_LIMITS.grade), section: (section || defaults.section || "").trim().slice(0, ROSTER_LIMITS.section), line });
  }
  return { rows, problems };
}

/** How many of the list are in each grade group, present (not ticked absent). */
export function presentByBand(students: Student[]): Partial<Record<GradeBandId, number>> {
  const out: Partial<Record<GradeBandId, number>> = {};
  for (const s of students) {
    const b = bandOf(s.grade);
    if (b && !s.absent) out[b] = (out[b] ?? 0) + 1;
  }
  return out;
}

/** The programme line on a participation certificate for this student: "JOVE Day: Young Makers (Grades 3–5)". */
export function programFor(packageId: string | undefined, grade: string) {
  const pkg = packages.find((p) => p.id === packageId)?.name ?? "JOVE Day";
  const band = gradeBands.find((b) => b.id === bandOf(grade));
  return band ? `${pkg}: ${band.name} (${band.grades})` : `${pkg}: Robotics, AI & ML Workshop`;
}

/** Checks a list sent to the server; returns it cleaned, or the reason it was refused. */
export function cleanRoster(input: unknown): { students: Student[] } | { error: string } {
  if (!input || typeof input !== "object" || !Array.isArray((input as Roster).students)) return { error: "Missing students" };
  const list = (input as Roster).students;
  if (list.length > ROSTER_LIMITS.students) return { error: `At most ${ROSTER_LIMITS.students} students on one workshop.` };
  const ids = new Set<string>();
  const students: Student[] = [];
  for (const s of list) {
    if (!s || typeof s !== "object") return { error: "A student entry is not valid." };
    const id = String(s.id ?? "");
    const name = String(s.name ?? "").replace(/\s+/g, " ").trim();
    if (!/^[\w-]{1,40}$/.test(id) || ids.has(id)) return { error: "A student entry has no valid id." };
    if (!name || name.length > ROSTER_LIMITS.name) return { error: `Name missing or too long: “${name.slice(0, 30)}”` };
    ids.add(id);
    students.push({
      id,
      name,
      grade: String(s.grade ?? "").trim().slice(0, ROSTER_LIMITS.grade),
      ...(s.section ? { section: String(s.section).trim().slice(0, ROSTER_LIMITS.section) } : {}),
      ...(s.absent ? { absent: true } : {}),
      ...(s.walkIn ? { walkIn: true } : {}),
      ...(s.certId ? { certId: String(s.certId).slice(0, 60) } : {}),
      ...(s.certCode ? { certCode: String(s.certCode).slice(0, 40) } : {}),
    });
  }
  return { students };
}
