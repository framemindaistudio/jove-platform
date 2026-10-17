/**
 * The website estimate a school sends with "Request the proposal".
 * The estimator builds it, the public form checks it, and HQ turns it into a proposal.
 * Only choices travel; prices are worked out again in HQ from the price book.
 */
import { addOns, gradeBands, packages, type GradeBandId, type PackageId } from "@/lib/content/business";

export interface LeadEstimate {
  pkg: PackageId;
  students: Record<GradeBandId, number>;
  /** JOVE Club only */
  clubMonths: number;
  smm: string;
  smmMonths: number;
  films: string[];
  teacherTraining: boolean;
  teachers: number;
  takeHomeKits: boolean;
  labSetup: boolean;
  /** The total the visitor saw, for reference only. */
  total: number;
}

const whole = (v: unknown, max: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0;
};
const ADDON_IDS = new Set(addOns.map((a) => a.id));

/** Keeps only known choices within sensible limits; anything else is dropped. */
export function cleanEstimate(v: unknown): LeadEstimate | undefined {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const e = v as Record<string, unknown>;
  if (!packages.some((p) => p.id === e.pkg)) return undefined;
  const raw = e.students && typeof e.students === "object" ? (e.students as Record<string, unknown>) : {};
  const students = Object.fromEntries(gradeBands.map((b) => [b.id, whole(raw[b.id], 5000)])) as Record<GradeBandId, number>;
  if (!Object.values(students).some((n) => n > 0)) return undefined;
  const smm = typeof e.smm === "string" && e.smm.startsWith("smm-") && ADDON_IDS.has(e.smm) ? e.smm : "none";
  return {
    pkg: e.pkg as PackageId,
    students,
    clubMonths: Math.max(1, whole(e.clubMonths, 12)),
    smm,
    smmMonths: smm === "none" ? 0 : Math.max(1, whole(e.smmMonths, 12)),
    films: Array.isArray(e.films) ? [...new Set(e.films.map(String).filter((id) => id.startsWith("film-") && ADDON_IDS.has(id)))] : [],
    teacherTraining: e.teacherTraining === true,
    teachers: whole(e.teachers, 500),
    takeHomeKits: e.takeHomeKits === true,
    labSetup: e.labSetup === true,
    total: whole(e.total, 100_000_000),
  };
}
