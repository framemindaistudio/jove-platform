/**
 * Business Planner model: pure functions, no React. Every default comes from
 * src/lib/content/business.ts (the single source of truth); the scenario the
 * founders edit lives in the browser (see store.ts) and never overwrites it.
 */
import {
  addOns,
  gradeBands,
  joveDayRules,
  kitCost,
  kits,
  launchCapex,
  monthlyFixedCosts,
  targets,
  workshopCostModel,
  type GradeBandId,
} from "@/lib/content/business";

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
  /** share of revenue left after direct costs (planning assumption, editable) */
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

/** Default ramp: Oct 1, Nov 2, Dec 3, Jan–Mar 4, Apr–May 2 + camps, Jun–Sep 4–5. */
const DEFAULT_RAMP = [1, 2, 3, 4, 4, 4, 2, 2, 4, 5, 4, 5];
const DEFAULT_CAMPS = [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0];

/** Mid-point of the ₹2,999–₹4,999 5-day camp range in business.ts → revenueStreams. */
const CAMP_PRICE = 3999;

export const CLUB_PRICE = 799; // business.ts → packages "jove-club": ₹799 per student per month

const addOnPrice = (id: string) => addOns.find((a) => a.id === id)?.priceValue ?? 0;

/** Planning assumptions: direct margin kept after delivery cost, per add-on. Editable in the UI. */
export const ESTIMATOR_ROWS = [
  { id: "smm-starter", label: "Social media management: Starter", unit: "retainers / month", price: addOnPrice("smm-starter"), marginPct: 70, group: "smm" },
  { id: "smm-growth", label: "Social media management: Growth", unit: "retainers / month", price: addOnPrice("smm-growth"), marginPct: 65, group: "smm" },
  { id: "smm-premium", label: "Social media management: Premium", unit: "retainers / month", price: addOnPrice("smm-premium"), marginPct: 55, group: "smm" },
  { id: "film-admissions", label: "Admissions / commercial film", unit: "films / month", price: addOnPrice("film-admissions"), marginPct: 60, group: "films" },
  { id: "film-premium", label: "Premium brand film", unit: "films / month", price: addOnPrice("film-premium"), marginPct: 55, group: "films" },
  { id: "teacher-training", label: "Teacher training & certification", unit: "teachers / month", price: addOnPrice("teacher-training"), marginPct: 60, group: "teacher" },
  { id: "club", label: "After-school JOVE Club", unit: "student-months", price: CLUB_PRICE, marginPct: 55, group: "clubs" },
  { id: "camp", label: "Summer / winter camp", unit: "students / month", price: CAMP_PRICE, marginPct: 50, group: "camps" },
  { id: "lab-setup", label: "Robotics & AI lab setup (turnkey)", unit: "labs / month", price: addOnPrice("lab-setup"), marginPct: 30, group: "lab" },
] as const;

/* ───────────────────────────── defaults ───────────────────────────── */

export function defaultKitAverages() {
  const m = kits.map((k) => {
    const net = k.schoolPrice / 1.18;
    const cost = kitCost(k);
    return { net, marginPct: ((net - cost) / net) * 100 };
  });
  const avg = (f: (x: (typeof m)[number]) => number) => m.reduce((s, x) => s + f(x), 0) / m.length;
  return { unitRevenue: Math.round(avg((x) => x.net)), marginPct: Math.round(avg((x) => x.marginPct)) };
}

export function defaultScenario(): Scenario {
  const students = { "g1-2": 50, "g3-5": 70, "g6-8": 80, "g9-10": 50 } as Record<GradeBandId, number>;
  const prices = Object.fromEntries(gradeBands.map((b) => [b.id, b.pricePerStudent])) as Record<GradeBandId, number>;
  const kitAvg = defaultKitAverages();
  return {
    v: 1,
    day: {
      students,
      prices,
      minimumBilling: joveDayRules.minimumBilling,
      lines: workshopCostModel.lines.map((l) => ({ ...l })),
    },
    month: {
      workshops: targets.workshopsPerMonth,
      revenueMode: "day",
      customRevenue: targets.revenuePerWorkshop,
      target: targets.monthlyRevenue,
      fixed: monthlyFixedCosts.map((f) => ({ ...f })),
      addons: [
        { id: "kits", label: "Take-home kits sold (school bulk + online)", unit: "kits", qty: 0, unitRevenue: kitAvg.unitRevenue, marginPct: kitAvg.marginPct },
        { id: "smm", label: "Social media management retainers", unit: "retainers", qty: 0, unitRevenue: addOnPrice("smm-starter"), marginPct: 70 },
        { id: "films", label: "Admissions / brand films", unit: "films", qty: 0, unitRevenue: addOnPrice("film-admissions"), marginPct: 60 },
        { id: "clubs", label: "After-school club students (monthly)", unit: "students", qty: 0, unitRevenue: CLUB_PRICE, marginPct: 55 },
        { id: "teacher", label: "Teacher training seats", unit: "teachers", qty: 0, unitRevenue: addOnPrice("teacher-training"), marginPct: 60 },
      ],
    },
    year: {
      workshops: [...DEFAULT_RAMP],
      camps: [...DEFAULT_CAMPS],
      campStudents: 30,
      campPrice: CAMP_PRICE,
      campMarginPct: 50,
      addonsFromMonth: 4,
    },
    capex: launchCapex.map((l) => ({ id: l.id, label: l.label, amount: l.amount, included: !isOptionalLine(l) })),
    kitCostAdjustPct: 0,
    estimator: {},
  };
}

export function isOptionalLine(l: { label: string }) {
  return /optional/i.test(l.label);
}
export function isReserveLine(l: { id: string }) {
  return l.id === "buffer";
}

/** Merge a stored scenario onto the defaults so older/partial saves never crash the UI. */
export function reviveScenario(raw: unknown): Scenario {
  const d = defaultScenario();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Partial<Scenario>;
  if (r.v !== 1) return d;
  const numArr = (a: unknown, fallback: number[]) => (Array.isArray(a) && a.length === 12 && a.every((x) => typeof x === "number") ? (a as number[]) : fallback);
  return {
    v: 1,
    day: { ...d.day, ...(r.day ?? {}), students: { ...d.day.students, ...(r.day?.students ?? {}) }, prices: { ...d.day.prices, ...(r.day?.prices ?? {}) }, lines: Array.isArray(r.day?.lines) ? r.day!.lines : d.day.lines },
    month: {
      ...d.month,
      ...(r.month ?? {}),
      fixed: Array.isArray(r.month?.fixed) ? r.month!.fixed : d.month.fixed,
      addons: d.month.addons.map((a) => ({ ...a, ...(r.month?.addons?.find((x) => x.id === a.id) ?? {}) })),
    },
    year: { ...d.year, ...(r.year ?? {}), workshops: numArr(r.year?.workshops, d.year.workshops), camps: numArr(r.year?.camps, d.year.camps) },
    capex: d.capex.map((c) => ({ ...c, ...(r.capex?.find((x) => x.id === c.id) ?? {}) })),
    kitCostAdjustPct: typeof r.kitCostAdjustPct === "number" ? r.kitCostAdjustPct : 0,
    estimator: r.estimator && typeof r.estimator === "object" ? r.estimator : {},
  };
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

export function kitRows(adjPct: number) {
  const f = 1 + adjPct / 100;
  const row = (price: number, cost: number) => {
    const net = price / 1.18;
    return { price, net, margin: net - cost, marginPct: net > 0 ? ((net - cost) / net) * 100 : 0 };
  };
  return kits.map((k) => {
    const cost = Math.round(kitCost(k) * f);
    return { kit: k, cost, mrp: row(k.mrp, cost), school: row(k.schoolPrice, cost) };
  });
}

/* ───────────────────────────── f) estimator ───────────────────────────── */

export function estimatorTotals(qty: Record<string, number>) {
  const rows = ESTIMATOR_ROWS.map((r) => {
    const q = n(qty[r.id]);
    const monthly = q * r.price;
    return { ...r, qty: q, monthly, contribution: monthly * (r.marginPct / 100), annual: monthly * 12 };
  });
  return {
    rows,
    monthly: rows.reduce((sum, r) => sum + r.monthly, 0),
    contribution: rows.reduce((sum, r) => sum + r.contribution, 0),
    annual: rows.reduce((sum, r) => sum + r.annual, 0),
  };
}

/** Turn the estimator's rows into the monthly plan's add-on rows (camps and lab setups are not part of the plan add-ons). */
export function estimatorToAddons(qty: Record<string, number>, current: AddonRow[]): AddonRow[] {
  const rows = estimatorTotals(qty).rows;
  const group = (g: string) => {
    const r = rows.filter((x) => x.group === g);
    const q = r.reduce((sum, x) => sum + x.qty, 0);
    const rev = r.reduce((sum, x) => sum + x.monthly, 0);
    const contrib = r.reduce((sum, x) => sum + x.contribution, 0);
    return { q, unit: q > 0 ? Math.round(rev / q) : 0, margin: rev > 0 ? Math.round((contrib / rev) * 100) : 0 };
  };
  const map: Record<string, ReturnType<typeof group>> = { smm: group("smm"), films: group("films"), clubs: group("clubs"), teacher: group("teacher") };
  return current.map((a) => {
    const g = map[a.id];
    return g && g.q > 0 ? { ...a, qty: g.q, unitRevenue: g.unit, marginPct: g.margin } : g ? { ...a, qty: 0 } : a;
  });
}

/* ───────────────────────────── g) CSV ───────────────────────────── */

export function scenarioCsv(s: Scenario): string {
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

  for (const r of kitRows(s.kitCostAdjustPct)) add("Kit economics", `${r.kit.name} (BOM cost / MRP margin / school margin)`, r.cost, `MRP ${r.kit.mrp} margin ${Math.round(r.mrp.margin)} (${Math.round(r.mrp.marginPct)}%); school ${r.kit.schoolPrice} margin ${Math.round(r.school.margin)} (${Math.round(r.school.marginPct)}%)`);

  const e = estimatorTotals(s.estimator);
  for (const r of e.rows.filter((x) => x.qty > 0)) add("Add-on estimator", r.label, r.monthly, `${r.qty} ${r.unit}`);

  const esc = (v: string | number) => {
    const t = String(v);
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}
