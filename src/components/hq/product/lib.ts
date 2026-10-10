/**
 * Shared, framework-free helpers for the Kits / Inventory / Shop modules.
 * Pure functions only — safe to import from client components and print pages.
 */
import { kits, type Kit } from "@/lib/content/business";
import type { BaseRecord } from "@/lib/hq/collections";
import { bomCostExact } from "@/lib/pricebook/math";
import type { KitParts, PriceBook } from "@/lib/pricebook/types";
import { formatINR } from "@/lib/utils";

export type Rec = BaseRecord;
export type KitId = Kit["id"];

/* ── tiny coercers ─────────────────────────────────────────────────────── */
export const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
export const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
/** case-insensitive, whitespace-collapsed key used to match component names */
export const norm = (v: unknown) => str(v).trim().toLowerCase().replace(/\s+/g, " ");
/** ₹ with paise only when needed (unit costs like ₹1.50) */
export const inr = (v: number) => formatINR(v, { decimals: !Number.isInteger(Math.round(v * 100) / 100) });

/* ── kits ──────────────────────────────────────────────────────────────── */
export const KIT_SLUGS: Record<KitId, string> = {
  spark: "spark-kit",
  explorer: "explorer-kit",
  builder: "builder-kit",
  innovator: "innovator-ai-kit",
};
export const kitSlug = (id: KitId) => KIT_SLUGS[id];
export const getKit = (id: unknown): Kit | undefined => kits.find((k) => k.id === id);
export { kits };

/** Where the founders change what parts cost and what customers pay. */
export const PRICES_HREF = "/hq/prices";

/** One part of a kit. The cost and the vendor note are null for a login that does not see costs. */
export interface KitLine {
  item: string;
  qty: number;
  unitCost: number | null;
  vendorHint: string | null;
}

/**
 * The parts of one kit, as saved in HQ → Money → Prices & Costs. With the price book (founder, admin, ops) every
 * line carries its cost; with the parts list only (a trainer) the cost is unknown; with neither the list is empty.
 */
export function kitLines(kitId: KitId, book: PriceBook | null, parts: KitParts | null): KitLine[] {
  const priced = book?.kits?.[kitId]?.bom;
  if (priced) return priced.map((l) => ({ item: l.item, qty: l.qty, unitCost: l.unitCost, vendorHint: l.vendorHint }));
  return (parts?.[kitId] ?? []).map((l) => ({ item: l.item, qty: l.qty, unitCost: null, vendorHint: null }));
}

/**
 * What the parts of one kit cost, exact to the paisa. Null when the cost is not known: no price book for this login,
 * or no part has a cost typed in yet. Show a dash for null, never ₹0.
 */
export function kitCostExact(kitId: unknown, book: PriceBook | null): number | null {
  const bom = book?.kits?.[kitId as KitId]?.bom;
  if (!bom) return null;
  const cost = bomCostExact(bom);
  return cost > 0 ? cost : null;
}

/* ── CSV ───────────────────────────────────────────────────────────────── */
export function toCsv(rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

/* ── inventory ─────────────────────────────────────────────────────────── */
export type StockState = "out" | "low" | "ok" | "untracked";

/**
 * low  → tracked item (reorder level > 0) with stock ≤ reorder level
 * out  → stock is 0 on a tracked item
 * untracked → no reorder level set and nothing in stock (e.g. demo equipment not bought yet)
 */
export function stockState(r: Rec): StockState {
  const qty = num(r.stockQty);
  const level = num(r.reorderLevel);
  if (qty <= 0) return level > 0 ? "out" : "untracked";
  if (level > 0 && qty <= level) return "low";
  return "ok";
}
export const needsRestock = (r: Rec) => {
  const s = stockState(r);
  return s === "low" || s === "out";
};
export const stockValue = (r: Rec) => Math.max(0, num(r.stockQty)) * num(r.unitCost);

/** name (case-insensitive) → first matching inventory record */
export function indexInventory(records: Rec[]) {
  const m = new Map<string, Rec>();
  for (const r of records) {
    const k = norm(r.name);
    if (k && !m.has(k)) m.set(k, r);
  }
  return m;
}

export interface Requirement {
  item: string;
  perKit: number;
  required: number;
  /** null = this login does not see costs */
  unitCost: number | null;
  vendorHint: string | null;
  /** null = no inventory record with this name */
  stock: number | null;
  short: number;
  inventoryId?: string;
}

/** a quantity can be a fraction (0.5 m of wire): keep two decimals, without floating-point dust */
const qty2 = (v: number) => Math.round(v * 100) / 100;

/** A kit's parts × quantity vs current stock (matched by part name, case-insensitive). */
export function buildRequirements(lines: readonly KitLine[], qty: number, inventory: Map<string, Rec>): Requirement[] {
  return lines.map((b) => {
    const rec = inventory.get(norm(b.item));
    const required = qty2(b.qty * qty);
    const stock = rec ? Math.max(0, num(rec.stockQty)) : null;
    return {
      item: b.item,
      perKit: b.qty,
      required,
      unitCost: b.unitCost,
      vendorHint: b.vendorHint,
      stock,
      short: qty2(Math.max(0, required - (stock ?? 0))),
      inventoryId: rec?.id,
    };
  });
}

/** How many complete kits can be built from what is in stock right now. */
export function buildableNow(reqs: Requirement[]) {
  // a line with quantity 0 is a note, not a part that can run out
  const used = reqs.filter((r) => r.perKit > 0);
  if (!used.length) return 0;
  return Math.max(0, Math.min(...used.map((r) => Math.floor((r.stock ?? 0) / r.perKit))));
}

/* ── orders ────────────────────────────────────────────────────────────── */
export const ORDER_FLOW = ["new", "confirmed", "paid", "packed", "shipped", "delivered"] as const;
export const ORDER_STATUSES = [...ORDER_FLOW, "cancelled", "refunded"] as const;
export const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface OrderLine {
  description: string;
  qty: number;
  rate: number;
  productId?: string;
}
export const orderLines = (o: Record<string, unknown>): OrderLine[] =>
  (Array.isArray(o.items) ? (o.items as Partial<OrderLine>[]) : []).map((i) => ({
    description: str(i.description),
    qty: num(i.qty),
    rate: num(i.rate),
    productId: i.productId ? str(i.productId) : undefined,
  }));
export const orderUnits = (o: Record<string, unknown>) => orderLines(o).reduce((s, l) => s + l.qty, 0);

/** wa.me link for an Indian customer number (10 digits → +91). Returns null when there is no usable number. */
export function waLink(phone: unknown, text: string): string | null {
  let d = str(phone).replace(/\D/g, "");
  if (d.length < 10) return null;
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = `91${d}`;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}
export const telLink = (phone: unknown) => {
  const d = str(phone).replace(/[^\d+]/g, "");
  return d ? `tel:${d}` : null;
};

export function orderWhatsAppText(o: Record<string, unknown>) {
  const lines = orderLines(o)
    .map((l) => `• ${l.qty} × ${l.description} — ${formatINR(l.qty * l.rate)}`)
    .join("\n");
  const status = str(o.status);
  const bits = [
    `Hi ${str(o.customerName) || "there"}, thank you for ordering from JOVE!`,
    `Order ${str(o.number) || "—"}:`,
    lines,
    `Shipping: ${num(o.shipping) ? formatINR(num(o.shipping)) : "Free"} · Total: ${formatINR(num(o.total))}`,
  ];
  if (status === "shipped" && (str(o.courier) || str(o.awb))) {
    bits.push(`Your order has been shipped${str(o.courier) ? ` via ${str(o.courier)}` : ""}${str(o.awb) ? ` — tracking no. ${str(o.awb)}` : ""}.`);
  } else if (status === "packed") bits.push("Your order is packed and will be handed to the courier shortly.");
  else if (status === "delivered") bits.push("Your order is marked delivered — tell us how the build goes!");
  else if (status === "new" || status === "confirmed") bits.push("We'll share payment and delivery details here.");
  return bits.join("\n");
}
