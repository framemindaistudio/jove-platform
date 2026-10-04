/**
 * Pure quote maths for the /packages estimator. No React here — easy to reason about and reuse.
 * All prices come from business.ts. Workshop & service prices are ex-GST; kit prices are incl. GST.
 */
import { addOns, gradeBands, joveDayRules, kits, packages, type GradeBandId, type PackageId } from "@/lib/content/business";
import { formatINR, formatNumber } from "@/lib/utils";
import { CLUB_MIN_STUDENTS, CLUB_PRICE, CLUB_SESSIONS_PER_MONTH, SESSIONS, YEAR_SMM_DISCOUNT, bandPrice, mediaIncluded } from "./data";

export const SMM_IDS = ["smm-starter", "smm-growth", "smm-premium"] as const;
export type SmmId = (typeof SMM_IDS)[number];
export const FILM_IDS = ["film-admissions", "film-premium"] as const;
export type FilmId = (typeof FILM_IDS)[number];

export const MAX_STUDENTS_PER_BAND = 2000;
export const MAX_MONTHS = 12;
/** "min. 10 teachers" from the teacher-training add-on detail. */
export const TEACHER_MIN = Number(/min\.\s?(\d+)/i.exec(addOns.find((a) => a.id === "teacher-training")?.detail ?? "")?.[1]) || 10;
/** "min. 30 kits" from the take-home kits add-on detail. */
export const KITS_MIN = Number(/min\.\s?(\d+)/i.exec(addOns.find((a) => a.id === "take-home-kits")?.detail ?? "")?.[1]) || 30;

export interface QuoteInput {
  pkg: PackageId;
  students: Record<GradeBandId, number>;
  /** JOVE Club only */
  clubMonths: number;
  smm: SmmId | "none";
  smmMonths: number;
  films: FilmId[];
  teacherTraining: boolean;
  teachers: number;
  takeHomeKits: boolean;
  labSetup: boolean;
}

export interface QuoteLine {
  id: string;
  label: string;
  detail: string;
  amount: number;
}

export interface Quote {
  pkg: PackageId;
  packageName: string;
  packageCadence: string;
  totalStudents: number;
  bandLines: (QuoteLine & { band: GradeBandId; students: number; price: number; batches: number })[];
  programmeSubtotal: number;
  adjustment: QuoteLine | null;
  programmeTotal: number;
  addOnLines: QuoteLine[];
  addOnsTotal: number;
  taxable: number;
  gstPercent: number;
  gst: number;
  kitLines: QuoteLine[];
  kitsTotal: number;
  kitsAtBulkPrice: boolean;
  total: number;
  /** programme value (ex-GST, after minimums) ÷ students */
  avgPerStudent: number;
  sessions: number;
  perStudentPerSession: number;
  /** Quarter / Year: like-for-like price of the same students on separate JOVE Days (per-student prices, ex-GST). */
  separateDays: number | null;
  savings: number | null;
  savingsPct: number | null;
  media: { value: number | null; label: string };
  /** JOVE Day: 50% of workshop fee incl. GST */
  advance: number | null;
  labSetupNote: string | null;
  notes: string[];
}

const addOn = (id: string) => addOns.find((a) => a.id === id);

export function defaultInput(): QuoteInput {
  // An example mix that matches the business plan's target day (≈ 250 students).
  const ratio: Record<GradeBandId, number> = { "g1-2": 0.24, "g3-5": 0.32, "g6-8": 0.28, "g9-10": 0.16 };
  const students = Object.fromEntries(gradeBands.map((b) => [b.id, Math.round((joveDayRules.targetStudentsPerDay * ratio[b.id]) / 10) * 10])) as Record<GradeBandId, number>;
  return {
    pkg: "jove-day",
    students,
    clubMonths: 3,
    smm: "none",
    smmMonths: 3,
    films: [],
    teacherTraining: false,
    teachers: TEACHER_MIN,
    takeHomeKits: false,
    labSetup: false,
  };
}

function sessionsFor(pkg: PackageId, clubMonths: number) {
  return pkg === "jove-club" ? CLUB_SESSIONS_PER_MONTH * clubMonths : SESSIONS[pkg];
}

export function computeQuote(input: QuoteInput): Quote {
  const pkgMeta = packages.find((p) => p.id === input.pkg) ?? packages[0];
  const isClub = input.pkg === "jove-club";
  const months = Math.max(1, Math.min(MAX_MONTHS, Math.round(input.clubMonths) || 1));
  const notes: string[] = [];

  /* programme lines */
  const bandLines = gradeBands
    .map((band) => {
      const students = Math.max(0, Math.min(MAX_STUDENTS_PER_BAND, Math.round(input.students[band.id] || 0)));
      const price = bandPrice(band, input.pkg);
      const amount = students * price * (isClub ? months : 1);
      return {
        id: band.id,
        band: band.id,
        label: `${band.name} · ${band.grades}`,
        detail: `${formatNumber(students)} × ${formatINR(price)}${isClub ? ` × ${months} mo` : ""}`,
        amount,
        students,
        price,
        batches: students > 0 ? Math.ceil(students / band.maxPerSession) : 0,
      };
    })
    .filter((l) => l.students > 0);

  const totalStudents = bandLines.reduce((s, l) => s + l.students, 0);
  const programmeSubtotal = bandLines.reduce((s, l) => s + l.amount, 0);

  /* minimums */
  let adjustment: QuoteLine | null = null;
  if (input.pkg === "jove-day" && totalStudents > 0) {
    if (programmeSubtotal < joveDayRules.minimumBilling) {
      adjustment = {
        id: "minimum",
        label: "Minimum billing top-up",
        detail: `A JOVE Day is billed at least ${formatINR(joveDayRules.minimumBilling)}`,
        amount: joveDayRules.minimumBilling - programmeSubtotal,
      };
    }
    if (totalStudents < joveDayRules.minimumStudents) {
      notes.push(`A JOVE Day is planned for ${joveDayRules.minimumStudents}+ students. Below that, the day is billed at the ${formatINR(joveDayRules.minimumBilling)} minimum.`);
    }
    if (totalStudents > joveDayRules.maxStudentsPerDay) {
      notes.push(`We run up to ${formatNumber(joveDayRules.maxStudentsPerDay)} students in one day. For ${formatNumber(totalStudents)}, we'll plan the extra students into a second day with you.`);
    }
  }
  if (isClub && totalStudents > 0 && totalStudents < CLUB_MIN_STUDENTS) {
    adjustment = {
      id: "minimum",
      label: "Minimum enrolment top-up",
      detail: `JOVE Club runs with at least ${CLUB_MIN_STUDENTS} students`,
      amount: (CLUB_MIN_STUDENTS - totalStudents) * CLUB_PRICE * months,
    };
  }
  for (const l of bandLines) {
    const band = gradeBands.find((b) => b.id === l.band);
    if (band && l.batches > 1 && !isClub) notes.push(`${band.name}: ${formatNumber(l.students)} students run as ${l.batches} batches (up to ${band.maxPerSession} per session).`);
  }
  const programmeTotal = programmeSubtotal + (adjustment?.amount ?? 0);

  /* add-ons (ex-GST) */
  const addOnLines: QuoteLine[] = [];
  if (input.smm !== "none") {
    const a = addOn(input.smm);
    if (a) {
      const m = Math.max(1, Math.min(MAX_MONTHS, Math.round(input.smmMonths) || 1));
      const gross = a.priceValue * m;
      addOnLines.push({ id: a.id, label: a.name, detail: `${formatINR(a.priceValue)} × ${m} mo`, amount: gross });
      if (input.pkg === "jove-year" && YEAR_SMM_DISCOUNT > 0) {
        addOnLines.push({ id: `${a.id}-discount`, label: `JOVE Year benefit: ${YEAR_SMM_DISCOUNT}% off social media`, detail: `− ${YEAR_SMM_DISCOUNT}% of ${formatINR(gross)}`, amount: -Math.round((gross * YEAR_SMM_DISCOUNT) / 100) });
      }
    }
  }
  for (const id of input.films) {
    const a = addOn(id);
    if (a) addOnLines.push({ id: a.id, label: a.name, detail: "1 project", amount: a.priceValue });
  }
  if (input.teacherTraining) {
    const a = addOn("teacher-training");
    if (a) {
      const t = Math.max(TEACHER_MIN, Math.round(input.teachers) || TEACHER_MIN);
      addOnLines.push({ id: a.id, label: a.name, detail: `${t} × ${formatINR(a.priceValue)}`, amount: t * a.priceValue });
      if ((Math.round(input.teachers) || 0) < TEACHER_MIN) notes.push(`Teacher training runs for a minimum of ${TEACHER_MIN} teachers.`);
    }
  }
  const addOnsTotal = addOnLines.reduce((s, l) => s + l.amount, 0);

  const taxable = programmeTotal + addOnsTotal;
  const gstPercent = joveDayRules.gstPercent;
  const gst = Math.round((taxable * gstPercent) / 100);

  /* take-home kits (school price, GST included) */
  const kitLines: QuoteLine[] = [];
  let kitsAtBulkPrice = false;
  if (input.takeHomeKits && totalStudents > 0) {
    kitsAtBulkPrice = totalStudents >= KITS_MIN;
    for (const l of bandLines) {
      const band = gradeBands.find((b) => b.id === l.band);
      const kit = kits.find((k) => k.id === band?.kitId);
      if (!kit) continue;
      const price = kitsAtBulkPrice ? kit.schoolPrice : kit.mrp;
      kitLines.push({ id: kit.id, label: kit.name, detail: `${formatNumber(l.students)} × ${formatINR(price)}`, amount: l.students * price });
    }
    if (!kitsAtBulkPrice) notes.push(`The bulk school price on take-home kits starts at ${KITS_MIN} kits — shown at MRP.`);
  }
  const kitsTotal = kitLines.reduce((s, l) => s + l.amount, 0);

  const total = taxable + gst + kitsTotal;
  const sessions = sessionsFor(input.pkg, months);
  const avgPerStudent = totalStudents ? programmeTotal / totalStudents : 0;

  let separateDays: number | null = null;
  let savings: number | null = null;
  let savingsPct: number | null = null;
  if ((input.pkg === "jove-quarter" || input.pkg === "jove-year") && totalStudents > 0) {
    separateDays = bandLines.reduce((s, l) => {
      const band = gradeBands.find((b) => b.id === l.band);
      return s + (band ? l.students * band.pricePerStudent * SESSIONS[input.pkg as "jove-quarter" | "jove-year"] : 0);
    }, 0);
    savings = separateDays - programmeSubtotal;
    savingsPct = separateDays ? (savings / separateDays) * 100 : 0;
  }

  const advance = input.pkg === "jove-day" && totalStudents > 0 ? Math.round(((programmeTotal * (100 + gstPercent)) / 100) * (joveDayRules.advancePercent / 100)) : null;

  const lab = addOn("lab-setup");
  const labSetupNote = input.labSetup && lab ? `${lab.name}: ${lab.price} — quoted after a site visit` : null;

  if (input.pkg === "jove-year" && input.smm === "none" && YEAR_SMM_DISCOUNT > 0) {
    notes.push(`JOVE Year includes ${YEAR_SMM_DISCOUNT}% off any Social Media Management plan.`);
  }

  return {
    pkg: input.pkg,
    packageName: pkgMeta.name,
    packageCadence: pkgMeta.cadence,
    totalStudents,
    bandLines,
    programmeSubtotal,
    adjustment,
    programmeTotal,
    addOnLines,
    addOnsTotal,
    taxable,
    gstPercent,
    gst,
    kitLines,
    kitsTotal,
    kitsAtBulkPrice,
    total,
    avgPerStudent,
    sessions,
    perStudentPerSession: sessions ? avgPerStudent / sessions : 0,
    separateDays,
    savings,
    savingsPct,
    media: mediaIncluded(input.pkg),
    advance,
    labSetupNote,
    notes,
  };
}

/** Plain-text breakdown that lands in HQ → Leads (API caps the message at 3,000 characters). */
export function quoteMessage(q: Quote, extra?: string) {
  const L: string[] = [];
  L.push(`QUOTE ESTIMATE (website /packages)`);
  L.push(`Package: ${q.packageName} — ${q.packageCadence}`);
  L.push(`Students: ${formatNumber(q.totalStudents)}`);
  L.push("");
  for (const l of q.bandLines) L.push(`• ${l.label}: ${l.detail} = ${formatINR(l.amount)}${l.batches > 1 && q.pkg !== "jove-club" ? ` (${l.batches} batches)` : ""}`);
  L.push(`Programme subtotal: ${formatINR(q.programmeSubtotal)}`);
  if (q.adjustment) L.push(`${q.adjustment.label}: ${formatINR(q.adjustment.amount)}`);
  if (q.addOnLines.length) {
    L.push("");
    L.push("Add-ons:");
    for (const l of q.addOnLines) L.push(`• ${l.label}: ${l.detail} = ${formatINR(l.amount)}`);
  }
  L.push("");
  L.push(`Taxable value: ${formatINR(q.taxable)}`);
  L.push(`GST @ ${q.gstPercent}%: ${formatINR(q.gst)}`);
  if (q.kitLines.length) {
    L.push(`Take-home kits (${q.kitsAtBulkPrice ? "school price" : "MRP"}, incl. GST):`);
    for (const l of q.kitLines) L.push(`• ${l.label}: ${l.detail} = ${formatINR(l.amount)}`);
  }
  L.push(`ESTIMATED TOTAL: ${formatINR(q.total)}`);
  L.push("");
  if (q.totalStudents) L.push(`Average per student (programme, ex-GST): ${formatINR(q.avgPerStudent)}${q.sessions > 1 ? ` (${formatINR(q.perStudentPerSession)} per session)` : ""}`);
  if (q.savings !== null && q.separateDays !== null) L.push(`Saving vs ${SESSIONS[q.pkg as "jove-quarter" | "jove-year"]} separate JOVE Days: ${formatINR(q.savings)} (${Math.round(q.savingsPct ?? 0)}%)`);
  L.push(`Media included: ${q.media.label}${q.media.value ? ` (≈ ${formatINR(q.media.value)} market value)` : ""}`);
  if (q.advance) L.push(`Advance to confirm (${joveDayRules.advancePercent}% of workshop fee incl. GST): ${formatINR(q.advance)}`);
  if (q.labSetupNote) L.push(`Also interested in: ${q.labSetupNote}`);
  if (q.notes.length) {
    L.push("");
    for (const n of q.notes) L.push(`Note: ${n}`);
  }
  if (extra?.trim()) {
    L.push("");
    L.push(`Message: ${extra.trim()}`);
  }
  const text = L.join("\n");
  return text.length > 2990 ? `${text.slice(0, 2985)}…` : text;
}
