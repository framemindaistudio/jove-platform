/**
 * The price book: every number JOVE's founders control from HQ → Money → Prices & Costs.
 *
 * It is one JSON document in the private data repository (data/pricebook.json) with two kinds of numbers:
 *
 *   PRIVATE  what things cost JOVE — every component of every kit, margins, the cost of running a JOVE Day,
 *            monthly costs, launch budget, targets. Read live by HQ, only for the roles that see Finance.
 *            None of it is ever part of the website's code or its public JavaScript.
 *
 *   PUBLIC   what customers pay — kit prices, per-student workshop prices, minimums, payment terms, add-on
 *            prices. Saving the price book works these out and stores them under `published`; the website build
 *            reads only that part (next.config.ts) and bakes it into the site, brochures and proposals.
 */
import type { GradeBandId, KitId } from "@/lib/content/business";

/** How an automatically worked-out price is rounded up. */
export type Rounding = "none" | "9" | "49-99" | "99";

export interface BomLine {
  id: string;
  item: string;
  qty: number;
  unitCost: number;
  vendorHint: string;
}

export interface KitPricing {
  /** "fixed": the founders type the MRP · "margin": the MRP follows the cost so the margin stays at the target */
  mode: "fixed" | "margin";
  /** MRP including GST, used when mode is "fixed" */
  mrp: number;
  /** gross margin wanted on the price before GST, in percent, used when mode is "margin" */
  targetMarginPercent: number;
  rounding: Rounding;
}

export interface KitBook {
  bom: BomLine[];
  pricing: KitPricing;
}

export interface BandPrices {
  /** JOVE Day, per student, before GST */
  day: number;
  /** JOVE Quarter (3 JOVE Days), per student, before GST */
  quarter: number;
  /** JOVE Year (8 sessions), per student, before GST */
  year: number;
}

export interface WorkshopRules {
  minimumStudents: number;
  /** before GST */
  minimumBilling: number;
  maxStudentsPerDay: number;
  advancePercent: number;
  balanceDueDays: number;
  gstPercent: number;
}

export interface ClubRules {
  pricePerMonth: number;
  minimumStudents: number;
}

export type CostLineType = "fixed" | "perStudent" | "percentRevenue";
export interface CostLine {
  id: string;
  label: string;
  type: CostLineType;
  amount: number;
}
export interface MoneyLine {
  id: string;
  label: string;
  amount: number;
}
export interface RevenueStream {
  id: string;
  name: string;
  model: string;
  potential: string;
  stage: string;
}

export interface PlanTargets {
  workshopsPerMonth: number;
  monthlyRevenue: number;
  revenuePerWorkshop: number;
  yearOneSchools: number;
}

/** Planning assumptions behind HQ → Business Planner and the workshop economics. Private. */
export interface PlannerBook {
  /** students on the JOVE Day the cost lines are written for */
  students: number;
  avgPricePerStudent: number;
  /** what one JOVE Day costs to run */
  lines: CostLine[];
  /** monthly fixed costs */
  fixedCosts: MoneyLine[];
  /** one-time launch budget */
  capex: MoneyLine[];
  targets: PlanTargets;
  streams: RevenueStream[];
  /**
   * The share of the price JOVE keeps on each service after its direct costs, in percent: the founders' planning
   * assumption, used as the planner's starting margins. Keys are add-on ids, plus "club" and "camp".
   */
  margins: Record<string, number>;
}

/** The six cost lines of a JOVE Day that the workshop screens look up by id: they can be changed, never removed. */
export const RESERVED_COST_LINES = ["consumables", "worksheets", "certificates", "travel", "food", "stay"] as const;

/** What customers pay. Worked out on every save and baked into the website by the next build. */
export interface PublicPrices {
  /** short fingerprint of everything below: HQ compares it with the one in the running build */
  stamp: string;
  kits: Record<KitId, { mrp: number; schoolPrice: number }>;
  schoolDiscountPercent: number;
  bands: Record<GradeBandId, BandPrices>;
  rules: WorkshopRules;
  club: ClubRules;
  mediaPackValue: number;
  /** add-on id → price */
  addOns: Record<string, number>;
  targets: Pick<PlanTargets, "workshopsPerMonth" | "yearOneSchools">;
}

export interface PriceBook {
  version: 1;
  /** GST inside a kit's MRP, in percent */
  kitGstPercent: number;
  /** a school buying kits in bulk pays the MRP less this, in percent */
  schoolDiscountPercent: number;
  kits: Record<KitId, KitBook>;
  bands: Record<GradeBandId, BandPrices>;
  rules: WorkshopRules;
  club: ClubRules;
  /** typical market value of the free Media Pack */
  mediaPackValue: number;
  /** add-on id → price (the take-home kits add-on has no price of its own: it uses schoolDiscountPercent) */
  addOns: Record<string, number>;
  planner: PlannerBook;
  published?: PublicPrices;
  updatedAt?: string;
  updatedBy?: string;
}

/** A kit's parts without any money, for roles that pack and assemble kits but do not see Finance. */
export type KitParts = Record<KitId, { item: string; qty: number }[]>;
