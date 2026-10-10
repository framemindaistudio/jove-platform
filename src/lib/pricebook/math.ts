/**
 * The arithmetic of the price book. Pure functions, no imports from the app: used by the server when it saves,
 * by the Prices & Costs screen while the founders type, and by the HQ screens that show costs and margins.
 */
import type { BomLine, CostLine, KitBook, Rounding } from "./types";

/** What the parts of one kit cost, exact to the paisa. */
export function bomCostExact(bom: readonly Pick<BomLine, "qty" | "unitCost">[]) {
  return bom.reduce((sum, line) => sum + line.qty * line.unitCost, 0);
}

/** What the parts of one kit cost, to the rupee. */
export function bomCost(bom: readonly Pick<BomLine, "qty" | "unitCost">[]) {
  return Math.round(bomCostExact(bom));
}

/** Rounds a price UP to the next "shop" price: 600 → 699 with "99", → 649 with "49-99", → 609 with "9". */
export function roundPrice(value: number, rule: Rounding) {
  const v = Math.max(0, Math.ceil(value - 1e-9));
  if (rule === "9") return Math.ceil((v - 9) / 10) * 10 + 9;
  if (rule === "49-99") return Math.ceil((v - 49) / 50) * 50 + 49;
  if (rule === "99") return Math.ceil((v - 99) / 100) * 100 + 99;
  return v;
}

/**
 * The MRP (GST included) that leaves `marginPercent` of the price before GST as gross margin.
 * cost 250, margin 50%, GST 18% → 250 / 0.5 = 500 before GST → 590 → rounded up by the rule.
 */
export function priceForMargin(cost: number, marginPercent: number, gstPercent: number, rule: Rounding) {
  const margin = Math.min(Math.max(marginPercent, 0), 95) / 100;
  const net = cost / (1 - margin);
  return roundPrice(net * (1 + gstPercent / 100), rule);
}

export interface Margin {
  /** the price with GST taken out */
  net: number;
  cost: number;
  /** net − cost */
  margin: number;
  /** margin as a percentage of net */
  marginPct: number;
}

/** A price that includes GST → what is left after GST and the cost of the parts. */
export function marginAt(cost: number, price: number, gstPercent: number): Margin {
  const net = price / (1 + gstPercent / 100);
  return { net: Math.round(net), cost: Math.round(cost), margin: Math.round(net - cost), marginPct: net > 0 ? Math.round(((net - cost) / net) * 100) : 0 };
}

export interface KitFigures {
  cost: number;
  mrp: number;
  schoolPrice: number;
  atMrp: Margin;
  atSchool: Margin;
}

/** Everything about one kit's money: cost, the MRP (typed, or following the cost), the school price and both margins. */
export function kitFigures(kit: KitBook, gstPercent: number, schoolDiscountPercent: number): KitFigures {
  const exact = bomCostExact(kit.bom);
  const mrp = kit.pricing.mode === "margin" ? priceForMargin(exact, kit.pricing.targetMarginPercent, gstPercent, kit.pricing.rounding) : Math.round(kit.pricing.mrp);
  const schoolPrice = Math.round(mrp * (1 - schoolDiscountPercent / 100));
  return { cost: Math.round(exact), mrp, schoolPrice, atMrp: marginAt(exact, mrp, gstPercent), atSchool: marginAt(exact, schoolPrice, gstPercent) };
}

/** What one JOVE Day costs to run and what it leaves, for a number of students at an average price each. */
export function dayEconomics(students: number, avgPrice: number, lines: readonly CostLine[], minimumBilling: number) {
  const revenue = Math.max(students * avgPrice, minimumBilling);
  const costs = lines.map((l) => ({
    ...l,
    total: Math.round(l.type === "fixed" ? l.amount : l.type === "perStudent" ? l.amount * students : (l.amount / 100) * revenue),
  }));
  const variable = costs.reduce((s, c) => s + c.total, 0);
  return { revenue, costs, variable, contribution: revenue - variable, marginPct: revenue > 0 ? Math.round(((revenue - variable) / revenue) * 100) : 0 };
}

/** A short, stable fingerprint of a value (FNV-1a over its JSON). Not a secret: it only tells two versions apart. */
export function fingerprint(value: unknown) {
  const text = JSON.stringify(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
