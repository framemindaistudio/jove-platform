/**
 * The Prices & Costs screen edits a copy of the price book in which every number is the text in its input box, so a
 * field can be emptied and retyped without jumping to 0. `toBook` turns that copy back into numbers, with the same
 * limits the server applies when it saves, so the figures shown while typing are the ones that will be saved.
 *
 * No cost, margin or price is written in this file: every number comes from the price book the server sends.
 */
import { addOns, gradeBands, kits, type AddOn, type GradeBandId, type KitId } from "@/lib/content/business";
import { bomCostExact, kitFigures } from "@/lib/pricebook/math";
import type { BandPrices, ClubRules, CostLineType, PlanTargets, PriceBook, RevenueStream, Rounding, WorkshopRules } from "@/lib/pricebook/types";
import { formatINR, uid } from "@/lib/utils";

export type TabId = "kits" | "workshops" | "addons" | "costs";

type Texts<T> = { [K in keyof T]: string };

export interface DraftPart {
  id: string;
  item: string;
  qty: string;
  unitCost: string;
  vendorHint: string;
}
export interface DraftKit {
  bom: DraftPart[];
  mode: "fixed" | "margin";
  mrp: string;
  targetMarginPercent: string;
  rounding: Rounding;
}
export interface DraftCostLine {
  id: string;
  label: string;
  type: CostLineType;
  amount: string;
}
export interface DraftMoneyLine {
  id: string;
  label: string;
  amount: string;
}
export interface Draft {
  kitGstPercent: string;
  schoolDiscountPercent: string;
  kits: Record<KitId, DraftKit>;
  bands: Record<GradeBandId, Texts<BandPrices>>;
  rules: Texts<WorkshopRules>;
  club: Texts<ClubRules>;
  mediaPackValue: string;
  addOns: Record<string, string>;
  planner: {
    students: string;
    avgPricePerStudent: string;
    lines: DraftCostLine[];
    fixedCosts: DraftMoneyLine[];
    capex: DraftMoneyLine[];
    targets: Texts<PlanTargets>;
    /** not edited on this screen: kept exactly as saved */
    streams: RevenueStream[];
    /** not edited on this screen (the planner's starting margins): kept exactly as saved */
    margins: Record<string, number>;
  };
}

/** What every tab receives. `book` is the draft as numbers; `saved` is what is stored in HQ right now. */
export interface TabProps {
  draft: Draft;
  book: PriceBook;
  saved: PriceBook;
  update: (change: (d: Draft) => Draft) => void;
}

const KIT_IDS = kits.map((k) => k.id);
const BAND_IDS = gradeBands.map((b) => b.id);
/** add-ons with a price of their own (the take-home kits add-on is the school discount on a kit instead) */
export const PRICED_ADD_ONS: AddOn[] = addOns.filter((a) => a.unit !== "kit");

/* ───────────────────────────── text ⇄ number ───────────────────────────── */

/** What may be typed into a number box: digits, one decimal point, and commas (1,50,000). */
export function cleanNumberText(typed: string) {
  const t = typed.replace(/[^\d.,]/g, "");
  const dot = t.indexOf(".");
  return dot < 0 ? t : t.slice(0, dot + 1) + t.slice(dot + 1).replace(/\./g, "");
}

/** The number in a box. An empty box counts as 0; this never returns NaN. */
export function toNumber(text: string) {
  const n = Number(text.replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function within(text: string, min: number, max: number, decimals = 0) {
  const f = 10 ** decimals;
  return Math.min(max, Math.max(min, Math.round(toNumber(text) * f) / f));
}

const show = (n: number) => (Number.isFinite(n) ? String(n) : "");
const tidy = (v: string, max: number) => v.replace(/\s+/g, " ").trim().slice(0, max);

/** A row nobody has typed anything into yet: left out when the draft is turned into a book. */
const blankPart = (l: DraftPart) => !l.item.trim() && !l.unitCost.trim() && !l.vendorHint.trim();
const blankLine = (l: { label: string; amount: string }) => !l.label.trim() && !l.amount.trim();

/** ₹ with paise only when there are any (a part can cost ₹1.50). */
export const rupees = (v: number) => formatINR(v, { decimals: !Number.isInteger(Math.round(v * 100) / 100) });

/* ───────────────────────────── book ⇄ draft ───────────────────────────── */

export function toDraft(book: PriceBook): Draft {
  return {
    kitGstPercent: show(book.kitGstPercent),
    schoolDiscountPercent: show(book.schoolDiscountPercent),
    kits: Object.fromEntries(
      KIT_IDS.map((id): [KitId, DraftKit] => {
        const k = book.kits[id];
        return [
          id,
          {
            bom: k.bom.map((l) => ({ id: l.id, item: l.item, qty: show(l.qty), unitCost: show(l.unitCost), vendorHint: l.vendorHint })),
            mode: k.pricing.mode,
            mrp: show(k.pricing.mrp),
            targetMarginPercent: show(k.pricing.targetMarginPercent),
            rounding: k.pricing.rounding,
          },
        ];
      }),
    ) as Record<KitId, DraftKit>,
    bands: Object.fromEntries(BAND_IDS.map((id) => [id, { day: show(book.bands[id].day), quarter: show(book.bands[id].quarter), year: show(book.bands[id].year) }])) as Draft["bands"],
    rules: {
      minimumStudents: show(book.rules.minimumStudents),
      minimumBilling: show(book.rules.minimumBilling),
      maxStudentsPerDay: show(book.rules.maxStudentsPerDay),
      advancePercent: show(book.rules.advancePercent),
      balanceDueDays: show(book.rules.balanceDueDays),
      gstPercent: show(book.rules.gstPercent),
    },
    club: { pricePerMonth: show(book.club.pricePerMonth), minimumStudents: show(book.club.minimumStudents) },
    mediaPackValue: show(book.mediaPackValue),
    addOns: Object.fromEntries(PRICED_ADD_ONS.map((a) => [a.id, show(book.addOns[a.id] ?? a.priceValue)])),
    planner: {
      students: show(book.planner.students),
      avgPricePerStudent: show(book.planner.avgPricePerStudent),
      lines: book.planner.lines.map((l) => ({ id: l.id, label: l.label, type: l.type, amount: show(l.amount) })),
      fixedCosts: book.planner.fixedCosts.map((l) => ({ id: l.id, label: l.label, amount: show(l.amount) })),
      capex: book.planner.capex.map((l) => ({ id: l.id, label: l.label, amount: show(l.amount) })),
      targets: {
        workshopsPerMonth: show(book.planner.targets.workshopsPerMonth),
        monthlyRevenue: show(book.planner.targets.monthlyRevenue),
        revenuePerWorkshop: show(book.planner.targets.revenuePerWorkshop),
        yearOneSchools: show(book.planner.targets.yearOneSchools),
      },
      streams: book.planner.streams,
      margins: book.planner.margins,
    },
  };
}

/** The draft as numbers: what the figures on screen are worked out from, and what Save sends. */
export function toBook(d: Draft): PriceBook {
  const money = (lines: DraftMoneyLine[]) => lines.filter((l) => !blankLine(l)).map((l) => ({ id: l.id, label: tidy(l.label, 160), amount: within(l.amount, 0, 100_000_000) }));
  return {
    version: 1,
    kitGstPercent: within(d.kitGstPercent, 0, 40, 1),
    schoolDiscountPercent: within(d.schoolDiscountPercent, 0, 90, 1),
    kits: Object.fromEntries(
      KIT_IDS.map((id) => {
        const k = d.kits[id];
        return [
          id,
          {
            bom: k.bom
              .filter((l) => !blankPart(l))
              .map((l) => ({ id: l.id, item: tidy(l.item, 140), qty: within(l.qty, 0, 9999, 2), unitCost: within(l.unitCost, 0, 1_000_000, 2), vendorHint: tidy(l.vendorHint, 180) })),
            pricing: { mode: k.mode, mrp: within(k.mrp, 0, 1_000_000), targetMarginPercent: within(k.targetMarginPercent, 0, 95, 1), rounding: k.rounding },
          },
        ];
      }),
    ) as PriceBook["kits"],
    bands: Object.fromEntries(BAND_IDS.map((id) => [id, { day: within(d.bands[id].day, 0, 100_000), quarter: within(d.bands[id].quarter, 0, 300_000), year: within(d.bands[id].year, 0, 1_000_000) }])) as PriceBook["bands"],
    rules: {
      minimumStudents: within(d.rules.minimumStudents, 1, 5000),
      minimumBilling: within(d.rules.minimumBilling, 0, 10_000_000),
      maxStudentsPerDay: within(d.rules.maxStudentsPerDay, 1, 5000),
      advancePercent: within(d.rules.advancePercent, 0, 100),
      balanceDueDays: within(d.rules.balanceDueDays, 0, 365),
      gstPercent: within(d.rules.gstPercent, 0, 40, 1),
    },
    club: { pricePerMonth: within(d.club.pricePerMonth, 0, 100_000), minimumStudents: within(d.club.minimumStudents, 1, 5000) },
    mediaPackValue: within(d.mediaPackValue, 0, 10_000_000),
    addOns: Object.fromEntries(PRICED_ADD_ONS.map((a) => [a.id, within(d.addOns[a.id] ?? "", 0, 100_000_000)])),
    planner: {
      students: within(d.planner.students, 1, 5000),
      avgPricePerStudent: within(d.planner.avgPricePerStudent, 0, 100_000),
      lines: d.planner.lines
        .filter((l) => !blankLine(l))
        .map((l) => ({ id: l.id, label: tidy(l.label, 160), type: l.type, amount: within(l.amount, 0, l.type === "percentRevenue" ? 100 : 100_000_000, l.type === "fixed" ? 0 : 2) })),
      fixedCosts: money(d.planner.fixedCosts),
      capex: money(d.planner.capex),
      targets: {
        workshopsPerMonth: within(d.planner.targets.workshopsPerMonth, 0, 200),
        monthlyRevenue: within(d.planner.targets.monthlyRevenue, 0, 1_000_000_000),
        revenuePerWorkshop: within(d.planner.targets.revenuePerWorkshop, 0, 100_000_000),
        yearOneSchools: within(d.planner.targets.yearOneSchools, 0, 100_000),
      },
      streams: d.planner.streams,
      margins: d.planner.margins,
    },
  };
}

/** Empty rows for the "Add" buttons. A part starts with a quantity of 1. */
export const newPart = (): DraftPart => ({ id: uid("bom"), item: "", qty: "1", unitCost: "", vendorHint: "" });
export const newCostLine = (): DraftCostLine => ({ id: uid("cost"), label: "", type: "fixed", amount: "" });
export const newMoneyLine = (prefix: "fixed" | "capex"): DraftMoneyLine => ({ id: uid(prefix), label: "", amount: "" });

/* ───────────────────────────── what changed ───────────────────────────── */

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Which tabs hold changes that are not saved yet. */
export function changedTabs(book: PriceBook, saved: PriceBook): Record<TabId, boolean> {
  return {
    kits: !same([book.kits, book.kitGstPercent, book.schoolDiscountPercent], [saved.kits, saved.kitGstPercent, saved.schoolDiscountPercent]),
    workshops: !same([book.bands, book.rules, book.club, book.mediaPackValue], [saved.bands, saved.rules, saved.club, saved.mediaPackValue]),
    addons: !same(book.addOns, saved.addOns),
    costs: !same(book.planner, saved.planner),
  };
}

export const kitChanged = (id: KitId, book: PriceBook, saved: PriceBook) => !same(book.kits[id], saved.kits[id]);

/** Everything in a book that customers see. Costs and margins are not in it; the prices that follow from them are. */
const customerSide = (b: PriceBook) => ({
  kits: KIT_IDS.map((id) => {
    const f = kitFigures(b.kits[id], b.kitGstPercent, b.schoolDiscountPercent);
    return [f.mrp, f.schoolPrice];
  }),
  discount: b.schoolDiscountPercent,
  bands: b.bands,
  rules: b.rules,
  club: b.club,
  mediaPack: b.mediaPackValue,
  addOns: b.addOns,
  targets: [b.planner.targets.workshopsPerMonth, b.planner.targets.yearOneSchools],
});

/** True when saving the draft would change something customers see (so the website has to rebuild). */
export const customersAffected = (book: PriceBook, saved: PriceBook) => !same(customerSide(book), customerSide(saved));

/* ───────────────────────────── what stops a save ───────────────────────────── */

export interface Issue {
  tab: TabId;
  /** the kit to open, when the problem is in one kit */
  kit?: KitId;
  text: string;
}

/**
 * Everything that has to be put right before the book can be saved, in plain words. The server checks the same
 * things again (and has the last word); finding them here means the founder sees them without a round trip.
 */
export function findIssues(d: Draft, book: PriceBook): Issue[] {
  const issues: Issue[] = [];
  const add = (tab: TabId, text: string, kit?: KitId) => issues.push({ tab, text, kit });

  if (toNumber(d.kitGstPercent) > 40) add("kits", "GST inside kit prices can be 40% at most.");
  if (toNumber(d.schoolDiscountPercent) > 90) add("kits", "The school bulk discount can be 90% at most.");
  for (const k of kits) {
    const dk = d.kits[k.id];
    const bk = book.kits[k.id];
    dk.bom.forEach((l, i) => {
      if (!blankPart(l) && !l.item.trim()) add("kits", `${k.name}: part ${i + 1} has no name. Name it, or remove the row.`, k.id);
    });
    if (dk.mode === "fixed" && bk.pricing.mrp <= 0) add("kits", `${k.name}: type a price above ₹0, or let the price follow the cost.`, k.id);
    if (dk.mode === "margin" && bomCostExact(bk.bom) <= 0) add("kits", `${k.name}: add the parts and what they cost before letting the price follow the cost.`, k.id);
    if (dk.mode === "margin" && toNumber(dk.targetMarginPercent) > 95) add("kits", `${k.name}: the margin can be 95% at most.`, k.id);
  }

  for (const b of gradeBands) {
    const p = book.bands[b.id];
    if (p.day <= 0 || p.quarter <= 0 || p.year <= 0) add("workshops", `${b.grades}: every per-student price must be above ₹0.`);
  }
  if (toNumber(d.rules.minimumStudents) < 1) add("workshops", "The minimum number of students for a JOVE Day must be 1 or more.");
  if (toNumber(d.rules.maxStudentsPerDay) < 1) add("workshops", "The most students in one day must be 1 or more.");
  else if (book.rules.maxStudentsPerDay < book.rules.minimumStudents) add("workshops", "The most students in one day cannot be lower than the minimum for a JOVE Day.");
  if (toNumber(d.rules.advancePercent) > 100) add("workshops", "The advance can be 100% at most.");
  if (toNumber(d.rules.gstPercent) > 40) add("workshops", "GST on workshops can be 40% at most.");
  if (book.club.pricePerMonth <= 0) add("workshops", "JOVE Club: the monthly price must be above ₹0.");
  if (toNumber(d.club.minimumStudents) < 1) add("workshops", "JOVE Club: the minimum number of students must be 1 or more.");

  for (const a of PRICED_ADD_ONS) if ((book.addOns[a.id] ?? 0) <= 0) add("addons", `${a.name}: the price must be above ₹0.`);

  if (toNumber(d.planner.students) < 1) add("costs", "One JOVE Day: the number of students must be 1 or more.");
  d.planner.lines.forEach((l, i) => {
    if (!blankLine(l) && !l.label.trim()) add("costs", `One JOVE Day: cost line ${i + 1} has no name. Name it, or remove the row.`);
    if (l.type === "percentRevenue" && toNumber(l.amount) > 100) add("costs", `One JOVE Day: "${l.label.trim() || `line ${i + 1}`}" cannot be more than 100% of revenue.`);
  });
  d.planner.fixedCosts.forEach((l, i) => {
    if (!blankLine(l) && !l.label.trim()) add("costs", `Monthly fixed costs: line ${i + 1} has no name. Name it, or remove the row.`);
  });
  d.planner.capex.forEach((l, i) => {
    if (!blankLine(l) && !l.label.trim()) add("costs", `Launch budget: line ${i + 1} has no name. Name it, or remove the row.`);
  });
  return issues;
}

/** True when the draft holds changes that are not saved. */
export const isChanged = (book: PriceBook, saved: PriceBook) => !same(book, saved);
