/**
 * Business Planner model: pure functions, no React — and no private number typed in this file.
 * Every default comes from the price book the founders keep in HQ → Money → Prices & Costs (passed in as `book`):
 * the cost lines of a JOVE Day, monthly fixed costs, launch budget, targets and what each kit's parts cost.
 * The scenario the founders edit lives in their browser (see store.ts) and never overwrites the book.
 */
import { addOns, gradeBands, joveDayRules, kits, type GradeBandId } from "@/lib/content/business";
import { bomCost, kitFigures } from "@/lib/pricebook/math";
import type { PriceBook } from "@/lib/pricebook/types";

/* ───────────────────────────── types ───────────────────────────── */

export type CostType = "fixed" | "perStudent" | "percentRevenue";
export interface CostLine {
  id: string;
  label: string;
  type: CostType;
  amount: number;
}
export interface FixedLine {
  id: string;
  label: string;
  amount: number;
}
export interface CapexLine {
  id: string;
  label: string;
  amount: number;
  included: boolean;
}
export interface AddonRow {
  id: "kits" | "smm" | "films" | "clubs" | "teacher";
  label: string;
  unit: string;
  qty: number;
  /** ex-GST revenue per unit */
  unitRevenue: number;
  /** share of revenue left after direct costs (the founders' own assumption, typed in the planner) */
  marginPct: number;
}

export interface Scenario {
  v: 1;
  day: {
    students: Record<GradeBandId, number>;
    prices: Record<GradeBandId, number>;
    minimumBilling: number;
    lines: CostLine[];
  };
  month: {
    workshops: number;
    revenueMode: "day" | "custom";
    customRevenue: number;
    target: number;
    fixed: FixedLine[];
    addons: AddonRow[];
  };
  year: {
    workshops: number[];
    camps: number[];
    campStudents: number;
    campPrice: number;
    campMarginPct: number;
    addonsFromMonth: number;
  };
  capex: CapexLine[];
  kitCostAdjustPct: number;
  estimator: Record<string, number>;
  /** share of revenue kept per estimator row, as typed by the founders (none is assumed in the code) */
  estimatorMargins: Record<string, number>;
  /**
   * The price book's numbers this scenario started from. A part that still equals them was never changed here,
   * so it keeps following the book; a part that differs is the founders' own what-if and is kept as typed.
   */
  base?: BookParts;
}

/* ───────────────────────────── constants ───────────────────────────── */

export const BAND_IDS = gradeBands.map((b) => b.id) as GradeBandId[];

/** Launch month of the 12-month plan (the company launches Oct 2026). */
const START = { year: 2026, month: 9 };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const PROJECTION_MONTHS: string[] = Array.from({ length: 12 }, (_, i) => {
  const idx = START.month + i;
  return `${MON[idx % 12]} ${START.year + Math.floor(idx / 12)}`;
});

/**
 * Shape of the first year, as a share of the workshops-per-month target in the price book:
 * a three-month climb, the target from Jan to Mar, half of it in Apr–May (exams and holidays, camps instead),
 * then the target and a little above it. With a target of 4 this is 1, 2, 3, 4, 4, 4, 2, 2, 4, 5, 4, 5.
 */
const RAMP_SHAPE = [0.25, 0.5, 0.75, 1, 1, 1, 0.5, 0.5, 1, 1.25, 1, 1.25];
const DEFAULT_CAMPS = [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0];

/** How a JOVE Day's students usually split across the grade bands (a head-count assumption, not money). */
const STUDENT_MIX: Record<GradeBandId, number> = { "g1-2": 0.2, "g3-5": 0.28, "g6-8": 0.32, "g9-10": 0.2 };

/** `total` students split across the bands by the usual mix, in whole students that add up to `total`. */
function splitStudents(total: number): Record<GradeBandId, number> {
  const whole = Math.max(0, Math.round(total));
  const exact = BAND_IDS.map((id) => ({ id, value: whole * (STUDENT_MIX[id] ?? 1 / BAND_IDS.length) }));
  const out = Object.fromEntries(exact.map((e) => [e.id, Math.floor(e.value + 1e-9)])) as Record<GradeBandId, number>;
  let left = whole - BAND_IDS.reduce((s, id) => s + out[id], 0);
  for (const e of [...exact].sort((a, b) => (b.value % 1) - (a.value % 1))) {
    if (left <= 0) break;
    out[e.id] += 1;
    left -= 1;
  }
  return out;
}

/**
 * What a camp lists at, read from the founders' revenue-stream notes in the price book: the camps line names a
 * price or a "from – to" range in rupees, and this is the mid-point. 0 when the notes name no camp price.
 */
export function campListPrice(book: PriceBook) {
  const text = book.planner.streams.find((s) => s.id === "camps")?.model ?? "";
  const amounts = [...text.matchAll(/₹\s?([\d,]+)/g)]
    .map((m) => Number(m[1].replace(/,/g, "")))
    .filter((v) => Number.isFinite(v) && v > 0)
    .slice(0, 2);
  return amounts.length ? Math.round(amounts.reduce((s, v) => s + v, 0) / amounts.length) : 0;
}

/** The camp line of the founders' revenue-stream notes, shown as a hint next to the camp price. */
export function campNote(book: PriceBook) {
  return book.planner.streams.find((s) => s.id === "camps")?.model ?? "";
}

export type EstimatorGroup = "smm" | "films" | "teacher" | "clubs" | "camps" | "lab";
export interface EstimatorRow {
  id: string;
  label: string;
  unit: string;
  /** what the customer pays, ex-GST */
  price: number;
  group: EstimatorGroup;
}

/** The add-ons the estimator can count, with today's prices from the price book. A row without a price is left out. */
export function estimatorRows(book: PriceBook): EstimatorRow[] {
  const price = (id: string) => n(book.addOns?.[id] ?? addOns.find((a) => a.id === id)?.priceValue);
  const rows: EstimatorRow[] = [
    { id: "smm-starter", label: "Social media management: Starter", unit: "retainers / month", price: price("smm-starter"), group: "smm" },
    { id: "smm-growth", label: "Social media management: Growth", unit: "retainers / month", price: price("smm-growth"), group: "smm" },
    { id: "smm-premium", label: "Social media management: Premium", unit: "retainers / month", price: price("smm-premium"), group: "smm" },
    { id: "film-admissions", label: "Admissions / commercial film", unit: "films / month", price: price("film-admissions"), group: "films" },
    { id: "film-premium", label: "Premium brand film", unit: "films / month", price: price("film-premium"), group: "films" },
    { id: "teacher-training", label: "Teacher training & certification", unit: "teachers / month", price: price("teacher-training"), group: "teacher" },
    { id: "club", label: "After-school JOVE Club", unit: "student-months", price: n(book.club?.pricePerMonth), group: "clubs" },
    { id: "camp", label: "Summer / winter camp", unit: "students / month", price: campListPrice(book), group: "camps" },
    { id: "lab-setup", label: "Robotics & AI lab setup (turnkey)", unit: "labs / month", price: price("lab-setup"), group: "lab" },
  ];
  return rows.filter((r) => r.price > 0);
}

/* ───────────────────────────── defaults ───────────────────────────── */

/**
 * The average kit sold in bulk to a school: what it brings in after GST, and the share of that left after the parts.
 * Kits whose parts have no cost yet are left out of the margin (they would count as pure profit).
 */
export function defaultKitAverages(book: PriceBook) {
  const gst = 1 + n(book.kitGstPercent) / 100;
  const m = kits.flatMap((k) => {
    const kb = book.kits?.[k.id];
    if (!kb) return [];
    const net = kitFigures(kb, book.kitGstPercent, book.schoolDiscountPercent).schoolPrice / gst;
    const cost = bomCost(kb.bom);
    return [{ net, marginPct: cost > 0 && net > 0 ? ((net - cost) / net) * 100 : null }];
  });
  const costed = m.filter((x) => x.marginPct !== null);
  return {
    unitRevenue: m.length ? Math.round(m.reduce((s, x) => s + x.net, 0) / m.length) : 0,
    marginPct: costed.length ? Math.round(costed.reduce((s, x) => s + (x.marginPct ?? 0), 0) / costed.length) : 0,
  };
}

/** The planner's starting scenario: every amount is the price book's. */
export function defaultScenario(book: PriceBook): Scenario {
  const plan = book.planner;
  const addOnPrice = (id: string) => n(book.addOns?.[id] ?? addOns.find((a) => a.id === id)?.priceValue);
  const prices = Object.fromEntries(gradeBands.map((b) => [b.id, n(book.bands?.[b.id]?.day ?? b.pricePerStudent)])) as Record<GradeBandId, number>;
  const kitAvg = defaultKitAverages(book);
  const perMonth = n(plan.targets.workshopsPerMonth);
  const s: Scenario = {
    v: 1,
    day: {
      students: splitStudents(n(plan.students)),
      prices,
      minimumBilling: n(book.rules?.minimumBilling ?? joveDayRules.minimumBilling),
      lines: plan.lines.map((l) => ({ id: l.id, label: l.label, type: l.type, amount: l.amount })),
    },
    month: {
      workshops: perMonth,
      revenueMode: "day",
      customRevenue: n(plan.targets.revenuePerWorkshop),
      target: n(plan.targets.monthlyRevenue),
      fixed: plan.fixedCosts.map((f) => ({ id: f.id, label: f.label, amount: f.amount })),
      // the margin of each service is the founders' assumption, kept in the price book (planner.margins)
      addons: [
        { id: "kits", label: "Take-home kits sold (school bulk + online)", unit: "kits", qty: 0, unitRevenue: kitAvg.unitRevenue, marginPct: kitAvg.marginPct },
        { id: "smm", label: "Social media management retainers", unit: "retainers", qty: 0, unitRevenue: addOnPrice("smm-starter"), marginPct: n(plan.margins?.["smm-starter"]) },
        { id: "films", label: "Admissions / brand films", unit: "films", qty: 0, unitRevenue: addOnPrice("film-admissions"), marginPct: n(plan.margins?.["film-admissions"]) },
        { id: "clubs", label: "After-school club students (monthly)", unit: "students", qty: 0, unitRevenue: n(book.club?.pricePerMonth), marginPct: n(plan.margins?.club) },
        { id: "teacher", label: "Teacher training seats", unit: "teachers", qty: 0, unitRevenue: addOnPrice("teacher-training"), marginPct: n(plan.margins?.["teacher-training"]) },
      ],
    },
    year: {
      workshops: RAMP_SHAPE.map((share) => Math.max(0, Math.round(share * perMonth))),
      camps: [...DEFAULT_CAMPS],
      campStudents: 30,
      campPrice: campListPrice(book),
      campMarginPct: n(plan.margins?.camp),
      addonsFromMonth: 4,
    },
    capex: plan.capex.map((l) => ({ id: l.id, label: l.label, amount: l.amount, included: !isOptionalLine(l) })),
    kitCostAdjustPct: 0,
    estimator: {},
    // each estimator row starts at the book's margin for it; a row without one follows its stream in the monthly plan
    estimatorMargins: Object.fromEntries(Object.entries(plan.margins ?? {}).filter(([, v]) => Number.isFinite(v) && v > 0)),
  };
  s.base = bookParts(s);
  return s;
}

export function isOptionalLine(l: { label: string }) {
  return /optional/i.test(l.label);
}
export function isReserveLine(l: { id: string }) {
  return l.id === "buffer";
}

/* ───────────────────────────── what follows the price book ───────────────────────────── */

const copy = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
/** JSON with object keys in a fixed order, so two values with the same content always compare equal */
const stable = (v: unknown) =>
  JSON.stringify(v, (_key, val: unknown) => (val && typeof val === "object" && !Array.isArray(val) ? Object.fromEntries(Object.entries(val).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : val));
const same = (a: unknown, b: unknown) => stable(a) === stable(b);

/** The parts of a scenario that start as the price book's numbers (a copy: editing the scenario never changes it). */
function bookParts(s: Scenario) {
  return copy({
    students: s.day.students,
    prices: s.day.prices,
    minimumBilling: s.day.minimumBilling,
    lines: s.day.lines.map((l) => ({ id: l.id, label: l.label, type: l.type, amount: l.amount })),
    workshops: s.month.workshops,
    customRevenue: s.month.customRevenue,
    target: s.month.target,
    fixed: s.month.fixed.map((f) => ({ id: f.id, label: f.label, amount: f.amount })),
    addons: s.month.addons.map((a) => ({ id: a.id, unitRevenue: a.unitRevenue, marginPct: a.marginPct })),
    ramp: s.year.workshops,
    campPrice: s.year.campPrice,
    capex: s.capex.map((c) => ({ id: c.id, label: c.label, amount: c.amount })),
  });
}
export type BookParts = ReturnType<typeof bookParts>;

/**
 * In plain words, the parts of this scenario that no longer follow the price book because they were changed
 * in this browser. Empty when the whole scenario still runs on the book's numbers.
 */
export function ownNumbers(s: Scenario): string[] {
  const b = s.base;
  if (!b) return [];
  const now = bookParts(s);
  const out: string[] = [];
  if (!same(now.prices, b.prices) || now.minimumBilling !== b.minimumBilling) out.push("prices per student");
  if (!same(now.lines, b.lines)) out.push("the cost lines of a JOVE Day");
  if (!same(now.fixed, b.fixed)) out.push("monthly fixed costs");
  if (now.target !== b.target || now.customRevenue !== b.customRevenue) out.push("the monthly target");
  if (!same(now.capex, b.capex)) out.push("the launch budget");
  return out;
}

/**
 * Merge a stored scenario onto the defaults so older/partial saves never crash the UI.
 * A saved part that is still the book's number it started from is replaced by today's book number,
 * so a cost changed in Prices & Costs reaches the planner; a part the founders changed here is kept as typed.
 * A scenario saved before this was tracked has no starting point: all of it is kept as typed.
 */
export function reviveScenario(raw: unknown, book: PriceBook): Scenario {
  const d = defaultScenario(book);
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Partial<Scenario>;
  if (r.v !== 1) return d;
  const b: Partial<BookParts> | undefined = r.base && typeof r.base === "object" ? r.base : undefined;
  /** the saved value — unless it is missing, or still the book's number it started from: then today's book number */
  const keep = <T,>(saved: T | undefined | null, started: unknown, today: T): T => (saved === undefined || saved === null ? today : b && same(saved, started) ? today : saved);
  const number = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  const numArr = (a: unknown) => (Array.isArray(a) && a.length === 12 && a.every((x) => typeof x === "number") ? (a as number[]) : undefined);
  const record = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, number>) : {});

  const scenario: Scenario = {
    v: 1,
    day: {
      ...d.day,
      ...(r.day ?? {}),
      students: keep(r.day?.students ? { ...d.day.students, ...r.day.students } : undefined, b?.students, d.day.students),
      prices: keep(r.day?.prices ? { ...d.day.prices, ...r.day.prices } : undefined, b?.prices, d.day.prices),
      minimumBilling: keep(number(r.day?.minimumBilling), b?.minimumBilling, d.day.minimumBilling),
      lines: keep(Array.isArray(r.day?.lines) ? r.day.lines : undefined, b?.lines, d.day.lines),
    },
    month: {
      ...d.month,
      ...(r.month ?? {}),
      workshops: keep(number(r.month?.workshops), b?.workshops, d.month.workshops),
      customRevenue: keep(number(r.month?.customRevenue), b?.customRevenue, d.month.customRevenue),
      target: keep(number(r.month?.target), b?.target, d.month.target),
      fixed: keep(Array.isArray(r.month?.fixed) ? r.month.fixed : undefined, b?.fixed, d.month.fixed),
      addons: d.month.addons.map((a) => {
        const saved = Array.isArray(r.month?.addons) ? r.month.addons.find((x) => x?.id === a.id) : undefined;
        const started = Array.isArray(b?.addons) ? b.addons.find((x) => x?.id === a.id) : undefined;
        return { ...a, ...(saved ?? {}), unitRevenue: keep(number(saved?.unitRevenue), started?.unitRevenue, a.unitRevenue), marginPct: keep(number(saved?.marginPct), started?.marginPct, a.marginPct) };
      }),
    },
    year: {
      ...d.year,
      ...(r.year ?? {}),
      workshops: keep(numArr(r.year?.workshops), b?.ramp, d.year.workshops),
      camps: numArr(r.year?.camps) ?? d.year.camps,
      campPrice: keep(number(r.year?.campPrice), b?.campPrice, d.year.campPrice),
    },
    capex: d.capex.map((c) => {
      const saved = Array.isArray(r.capex) ? r.capex.find((x) => x?.id === c.id) : undefined;
      if (!saved) return c;
      const started = Array.isArray(b?.capex) ? b.capex.find((x) => x?.id === c.id) : undefined;
      return {
        id: c.id,
        label: keep(typeof saved.label === "string" ? saved.label : undefined, started?.label, c.label),
        amount: keep(number(saved.amount), started?.amount, c.amount),
        included: typeof saved.included === "boolean" ? saved.included : c.included,
      };
    }),
    kitCostAdjustPct: typeof r.kitCostAdjustPct === "number" ? r.kitCostAdjustPct : 0,
    estimator: record(r.estimator),
    estimatorMargins: record(r.estimatorMargins),
  };
  // from here on the scenario is measured against today's book
  scenario.base = d.base;
  return scenario;
}

/* ───────────────────────────── a) JOVE Day ───────────────────────────── */

const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function lineTotal(l: CostLine, students: number, revenue: number) {
  return Math.round(l.type === "fixed" ? n(l.amount) : l.type === "perStudent" ? n(l.amount) * students : (n(l.amount) / 100) * revenue);
}

export function variableCost(lines: CostLine[], students: number, revenue: number) {
  return lines.reduce((s, l) => s + lineTotal(l, students, revenue), 0);
}

/** Economics of one day for a given head-count and blended price (minimum billing applies). */
export function evalDay(day: Scenario["day"], students: number, avgPrice: number) {
  const gross = students * avgPrice;
  const revenue = students > 0 ? Math.max(gross, n(day.minimumBilling)) : 0;
  const costs = day.lines.map((l) => ({ ...l, total: lineTotal(l, students, revenue) }));
  const variable = costs.reduce((s, c) => s + c.total, 0);
  const contribution = revenue - variable;
  return { students, gross, revenue, costs, variable, contribution, marginPct: revenue > 0 ? (contribution / revenue) * 100 : 0 };
}

export function dayEconomics(day: Scenario["day"]) {
  const students = BAND_IDS.reduce((s, id) => s + n(day.students[id]), 0);
  const gross = BAND_IDS.reduce((s, id) => s + n(day.students[id]) * n(day.prices[id]), 0);
  const avgPrice = students > 0 ? gross / students : joveDayRules.targetAvgPricePerStudent;
  const base = evalDay(day, students, avgPrice);
  const minimumApplied = students > 0 && gross < n(day.minimumBilling);

  // Break-even head-count if every rupee has to come from per-student pricing (ignores the minimum-billing floor)
  const fixed = day.lines.filter((l) => l.type === "fixed").reduce((s, l) => s + n(l.amount), 0);
  const perStudent = day.lines.filter((l) => l.type === "perStudent").reduce((s, l) => s + n(l.amount), 0);
  const pct = day.lines.filter((l) => l.type === "percentRevenue").reduce((s, l) => s + n(l.amount), 0) / 100;
  const unit = avgPrice * (1 - pct) - perStudent;
  const breakEvenStudents = unit > 0 ? Math.ceil(fixed / unit) : null;
  const atMinimum = evalDay(day, joveDayRules.minimumStudents, avgPrice);

  return {
    ...base,
    avgPrice,
    minimumApplied,
    costPerStudent: students > 0 ? base.variable / students : 0,
    revenuePerStudent: students > 0 ? base.revenue / students : 0,
    breakEvenStudents,
    breakEvenRevenue: breakEvenStudents ? breakEvenStudents * avgPrice : null,
    atMinimum,
  };
}

/** Waterfall steps: revenue → each cost → contribution. */
export function waterfall(e: ReturnType<typeof dayEconomics>) {
  let running = e.revenue;
  const steps = e.costs.map((c) => {
    const from = running;
    running -= c.total;
    return { id: c.id, label: c.label, value: c.total, from, to: running };
  });
  return { steps, end: running };
}

/* ───────────────────────────── b) monthly plan ───────────────────────────── */

/** Revenue, variable cost and contribution of one average workshop under the current scenario. */
export function perWorkshop(s: Scenario) {
  const day = dayEconomics(s.day);
  const revenue = s.month.revenueMode === "custom" ? n(s.month.customRevenue) : day.revenue;
  const variable = variableCost(s.day.lines, day.students, revenue);
  return { day, revenue, variable, contribution: revenue - variable };
}

export function addonTotals(addons: AddonRow[]) {
  const revenue = addons.reduce((sum, a) => sum + n(a.qty) * n(a.unitRevenue), 0);
  const contribution = addons.reduce((sum, a) => sum + n(a.qty) * n(a.unitRevenue) * (n(a.marginPct) / 100), 0);
  return { revenue, contribution, direct: revenue - contribution };
}

export function monthlyPlan(s: Scenario) {
  const w = n(s.month.workshops);
  const pw = perWorkshop(s);
  const add = addonTotals(s.month.addons);
  const workshopRevenue = w * pw.revenue;
  const workshopVariable = w * pw.variable;
  const revenue = workshopRevenue + add.revenue;
  const variable = workshopVariable + add.direct;
  const contribution = revenue - variable;
  const fixed = s.month.fixed.reduce((sum, f) => sum + n(f.amount), 0);
  const ebitda = contribution - fixed;
  const target = n(s.month.target);
  const breakEvenWorkshops = pw.contribution > 0 ? Math.max(0, (fixed - add.contribution) / pw.contribution) : null;
  const workshopsForTarget = pw.revenue > 0 ? Math.max(0, (target - add.revenue) / pw.revenue) : null;
  return {
    day: pw.day,
    perWorkshopRevenue: pw.revenue,
    perWorkshopVariable: pw.variable,
    perWorkshopContribution: pw.contribution,
    workshops: w,
    workshopRevenue,
    workshopVariable,
    addonRevenue: add.revenue,
    addonContribution: add.contribution,
    addonDirect: add.direct,
    revenue,
    variable,
    contribution,
    fixed,
    ebitda,
    marginPct: revenue > 0 ? (ebitda / revenue) * 100 : 0,
    target,
    progress: target > 0 ? revenue / target : 0,
    gap: target - revenue,
    breakEvenWorkshops,
    workshopsForTarget,
    students: w * pw.day.students,
  };
}

/* ───────────────────────────── d) capex ───────────────────────────── */

export function capexSummary(lines: CapexLine[]) {
  const sum = (f: (l: CapexLine) => boolean) => lines.filter(f).reduce((s, l) => s + n(l.amount), 0);
  const full = sum(() => true);
  const lean = sum((l) => !isOptionalLine(l) && !isReserveLine(l));
  const optional = sum((l) => isOptionalLine(l));
  const reserve = sum((l) => isReserveLine(l));
  const selected = sum((l) => l.included);
  const selectedReserve = sum((l) => l.included && isReserveLine(l));
  return { full, lean, optional, reserve, selected, selectedReserve, spend: selected - selectedReserve };
}

/* ───────────────────────────── c) 12-month projection ───────────────────────────── */

export interface ProjectionRow {
  index: number;
  label: string;
  workshops: number;
  camps: number;
  revenue: number;
  variable: number;
  fixed: number;
  profit: number;
  cumulative: number;
  cash: number;
}

export function projection(s: Scenario) {
  const pw = perWorkshop(s);
  const add = addonTotals(s.month.addons);
  const fixed = s.month.fixed.reduce((sum, f) => sum + n(f.amount), 0);
  const capex = capexSummary(s.capex);
  const campRevenue = n(s.year.campStudents) * n(s.year.campPrice);
  const campDirect = campRevenue * (1 - n(s.year.campMarginPct) / 100);

  let cumulative = 0;
  const rows: ProjectionRow[] = PROJECTION_MONTHS.map((label, i) => {
    const w = n(s.year.workshops[i]);
    const c = n(s.year.camps[i]);
    const addOn = i + 1 >= n(s.year.addonsFromMonth);
    const revenue = w * pw.revenue + c * campRevenue + (addOn ? add.revenue : 0);
    const variable = w * pw.variable + c * campDirect + (addOn ? add.direct : 0);
    const profit = revenue - variable - fixed;
    cumulative += profit;
    return { index: i, label, workshops: w, camps: c, revenue, variable, fixed, profit, cumulative, cash: cumulative - capex.spend };
  });

  const paybackIndex = rows.findIndex((r) => r.cash >= 0);
  const last = rows.slice(-3);
  const runRate = last.reduce((sum, r) => sum + r.profit, 0) / last.length;
  const last12 = rows[rows.length - 1];
  const extraMonths = paybackIndex === -1 && runRate > 0 ? Math.ceil(-last12.cash / runRate) : null;
  const lowest = rows.reduce((min, r) => Math.min(min, r.cash), 0);

  return {
    rows,
    capex,
    paybackIndex,
    paybackLabel: paybackIndex >= 0 ? rows[paybackIndex].label : null,
    extraMonths,
    runRate,
    lowestCash: lowest,
    totals: {
      workshops: rows.reduce((sum, r) => sum + r.workshops, 0),
      camps: rows.reduce((sum, r) => sum + r.camps, 0),
      revenue: rows.reduce((sum, r) => sum + r.revenue, 0),
      variable: rows.reduce((sum, r) => sum + r.variable, 0),
      fixed: rows.reduce((sum, r) => sum + r.fixed, 0),
      profit: last12.cumulative,
    },
  };
}

/* ───────────────────────────── e) kits ───────────────────────────── */

/**
 * Each kit's cost (its parts in the price book, with the what-if change applied) against its MRP and school price.
 * `cost` and the margins are null while the kit's parts have no cost in the price book: show a dash, never ₹0.
 */
export function kitRows(adjPct: number, book: PriceBook) {
  const f = 1 + adjPct / 100;
  const gst = 1 + n(book.kitGstPercent) / 100;
  const row = (price: number, cost: number | null) => {
    const net = price / gst;
    return { price, net, margin: cost === null ? null : net - cost, marginPct: cost === null || net <= 0 ? null : ((net - cost) / net) * 100 };
  };
  return kits.map((k) => {
    const kb = book.kits?.[k.id];
    const fig = kb ? kitFigures(kb, book.kitGstPercent, book.schoolDiscountPercent) : { mrp: k.mrp, schoolPrice: k.schoolPrice };
    const parts = kb?.bom.length ?? 0;
    const listed = kb ? bomCost(kb.bom) : 0;
    const cost = listed > 0 ? Math.round(listed * f) : null;
    return { kit: k, parts, cost, mrp: row(fig.mrp, cost), school: row(fig.schoolPrice, cost) };
  });
}

/* ───────────────────────────── f) estimator ───────────────────────────── */

/**
 * The share of revenue kept on one estimator row: what the founders typed for it, else what they typed for the same
 * stream in the monthly plan (camps: in the 12-month projection), else nothing (0).
 */
function estimatorMargin(s: Scenario, row: EstimatorRow) {
  const typed = s.estimatorMargins?.[row.id];
  if (typeof typed === "number" && Number.isFinite(typed)) return typed;
  if (row.group === "camps") return n(s.year.campMarginPct);
  return n(s.month.addons.find((a) => a.id === row.group)?.marginPct);
}

export function estimatorTotals(s: Scenario, book: PriceBook) {
  const rows = estimatorRows(book).map((r) => {
    const q = n(s.estimator[r.id]);
    const marginPct = estimatorMargin(s, r);
    const monthly = q * r.price;
    return { ...r, qty: q, marginPct, monthly, contribution: monthly * (marginPct / 100), annual: monthly * 12 };
  });
  return {
    rows,
    monthly: rows.reduce((sum, r) => sum + r.monthly, 0),
    contribution: rows.reduce((sum, r) => sum + r.contribution, 0),
    annual: rows.reduce((sum, r) => sum + r.annual, 0),
  };
}

/** Turn the estimator's rows into the monthly plan's add-on rows (camps and lab setups are not part of the plan add-ons). */
export function estimatorToAddons(s: Scenario, book: PriceBook): AddonRow[] {
  const rows = estimatorTotals(s, book).rows;
  const group = (g: string) => {
    const r = rows.filter((x) => x.group === g);
    const q = r.reduce((sum, x) => sum + x.qty, 0);
    const rev = r.reduce((sum, x) => sum + x.monthly, 0);
    const contrib = r.reduce((sum, x) => sum + x.contribution, 0);
    return { q, unit: q > 0 ? Math.round(rev / q) : 0, margin: rev > 0 ? Math.round((contrib / rev) * 100) : 0 };
  };
  const map: Record<string, ReturnType<typeof group>> = { smm: group("smm"), films: group("films"), clubs: group("clubs"), teacher: group("teacher") };
  return s.month.addons.map((a) => {
    const g = map[a.id];
    return g && g.q > 0 ? { ...a, qty: g.q, unitRevenue: g.unit, marginPct: g.margin } : g ? { ...a, qty: 0 } : a;
  });
}

/* ───────────────────────────── g) CSV ───────────────────────────── */

export function scenarioCsv(s: Scenario, book: PriceBook): string {
  const rows: (string | number)[][] = [["Section", "Item", "Value", "Notes"]];
  const add = (section: string, item: string, value: string | number, note = "") => rows.push([section, item, typeof value === "number" ? Math.round(value * 100) / 100 : value, note]);

  const d = dayEconomics(s.day);
  for (const id of BAND_IDS) {
    const b = gradeBands.find((x) => x.id === id)!;
    add("JOVE Day", `${b.grades} students`, s.day.students[id]);
    add("JOVE Day", `${b.grades} price per student (INR)`, s.day.prices[id]);
  }
  add("JOVE Day", "Minimum billing (INR)", s.day.minimumBilling);
  add("JOVE Day", "Students", d.students);
  add("JOVE Day", "Revenue ex-GST (INR)", d.revenue, d.minimumApplied ? "minimum billing applied" : "");
  for (const c of d.costs) add("JOVE Day cost", c.label, c.total, c.type === "fixed" ? "fixed" : c.type === "perStudent" ? `${c.amount} per student` : `${c.amount}% of revenue`);
  add("JOVE Day", "Variable cost (INR)", d.variable);
  add("JOVE Day", "Contribution (INR)", d.contribution);
  add("JOVE Day", "Margin %", d.marginPct);
  add("JOVE Day", "Cost per student (INR)", d.costPerStudent);
  add("JOVE Day", "Break-even students (per-student pricing only)", d.breakEvenStudents ?? "n/a");

  const m = monthlyPlan(s);
  add("Monthly plan", "Workshops per month", m.workshops);
  add("Monthly plan", "Revenue per workshop (INR)", m.perWorkshopRevenue);
  for (const a of s.month.addons) add("Monthly add-ons", a.label, a.qty, `${a.unitRevenue} per ${a.unit}, ${a.marginPct}% margin`);
  for (const f of s.month.fixed) add("Monthly fixed cost", f.label, f.amount);
  add("Monthly plan", "Revenue (INR)", m.revenue);
  add("Monthly plan", "Contribution (INR)", m.contribution);
  add("Monthly plan", "Fixed costs (INR)", m.fixed);
  add("Monthly plan", "EBITDA (INR)", m.ebitda);
  add("Monthly plan", "Revenue target (INR)", m.target);
  add("Monthly plan", "Break-even workshops per month", m.breakEvenWorkshops ?? "n/a");

  const p = projection(s);
  for (const r of p.rows) add("12-month projection", r.label, r.cash, `workshops ${r.workshops}, camps ${r.camps}, revenue ${Math.round(r.revenue)}, profit ${Math.round(r.profit)}, cumulative ${Math.round(r.cumulative)}`);
  add("12-month projection", "Payback month", p.paybackLabel ?? (p.extraMonths ? `~${p.extraMonths} months after Sep 2027` : "not reached"));

  for (const c of s.capex) add("Launch capex", c.label, c.amount, c.included ? "included" : "excluded");
  const cx = capexSummary(s.capex);
  add("Launch capex", "Selected total (INR)", cx.selected);
  add("Launch capex", "Lean budget (INR)", cx.lean);
  add("Launch capex", "Full budget (INR)", cx.full);

  for (const r of kitRows(s.kitCostAdjustPct, book)) {
    if (r.cost === null || r.mrp.margin === null || r.school.margin === null) add("Kit economics", `${r.kit.name} (BOM cost / MRP margin / school margin)`, "n/a", `MRP ${r.mrp.price}; school ${r.school.price}; no part costs in Prices & Costs yet`);
    else add("Kit economics", `${r.kit.name} (BOM cost / MRP margin / school margin)`, r.cost, `MRP ${r.mrp.price} margin ${Math.round(r.mrp.margin)} (${Math.round(r.mrp.marginPct ?? 0)}%); school ${r.school.price} margin ${Math.round(r.school.margin)} (${Math.round(r.school.marginPct ?? 0)}%)`);
  }

  const e = estimatorTotals(s, book);
  for (const r of e.rows.filter((x) => x.qty > 0)) add("Add-on estimator", r.label, r.monthly, `${r.qty} ${r.unit}`);

  const esc = (v: string | number) => {
    const t = String(v);
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}
