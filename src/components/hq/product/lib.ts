/**
 * Shared, framework-free helpers for the Kits / Inventory / Shop modules.
 * Pure functions only — safe to import from client components and print pages.
 */
import { kits, kitCost, type Kit } from "@/lib/content/business";
import type { BaseRecord } from "@/lib/hq/collections";
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
export { kits, kitCost };

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
  unitCost: number;
  vendorHint: string;
  /** null = no inventory record with this name */
  stock: number | null;
  short: number;
  inventoryId?: string;
}

/** BOM × quantity vs current stock (matched by component name, case-insensitive). */
export function buildRequirements(kit: Kit, qty: number, inventory: Map<string, Rec>): Requirement[] {
  return kit.bom.map((b) => {
    const rec = inventory.get(norm(b.item));
    const required = b.qty * qty;
    const stock = rec ? Math.max(0, num(rec.stockQty)) : null;
    return {
      item: b.item,
      perKit: b.qty,
      required,
      unitCost: b.unitCost,
      vendorHint: b.vendorHint,
      stock,
      short: Math.max(0, required - (stock ?? 0)),
      inventoryId: rec?.id,
    };
  });
}

/** How many complete kits can be built from what is in stock right now. */
export function buildableNow(reqs: Requirement[]) {
  if (!reqs.length) return 0;
  return Math.max(0, Math.min(...reqs.map((r) => Math.floor((r.stock ?? 0) / r.perKit))));
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
