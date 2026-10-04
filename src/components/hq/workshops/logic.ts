/**
 * Workshop & travel maths for HQ — pure functions, no React.
 * Every number comes from src/lib/content/business.ts (single source of truth).
 */
import {
  gradeBands,
  joveDayRules,
  joveDaySchedule,
  kits,
  launchCapex,
  mediaPack,
  packages,
  workshopCostModel,
  type GradeBand,
  type GradeBandId,
  type Kit,
} from "@/lib/content/business";
import { getCollection, totalStudents, tripTotal, type BaseRecord, type FieldOption } from "@/lib/hq/collections";

export type Rec = BaseRecord;

/* ─────────────────────────── primitives ─────────────────────────── */

export const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
export const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
export const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);

function fieldOptions(collection: string, key: string): FieldOption[] {
  return getCollection(collection)?.fields.find((f) => f.key === key)?.options ?? [];
}

export const WORKSHOP_STATUS = fieldOptions("workshops", "status");
export const PACKAGE_OPTIONS = fieldOptions("workshops", "package");
export const DRONE_OPTIONS = fieldOptions("workshops", "droneAllowed");
export const TRIP_VEHICLES = fieldOptions("trips", "vehicle");

export function optionLabel(options: FieldOption[], value: unknown) {
  return options.find((o) => o.value === value)?.label ?? str(value);
}

/* ─────────────────────────── dates (local, YYYY-MM-DD) ─────────────────────────── */

export function isIso(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v);
}

/** "2026-10-02" → local Date at midnight (never UTC-shifted). */
export function parseIso(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, n: number) {
  const d = parseIso(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string) {
  return Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / 86_400_000);
}

export function countdownLabel(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `In ${days} days` : `${-days} days ago`;
}

export function longDate(iso: string) {
  if (!isIso(iso)) return "—";
  return parseIso(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function shortDate(iso: string) {
  if (!isIso(iso)) return "—";
  return parseIso(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function dayMonth(iso: string) {
  if (!isIso(iso)) return "—";
  return parseIso(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** "07:30" → minutes since midnight. */
export function minutesOf(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/* ─────────────────────────── students & bands ─────────────────────────── */

export const BAND_FIELD: Record<GradeBandId, "studentsG12" | "studentsG35" | "studentsG68" | "studentsG910"> = {
  "g1-2": "studentsG12",
  "g3-5": "studentsG35",
  "g6-8": "studentsG68",
  "g9-10": "studentsG910",
};

export function bandStudents(r: Record<string, unknown>, id: GradeBandId) {
  return Math.max(0, Math.round(num(r[BAND_FIELD[id]])));
}

export function bookedBands(r: Record<string, unknown>): GradeBand[] {
  return gradeBands.filter((b) => bandStudents(r, b.id) > 0);
}

export function studentsOf(r: Record<string, unknown>) {
  return totalStudents(r);
}

export function kitFor(band: GradeBand): Kit | undefined {
  return kits.find((k) => k.id === band.kitId);
}

/* ─────────────────────────── value & money ─────────────────────────── */

/** JOVE Club price per student per month, read from the package copy so it never drifts. */
export const CLUB_PRICE_PER_STUDENT = (() => {
  const note = packages.find((p) => p.id === "jove-club")?.priceNote ?? "";
  const m = /₹\s?([\d,]+)/.exec(note);
  return m ? Number(m[1].replace(/,/g, "")) : 0;
})();

export function rateFor(pkg: string, band: GradeBand) {
  switch (pkg) {
    case "jove-quarter":
      return band.quarterPricePerStudent;
    case "jove-year":
      return band.yearPricePerStudent;
    case "jove-club":
      return CLUB_PRICE_PER_STUDENT;
    default:
      return band.pricePerStudent;
  }
}

/** Computed value of a workshop from its student counts and package (ex-GST). */
export function workshopValue(r: Record<string, unknown>) {
  const pkg = str(r.package) || "jove-day";
  const lines = gradeBands
    .map((band) => {
      const students = bandStudents(r, band.id);
      const rate = rateFor(pkg, band);
      return { band, students, rate, amount: students * rate };
    })
    .filter((l) => l.students > 0);
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const minimumApplies = pkg === "jove-day" && subtotal > 0 && subtotal < joveDayRules.minimumBilling;
  return {
    pkg,
    lines,
    subtotal,
    minimumApplies,
    value: minimumApplies ? joveDayRules.minimumBilling : subtotal,
    students: lines.reduce((s, l) => s + l.students, 0),
  };
}

export function money(r: Record<string, unknown>) {
  const agreed = num(r.agreedAmount);
  const computed = workshopValue(r).value;
  const basis = agreed || computed;
  const advanceDue = Math.round((basis * joveDayRules.advancePercent) / 100);
  const advanceReceived = num(r.advanceReceived);
  const gst = Math.round((basis * joveDayRules.gstPercent) / 100);
  return {
    agreed,
    computed,
    basis,
    estimated: !agreed,
    difference: agreed ? agreed - computed : 0,
    advanceDue,
    advanceReceived,
    advanceShort: Math.max(0, advanceDue - advanceReceived),
    advanceOk: basis > 0 && advanceReceived >= advanceDue,
    balance: Math.max(0, basis - advanceReceived),
    gst,
    totalWithGst: basis + gst,
    balanceDueDate: isIso(r.date) ? addDays(String(r.date), joveDayRules.balanceDueDays) : "",
  };
}

/** Warnings about the commercial rules of a JOVE Day. */
export function dayWarnings(r: Record<string, unknown>) {
  const out: string[] = [];
  const students = studentsOf(r);
  const pkg = str(r.package) || "jove-day";
  if (pkg === "jove-day" && students > 0 && students < joveDayRules.minimumStudents)
    out.push(`Below the ${joveDayRules.minimumStudents}-student minimum — minimum billing of ₹${joveDayRules.minimumBilling.toLocaleString("en-IN")} applies.`);
  if (students > joveDayRules.maxStudentsPerDay) out.push(`${students} students is above the ${joveDayRules.maxStudentsPerDay}-student daily capacity — split across two days.`);
  for (const band of bookedBands(r)) {
    const sessions = Math.ceil(bandStudents(r, band.id) / band.maxPerSession);
    if (sessions > 2) out.push(`${band.name} needs ${sessions} sessions (max ${band.maxPerSession} per session) — the default day has one overflow slot.`);
  }
  return out;
}

/* ─────────────────────────── statuses ─────────────────────────── */

export const isClosed = (r: Record<string, unknown>) => ["cancelled", "completed"].includes(str(r.status));
export const isCancelled = (r: Record<string, unknown>) => str(r.status) === "cancelled";

/* ─────────────────────────── checklist ─────────────────────────── */

export type PhaseId = "t14" | "t7" | "t3" | "t1" | "day" | "post";
export type Owner = "Sales" | "Ops" | "Finance" | "Media" | "Trainer" | "Team";

export interface ChecklistItem {
  id: string;
  label: string;
  detail?: string;
  owner: Owner;
}

export interface ChecklistPhase {
  id: PhaseId;
  code: string;
  label: string;
  /** days relative to the workshop date when this phase should be complete */
  offset: number;
  items: ChecklistItem[];
}

/** The JOVE Day SOP as a checklist. Item ids are stored on the workshop record — never rename them. */
export const CHECKLIST: ChecklistPhase[] = [
  {
    id: "t14",
    code: "T-14",
    label: "Two weeks out",
    offset: -14,
    items: [
      { id: "t14-confirm", label: "Written confirmation received", detail: "Email or signed letter from the principal with date, timings and student counts.", owner: "Sales" },
      { id: "t14-advance", label: `${joveDayRules.advancePercent}% advance received`, detail: "The date is held only once the advance lands. Record it on the workshop.", owner: "Finance" },
      { id: "t14-counts", label: "Student counts per grade band confirmed", detail: "Counts drive stations, kits, worksheets, certificates and the invoice.", owner: "Sales" },
      { id: "t14-halls", label: "Halls, assembly slot & timings agreed", detail: "Hall A (seniors), Hall B (juniors), assembly ground for the opening show and ceremony.", owner: "Ops" },
      { id: "t14-consent-sent", label: "Photo/video consent forms sent to the school", detail: "Parents' consent for filming; ask for an opt-out list.", owner: "Media" },
      { id: "t14-drone-request", label: "Drone permission requested in writing", detail: "Check the campus on the Digital Sky airspace map (green / yellow / red zone).", owner: "Media" },
      { id: "t14-team", label: "Team assigned", detail: "Founders + 2 trainers + media crew; Hall A and Hall B leads named.", owner: "Ops" },
    ],
  },
  {
    id: "t7",
    code: "T-7",
    label: "One week out",
    offset: -7,
    items: [
      { id: "t7-kits-counted", label: "Kits counted against the station plan", detail: "Stations per band plus 10% spares — see Kits & materials.", owner: "Ops" },
      { id: "t7-kits-tested", label: "Every station kit tested", detail: "Motors spin, sensors read, Arduino / ESP32 boards flashed with the session sketch.", owner: "Trainer" },
      { id: "t7-consumables", label: "Consumables in stock for every student", detail: "Cells, LEDs, cardboard sheets, copper tape, jumper wires.", owner: "Ops" },
      { id: "t7-certificates", label: "Certificates printed", detail: "One per student — request the name list or print blank-name certificates.", owner: "Ops" },
      { id: "t7-worksheets", label: "Worksheets printed", detail: "One set per student, per band.", owner: "Ops" },
      { id: "t7-vehicle", label: "Vehicle booked & driver confirmed", owner: "Ops" },
      { id: "t7-stay", label: "Route planned; stay booked if outstation", owner: "Ops" },
      { id: "t7-av", label: "Projector, screen, power points & PA confirmed with the school", owner: "Ops" },
      { id: "t7-shotlist", label: "Shot list & reel concepts ready", detail: "FrameMind AI Studio plan: opening show, builds, ceremony, drone formation.", owner: "Media" },
      { id: "t7-airspace", label: "Drone airspace check & permission recorded", detail: "Update the workshop's drone permission to Granted or Not allowed.", owner: "Media" },
    ],
  },
  {
    id: "t3",
    code: "T-3",
    label: "Three days out",
    offset: -3,
    items: [
      { id: "t3-consent-collected", label: "Consent forms collected / opt-out list received", owner: "Media" },
      { id: "t3-cells", label: "Rechargeable cells & power banks charged", detail: "Fresh AA stock packed for every battery set.", owner: "Trainer" },
      { id: "t3-laptops", label: "Laptops updated & tested offline", detail: "Arduino IDE, ML training tool and session files work without internet.", owner: "Trainer" },
      { id: "t3-show", label: "Opening robot + drone show rehearsed", owner: "Team" },
      { id: "t3-feedback-forms", label: "Feedback forms printed", detail: "Student, teacher and principal versions.", owner: "Ops" },
      { id: "t3-runsheet", label: "Run sheet shared with the team & school coordinator", owner: "Ops" },
      { id: "t3-packing", label: "Packing list printed & crates labelled by hall", owner: "Ops" },
    ],
  },
  {
    id: "t1",
    code: "T-1",
    label: "Day before",
    offset: -1,
    items: [
      { id: "t1-reconfirm", label: "Timings reconfirmed with the school coordinator", owner: "Sales" },
      { id: "t1-loaded", label: "Vehicle loaded from the packing list", owner: "Ops" },
      { id: "t1-media-gear", label: "Media gear packed", detail: "Cameras, gimbal, mics, drone + charged batteries, formatted cards, backup SSD.", owner: "Media" },
      { id: "t1-attendance", label: "Attendance sheets printed per band", owner: "Ops" },
      { id: "t1-departure", label: "Departure time, route & weather checked", owner: "Ops" },
    ],
  },
  {
    id: "day",
    code: "Day",
    label: "Day of the workshop",
    offset: 0,
    items: [
      { id: "d-arrive", label: "Reported to the school coordinator on time", owner: "Team" },
      { id: "d-setup", label: "Stations, arena, banners & projector set up; power tested", owner: "Team" },
      { id: "d-preflight", label: "Drone pre-flight checks (only if permitted)", owner: "Media" },
      { id: "d-show", label: "Opening show delivered; principal welcome filmed", owner: "Team" },
      { id: "d-attendance", label: "Attendance captured for every session", owner: "Trainer" },
      { id: "d-backup", label: "Footage backed up at lunch (two copies)", owner: "Media" },
      { id: "d-ceremony", label: "Showcase & certificate ceremony done", owner: "Team" },
      { id: "d-interview", label: "Principal testimonial interview recorded", owner: "Media" },
      { id: "d-feedback", label: "Feedback forms collected", owner: "Trainer" },
      { id: "d-checkout", label: "Inventory checked out — kits counted back, damages logged", owner: "Ops" },
    ],
  },
  {
    id: "post",
    code: "Post",
    label: "After the workshop",
    offset: 10,
    items: [
      { id: "p-media", label: "Media Pack delivered", detail: "Reels, photos & posting kit within 5 days; film & testimonial clip within 10.", owner: "Media" },
      { id: "p-invoice", label: "Final invoice sent", owner: "Finance" },
      { id: "p-balance", label: "Balance payment received", detail: `Due within ${joveDayRules.balanceDueDays} days of the workshop.`, owner: "Finance" },
      { id: "p-feedback", label: "Feedback logged in HQ", owner: "Ops" },
      { id: "p-testimonial", label: "Testimonial & written consent to publish requested", owner: "Sales" },
      { id: "p-report", label: "Post-workshop report sent to the management", owner: "Ops" },
      { id: "p-expenses", label: "Trip & workshop expenses logged", owner: "Finance" },
      { id: "p-followup", label: "Follow-up booked for JOVE Quarter / Year", owner: "Sales" },
    ],
  },
];

export const PRE_EVENT: PhaseId[] = ["t14", "t7", "t3", "t1"];
export const CHECKLIST_TOTAL = CHECKLIST.reduce((s, p) => s + p.items.length, 0);

export function checklistOf(r: Record<string, unknown>): Record<string, boolean> {
  const c = r.checklist;
  return c && typeof c === "object" && !Array.isArray(c) ? (c as Record<string, boolean>) : {};
}

export function phaseProgress(checks: Record<string, boolean>, phase: ChecklistPhase) {
  const done = phase.items.filter((i) => checks[i.id]).length;
  return { done, total: phase.items.length, pct: phase.items.length ? done / phase.items.length : 0 };
}

function progressOf(checks: Record<string, boolean>, phases: ChecklistPhase[]) {
  const total = phases.reduce((s, p) => s + p.items.length, 0);
  const done = phases.reduce((s, p) => s + phaseProgress(checks, p).done, 0);
  return { done, total, pct: total ? done / total : 0 };
}

/** Readiness = share of the pre-event phases (T-14 → T-1) that is done. */
export function readiness(r: Record<string, unknown>) {
  return progressOf(
    checklistOf(r),
    CHECKLIST.filter((p) => PRE_EVENT.includes(p.id)),
  );
}

export function overallProgress(r: Record<string, unknown>) {
  return progressOf(checklistOf(r), CHECKLIST);
}

export function phaseDue(r: Record<string, unknown>, phase: ChecklistPhase) {
  return isIso(r.date) ? addDays(String(r.date), phase.offset) : "";
}

/** First unchecked item, in SOP order. */
export function nextPending(r: Record<string, unknown>) {
  const checks = checklistOf(r);
  for (const phase of CHECKLIST) for (const item of phase.items) if (!checks[item.id]) return { phase, item };
  return null;
}

/** Phases whose due date has passed but are still incomplete. */
export function overduePhases(r: Record<string, unknown>, today: string) {
  if (isCancelled(r)) return [];
  const checks = checklistOf(r);
  return CHECKLIST.filter((p) => {
    const due = phaseDue(r, p);
    return due && due < today && phaseProgress(checks, p).pct < 1;
  });
}

/* ─────────────────────────── run sheet ─────────────────────────── */

export interface ScheduleRow {
  id: string;
  time: string;
  end: string;
  hall: string;
  title: string;
  detail: string;
  who: string;
}

export const HALLS = ["Both", "Assembly", "Hall A", "Hall B", "Office"] as const;

function bandForWho(who: string) {
  return gradeBands.find((b) => b.grades === who);
}

/** The default JOVE Day schedule, trimmed to the bands this school booked. */
export function defaultSchedule(r: Record<string, unknown>): ScheduleRow[] {
  const booked = bookedBands(r);
  const anyBooked = booked.length > 0;
  const overflowBand = booked
    .filter((b) => bandStudents(r, b.id) > b.maxPerSession)
    .sort((a, b) => bandStudents(r, b.id) - b.maxPerSession - (bandStudents(r, a.id) - a.maxPerSession))[0];
  return joveDaySchedule
    .filter((s) => {
      const band = bandForWho(s.who);
      if (band) return !anyBooked || booked.some((b) => b.id === band.id);
      if (s.title === "Overflow batch") return !anyBooked || !!overflowBand;
      return true;
    })
    .map((s, i) => {
      const row: ScheduleRow = { id: `d${i}`, time: s.time, end: s.end, hall: s.hall, title: s.title, detail: s.detail, who: s.who };
      if (s.title === "Overflow batch" && overflowBand) {
        const extra = bandStudents(r, overflowBand.id) - overflowBand.maxPerSession;
        row.detail = `Second batch of ${overflowBand.name} (${overflowBand.grades}) — ${extra} students above the ${overflowBand.maxPerSession}-per-session limit.`;
        row.who = overflowBand.grades;
      }
      return row;
    });
}

export function isScheduleRow(v: unknown): v is ScheduleRow {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.time === "string" && typeof o.title === "string";
}

/** The saved schedule on the record, or the default for the booked bands. */
export function scheduleOf(r: Record<string, unknown>): { rows: ScheduleRow[]; custom: boolean } {
  const saved = Array.isArray(r.schedule) ? (r.schedule as unknown[]).filter(isScheduleRow) : [];
  if (saved.length)
    return {
      custom: true,
      rows: saved.map((s, i) => ({ id: str(s.id) || `s${i}`, time: str(s.time), end: str(s.end), hall: str(s.hall) || "Both", title: str(s.title), detail: str(s.detail), who: str(s.who) })),
    };
  return { custom: false, rows: defaultSchedule(r) };
}

export function sortSchedule(rows: ScheduleRow[]) {
  return [...rows].sort((a, b) => minutesOf(a.time) - minutesOf(b.time) || HALLS.indexOf(a.hall as (typeof HALLS)[number]) - HALLS.indexOf(b.hall as (typeof HALLS)[number]));
}

/* ─────────────────────────── kits & materials ─────────────────────────── */

const perStudent = (id: string) => workshopCostModel.lines.find((l) => l.id === id && l.type === "perStudent")?.amount ?? 0;
export const CONSUMABLES_PER_STUDENT = perStudent("consumables");
export const WORKSHEET_COST = perStudent("worksheets");
export const CERTIFICATE_COST = perStudent("certificates");
export const SPARE_RATE = 0.1;

/** AA cells per station, read from the kit's bill of materials (null = USB / power-module kit). */
export function cellsPerStation(kit: Kit | undefined): number | null {
  if (!kit) return null;
  const cells = kit.bom.find((b) => /AA alkaline cells/i.test(b.item));
  if (cells) return cells.qty;
  const holder = kit.bom.map((b) => /(\d+)\s*×\s*AA/i.exec(b.item)).find(Boolean);
  return holder ? Number(holder[1]) : null;
}

export interface BandPlan {
  band: GradeBand;
  kit?: Kit;
  students: number;
  sessions: number;
  perSession: number;
  stations: number;
  spares: number;
  kitsToPack: number;
  cellsPerStation: number | null;
  batterySets: number;
  aaCells: number;
  worksheets: number;
  certificates: number;
  consumablesCost: number;
  worksheetCost: number;
  certificateCost: number;
  materialsCost: number;
}

export function bandPlan(r: Record<string, unknown>, band: GradeBand): BandPlan {
  const students = bandStudents(r, band.id);
  const sessions = students ? Math.ceil(students / band.maxPerSession) : 0;
  const perSession = sessions ? Math.ceil(students / sessions) : 0;
  const stations = perSession ? Math.ceil(perSession / band.studentsPerStation) : 0;
  const spares = stations ? Math.ceil(stations * SPARE_RATE) : 0;
  const kit = kitFor(band);
  const cps = cellsPerStation(kit);
  const batterySets = stations + spares;
  const consumablesCost = students * CONSUMABLES_PER_STUDENT;
  const worksheetCost = students * WORKSHEET_COST;
  const certificateCost = students * CERTIFICATE_COST;
  return {
    band,
    kit,
    students,
    sessions,
    perSession,
    stations,
    spares,
    kitsToPack: stations + spares,
    cellsPerStation: cps,
    batterySets,
    aaCells: cps ? batterySets * cps : 0,
    worksheets: students,
    certificates: students,
    consumablesCost,
    worksheetCost,
    certificateCost,
    materialsCost: consumablesCost + worksheetCost + certificateCost,
  };
}

export function kitPlan(r: Record<string, unknown>) {
  const rows = bookedBands(r).map((b) => bandPlan(r, b));
  const t = (pick: (p: BandPlan) => number) => rows.reduce((s, p) => s + pick(p), 0);
  return {
    rows,
    totals: {
      students: t((p) => p.students),
      sessions: t((p) => p.sessions),
      stations: t((p) => p.stations),
      spares: t((p) => p.spares),
      kitsToPack: t((p) => p.kitsToPack),
      batterySets: t((p) => p.batterySets),
      aaCells: t((p) => p.aaCells),
      worksheets: t((p) => p.worksheets),
      certificates: t((p) => p.certificates),
      consumablesCost: t((p) => p.consumablesCost),
      worksheetCost: t((p) => p.worksheetCost),
      certificateCost: t((p) => p.certificateCost),
      materialsCost: t((p) => p.materialsCost),
    },
  };
}

export interface PackGroup {
  group: string;
  items: { label: string; qty?: string }[];
}

const showpieces = launchCapex.find((c) => c.id === "demo")?.label.replace(/^Showpieces:\s*/i, "") ?? "6-axis arm, robot dog, AI camera, arena mats";

/** Packing list for the van, derived from the kit plan. */
export function packingList(r: Record<string, unknown>): PackGroup[] {
  const plan = kitPlan(r);
  const t = plan.totals;
  const seniors = plan.rows.some((p) => p.band.id === "g6-8" || p.band.id === "g9-10");
  const drone = str(r.droneAllowed) !== "Not allowed";
  const groups: PackGroup[] = [
    {
      group: "Kits & stations",
      items: plan.rows.length
        ? plan.rows.map((p) => ({ label: `${p.kit?.name ?? "Kit"} — ${p.band.name} stations`, qty: `${p.stations} + ${p.spares} spare` }))
        : [{ label: "Station kits per band (add student counts to size)", qty: "—" }],
    },
    {
      group: "Power",
      items: [
        ...(t.aaCells ? [{ label: "AA cells (fresh, sealed)", qty: `${t.aaCells}` }] : []),
        ...plan.rows.filter((p) => p.cellsPerStation === null).map((p) => ({ label: `${p.band.name}: 5V power modules + USB cables`, qty: `${p.batterySets}` })),
        { label: "Extension boards (5 m, surge-protected)", qty: "4" },
        { label: "Power banks for media & laptops", qty: "4" },
      ],
    },
    {
      group: "Print & consumables",
      items: [
        { label: "Consumables packs (LEDs, cardboard, tape, wires)", qty: t.students ? `${t.students} students` : "—" },
        { label: "Worksheets", qty: t.worksheets ? String(t.worksheets) : "—" },
        { label: "Certificates (+ 5 blanks)", qty: t.certificates ? String(t.certificates + 5) : "—" },
        { label: "Attendance sheets (per band)", qty: plan.rows.length ? String(plan.rows.length) : "—" },
        { label: "Feedback forms — students, teachers, principal", qty: "1 set" },
        { label: "Consent opt-out list (from the school)", qty: "1" },
      ],
    },
    {
      group: "Show, AV & branding",
      items: [
        { label: `Showpieces: ${showpieces}` },
        { label: "Portable projector + HDMI/USB-C adapters" },
        { label: "Speaker + wireless mic" },
        { label: "Roll-up standee & backdrop banner" },
        { label: "Team T-shirts & ID cards" },
        ...(seniors ? [{ label: "Laptops for AI & Arduino sessions (charged, offline-tested)" }] : []),
      ],
    },
    {
      group: "Media — FrameMind AI Studio",
      items: [
        { label: "Cinema cameras, lenses & gimbal" },
        { label: "Wireless lavalier mics (principal interview)" },
        ...(drone ? [{ label: "Drone + charged batteries + controller (only if permitted)" }] : []),
        { label: "Formatted memory cards + backup SSD" },
        { label: "Chargers & spare camera batteries" },
      ],
    },
    {
      group: "Tools & safety",
      items: [
        { label: "Tool box: screwdrivers, multimeter, glue gun, spare wires" },
        { label: "First-aid kit" },
        { label: "Zip bags & labelled crates for kit check-out" },
      ],
    },
  ];
  return groups;
}

/* ─────────────────────────── media pack ─────────────────────────── */

export interface PackItem {
  key: string;
  deliverable: string;
  title: string;
  days: number;
  notes: string;
  needsDrone?: boolean;
}

const mp = (i: number) => mediaPack.items[i]?.detail ?? "";

export const MEDIA_PACK_ITEMS: PackItem[] = [
  { key: "reel-1", deliverable: "Reel", title: "Reel 1", days: 5, notes: mp(0) },
  { key: "reel-2", deliverable: "Reel", title: "Reel 2", days: 5, notes: mp(0) },
  { key: "reel-3", deliverable: "Reel", title: "Reel 3", days: 5, notes: mp(0) },
  { key: "reel-4", deliverable: "Reel", title: "Reel 4", days: 5, notes: mp(0) },
  { key: "film", deliverable: "Full-day film", title: "Full-day highlight film", days: 10, notes: mp(1) },
  { key: "drone", deliverable: "Drone shots", title: "Drone aerial shots", days: 10, notes: mp(2), needsDrone: true },
  { key: "photos", deliverable: "Photos", title: "Edited photos (30+)", days: 5, notes: mp(3) },
  { key: "testimonial", deliverable: "Testimonial clip", title: "Principal testimonial clip", days: 10, notes: mp(4) },
  { key: "posting-kit", deliverable: "Posting kit", title: "Captions & posting kit", days: 5, notes: mp(5) },
];

/* ─────────────────────────── drafts ─────────────────────────── */

export function workshopDefaults(): Record<string, unknown> {
  const def = getCollection("workshops");
  return Object.fromEntries((def?.fields ?? []).filter((f) => f.default !== undefined).map((f) => [f.key, f.default]));
}

export function titleFor(pkg: string, schoolName: string) {
  const name = PACKAGE_OPTIONS.find((o) => o.value === pkg)?.label ?? "JOVE Day";
  return schoolName ? `${pkg === "custom" ? "JOVE Workshop" : name} — ${schoolName}` : "";
}

/**
 * Fill a workshop draft from a school record. Only empty fields are filled,
 * except the title when it still matches the auto-title of the previous school.
 */
export function fillFromSchool(draft: Record<string, unknown>, school: Rec | undefined, previous?: Rec) {
  if (!school) return draft;
  const next: Record<string, unknown> = { ...draft, schoolId: school.id };
  const pkg = str(next.package) || "jove-day";
  const prevAuto = previous ? titleFor(pkg, str(previous.name)) : "";
  if (!str(next.title) || (prevAuto && next.title === prevAuto)) next.title = titleFor(pkg, str(school.name));
  for (const id of Object.keys(BAND_FIELD) as GradeBandId[]) {
    const k = BAND_FIELD[id];
    if (!num(next[k]) && num(school[k])) next[k] = num(school[k]);
  }
  if (!num(next.distanceKm) && num(school.distanceKm)) next.distanceKm = num(school.distanceKm);
  if (!str(next.schoolContact)) {
    const name = str(school.contactName) || str(school.principalName);
    const role = str(school.contactName) ? str(school.contactRole) : str(school.principalName) ? "Principal" : "";
    if (name) next.schoolContact = role ? `${name} (${role})` : name;
  }
  if (!str(next.schoolContactPhone) && str(school.phone)) next.schoolContactPhone = str(school.phone);
  if (!num(next.agreedAmount)) {
    const v = workshopValue(next).value;
    if (v) next.agreedAmount = v;
  }
  return next;
}

/* ─────────────────────────── travel ─────────────────────────── */

export const TEAM_SIZE = Object.values(joveDayRules.teamSize).reduce((s, n) => s + n, 0);

const fixedLine = (id: string) => workshopCostModel.lines.find((l) => l.id === id && l.type === "fixed")?.amount ?? 0;
/** JOVE Day plan for travel-related costs (vehicle & fuel + food + stay), from the cost model. */
export const PLAN_TRAVEL = fixedLine("travel");
export const PLAN_FOOD = fixedLine("food");
export const PLAN_STAY = fixedLine("stay");
export const FOOD_PER_PERSON_DAY = TEAM_SIZE ? Math.round(PLAN_FOOD / TEAM_SIZE) : 0;

export interface VehiclePreset {
  value: string;
  label: string;
  /** ₹ per km — null means "use Settings → fuel cost per km" */
  ratePerKm: number | null;
  /** cost goes to the "fuel" line (own vehicle) or "vehicle rent" (hired) */
  line: "fuelCost" | "vehicleRent";
  note: string;
}

/** Typical 2026 South-India rates. Editable in the estimator — always use the actual quote. */
export const VEHICLE_PRESETS: VehiclePreset[] = [
  { value: "Own car", label: "Own car (fuel)", ratePerKm: null, line: "fuelCost", note: "Fuel only, from Settings → fuel cost per km" },
  { value: "Rented car + driver", label: "Rented car + driver", ratePerKm: 14, line: "vehicleRent", note: "Sedan / SUV hire incl. fuel, typical ₹12–16 per km" },
  { value: "Rented tempo traveller", label: "Tempo traveller", ratePerKm: 24, line: "vehicleRent", note: "12–14 seater incl. fuel, typical ₹20–28 per km" },
  { value: "Cab", label: "Cab", ratePerKm: 16, line: "vehicleRent", note: "App / outstation cab, typical ₹14–18 per km" },
  { value: "Two-wheeler", label: "Two-wheeler", ratePerKm: 3, line: "fuelCost", note: "Fuel only — advance visits, not kit runs" },
];

export function tripCost(t: Record<string, unknown>) {
  const total = tripTotal(t);
  const km = num(t.distanceKm);
  return { total, km, perKm: km ? total / km : 0 };
}
