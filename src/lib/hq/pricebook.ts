import "server-only";
import { store, StoreConflictError } from "@/lib/store";
import { addOns, clubRules, gradeBands, joveDayRules, kits, mediaPack, schoolDiscountPercent, targets, type GradeBandId, type KitId } from "@/lib/content/business";
import { fingerprint, kitFigures } from "@/lib/pricebook/math";
import { RESERVED_COST_LINES, type BomLine, type CostLine, type CostLineType, type KitBook, type KitParts, type MoneyLine, type PriceBook, type PublicPrices, type RevenueStream, type Rounding } from "@/lib/pricebook/types";
import { uid } from "@/lib/utils";
import { listRecords, upsertMany, ValidationError } from "./records";
import { OPS, OPS_TRAINER, type Role } from "./roles";

/**
 * The price book (data/pricebook.json in the private data repository): reading, checking, saving and publishing.
 * See src/lib/pricebook/types.ts for what is in it and who may see which part.
 */
export const PRICEBOOK_PATH = "data/pricebook.json";

const KIT_IDS = kits.map((k) => k.id);
const BAND_IDS = gradeBands.map((b) => b.id);
/** add-ons that have a price of their own (the take-home kits add-on is a discount on the kit MRP instead) */
const PRICED_ADD_ONS = addOns.filter((a) => a.unit !== "kit");
const ROUNDINGS: Rounding[] = ["none", "9", "49-99", "99"];
const LINE_TYPES: CostLineType[] = ["fixed", "perStudent", "percentRevenue"];

/** A price book for an installation that has not saved one yet: today's public prices, and no costs. */
export function startingBook(): PriceBook {
  return {
    version: 1,
    kitGstPercent: 18,
    schoolDiscountPercent,
    kits: Object.fromEntries(kits.map((k): [KitId, KitBook] => [k.id, { bom: [], pricing: { mode: "fixed", mrp: k.mrp, targetMarginPercent: 50, rounding: "99" } }])) as Record<KitId, KitBook>,
    bands: Object.fromEntries(gradeBands.map((b) => [b.id, { day: b.pricePerStudent, quarter: b.quarterPricePerStudent, year: b.yearPricePerStudent }])) as PriceBook["bands"],
    rules: {
      minimumStudents: joveDayRules.minimumStudents,
      minimumBilling: joveDayRules.minimumBilling,
      maxStudentsPerDay: joveDayRules.maxStudentsPerDay,
      advancePercent: joveDayRules.advancePercent,
      balanceDueDays: joveDayRules.balanceDueDays,
      gstPercent: joveDayRules.gstPercent,
    },
    club: { ...clubRules },
    mediaPackValue: mediaPack.marketValue,
    addOns: Object.fromEntries(PRICED_ADD_ONS.map((a) => [a.id, a.priceValue])),
    planner: {
      students: joveDayRules.targetStudentsPerDay,
      avgPricePerStudent: joveDayRules.targetAvgPricePerStudent,
      lines: [],
      fixedCosts: [],
      capex: [],
      targets: { workshopsPerMonth: targets.workshopsPerMonth, monthlyRevenue: 0, revenuePerWorkshop: 0, yearOneSchools: targets.yearOneSchools },
      streams: [],
      margins: {},
    },
  };
}

/* ───────────────────────────── checking what was typed ───────────────────────────── */

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const arr = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);
const text = (v: unknown, max: number) => (typeof v === "string" ? v : v === undefined || v === null ? "" : String(v)).replace(/\s+/g, " ").trim().slice(0, max);
/** a number within [min, max], rounded to `decimals`; anything that is not a number becomes `fallback` */
function num(v: unknown, fallback: number, min: number, max: number, decimals = 0) {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  const f = 10 ** decimals;
  return Math.min(max, Math.max(min, Math.round(n * f) / f));
}
const lineId = (v: unknown, prefix: string) => (typeof v === "string" && /^[\w-]{1,48}$/.test(v) ? v : uid(prefix));

function cleanBom(v: unknown): BomLine[] {
  return arr(v, 80)
    .map((raw) => {
      const l = obj(raw);
      return { id: lineId(l.id, "bom"), item: text(l.item, 140), qty: num(l.qty, 1, 0, 9999, 2), unitCost: num(l.unitCost, 0, 0, 1_000_000, 2), vendorHint: text(l.vendorHint, 180) };
    })
    .filter((l) => l.item);
}
const cleanMoney = (v: unknown, prefix: string): MoneyLine[] =>
  arr(v, 80)
    .map((raw) => {
      const l = obj(raw);
      return { id: lineId(l.id, prefix), label: text(l.label, 160), amount: num(l.amount, 0, 0, 100_000_000) };
    })
    .filter((l) => l.label);
const cleanLines = (v: unknown): CostLine[] =>
  arr(v, 60)
    .map((raw) => {
      const l = obj(raw);
      const type = LINE_TYPES.includes(l.type as CostLineType) ? (l.type as CostLineType) : "fixed";
      return { id: lineId(l.id, "cost"), label: text(l.label, 160), type, amount: num(l.amount, 0, 0, type === "percentRevenue" ? 100 : 100_000_000, type === "fixed" ? 0 : 2) };
    })
    .filter((l) => l.label);
const cleanStreams = (v: unknown): RevenueStream[] =>
  arr(v, 80)
    .map((raw) => {
      const l = obj(raw);
      return { id: lineId(l.id, "stream"), name: text(l.name, 120), model: text(l.model, 160), potential: text(l.potential, 200), stage: text(l.stage, 40) };
    })
    .filter((l) => l.name);

const cleanMargins = (v: unknown): Record<string, number> =>
  Object.fromEntries(
    Object.entries(obj(v))
      .filter(([k]) => /^[\w-]{1,40}$/.test(k))
      .slice(0, 40)
      .map(([k, n]) => [k, num(n, 0, 0, 100, 1)]),
  );

/**
 * Turns whatever was sent (or stored) into a complete, well-formed price book. Values that are missing fall back to
 * `base`. With `strict` it also refuses a book the website could not be published with, and says why.
 */
export function cleanBook(input: unknown, base: PriceBook, strict = false): PriceBook {
  const i = obj(input);
  const planner = obj(i.planner);
  const tg = obj(planner.targets);
  const rules = obj(i.rules);
  const club = obj(i.club);
  const kitsIn = obj(i.kits);
  const bandsIn = obj(i.bands);
  const addOnsIn = obj(i.addOns);

  const book: PriceBook = {
    version: 1,
    kitGstPercent: num(i.kitGstPercent, base.kitGstPercent, 0, 40, 1),
    schoolDiscountPercent: num(i.schoolDiscountPercent, base.schoolDiscountPercent, 0, 90, 1),
    kits: Object.fromEntries(
      KIT_IDS.map((id) => {
        const k = obj(kitsIn[id]);
        const p = obj(k.pricing);
        const b = base.kits[id];
        return [
          id,
          {
            bom: Array.isArray(k.bom) ? cleanBom(k.bom) : b.bom,
            pricing: {
              mode: p.mode === "margin" || p.mode === "fixed" ? p.mode : b.pricing.mode,
              mrp: num(p.mrp, b.pricing.mrp, 0, 1_000_000),
              targetMarginPercent: num(p.targetMarginPercent, b.pricing.targetMarginPercent, 0, 95, 1),
              rounding: ROUNDINGS.includes(p.rounding as Rounding) ? (p.rounding as Rounding) : b.pricing.rounding,
            },
          },
        ];
      }),
    ) as Record<KitId, KitBook>,
    bands: Object.fromEntries(
      BAND_IDS.map((id) => {
        const p = obj(bandsIn[id]);
        const b = base.bands[id];
        return [id, { day: num(p.day, b.day, 0, 100_000), quarter: num(p.quarter, b.quarter, 0, 300_000), year: num(p.year, b.year, 0, 1_000_000) }];
      }),
    ) as Record<GradeBandId, PriceBook["bands"][GradeBandId]>,
    rules: {
      minimumStudents: num(rules.minimumStudents, base.rules.minimumStudents, 1, 5000),
      minimumBilling: num(rules.minimumBilling, base.rules.minimumBilling, 0, 10_000_000),
      maxStudentsPerDay: num(rules.maxStudentsPerDay, base.rules.maxStudentsPerDay, 1, 5000),
      advancePercent: num(rules.advancePercent, base.rules.advancePercent, 0, 100),
      balanceDueDays: num(rules.balanceDueDays, base.rules.balanceDueDays, 0, 365),
      gstPercent: num(rules.gstPercent, base.rules.gstPercent, 0, 40, 1),
    },
    club: { pricePerMonth: num(club.pricePerMonth, base.club.pricePerMonth, 0, 100_000), minimumStudents: num(club.minimumStudents, base.club.minimumStudents, 1, 5000) },
    mediaPackValue: num(i.mediaPackValue, base.mediaPackValue, 0, 10_000_000),
    addOns: Object.fromEntries(PRICED_ADD_ONS.map((a) => [a.id, num(addOnsIn[a.id], base.addOns[a.id] ?? a.priceValue, 0, 100_000_000)])),
    planner: {
      students: num(planner.students, base.planner.students, 1, 5000),
      avgPricePerStudent: num(planner.avgPricePerStudent, base.planner.avgPricePerStudent, 0, 100_000),
      lines: Array.isArray(planner.lines) ? cleanLines(planner.lines) : base.planner.lines,
      fixedCosts: Array.isArray(planner.fixedCosts) ? cleanMoney(planner.fixedCosts, "fixed") : base.planner.fixedCosts,
      capex: Array.isArray(planner.capex) ? cleanMoney(planner.capex, "capex") : base.planner.capex,
      targets: {
        workshopsPerMonth: num(tg.workshopsPerMonth, base.planner.targets.workshopsPerMonth, 0, 200),
        monthlyRevenue: num(tg.monthlyRevenue, base.planner.targets.monthlyRevenue, 0, 1_000_000_000),
        revenuePerWorkshop: num(tg.revenuePerWorkshop, base.planner.targets.revenuePerWorkshop, 0, 100_000_000),
        yearOneSchools: num(tg.yearOneSchools, base.planner.targets.yearOneSchools, 0, 100_000),
      },
      streams: Array.isArray(planner.streams) ? cleanStreams(planner.streams) : base.planner.streams,
      margins: planner.margins && typeof planner.margins === "object" ? cleanMargins(planner.margins) : base.planner.margins,
    },
  };

  // the workshop screens look these cost lines up by id: a save that left one out keeps the stored line
  for (const id of RESERVED_COST_LINES) {
    const kept = base.planner.lines.find((l) => l.id === id);
    if (kept && !book.planner.lines.some((l) => l.id === id)) book.planner.lines.push(kept);
  }

  if (strict) {
    const issues: string[] = [];
    for (const k of kits) {
      const kb = book.kits[k.id];
      if (kb.pricing.mode === "fixed" && kb.pricing.mrp <= 0) issues.push(`${k.name}: type a price above ₹0, or let the price follow the cost.`);
      if (kb.pricing.mode === "margin" && !kb.bom.some((l) => l.qty * l.unitCost > 0)) issues.push(`${k.name}: add the parts and what they cost before letting the price follow the cost.`);
    }
    for (const b of gradeBands) {
      const p = book.bands[b.id];
      if (p.day <= 0 || p.quarter <= 0 || p.year <= 0) issues.push(`${b.grades}: every per-student price must be above ₹0.`);
    }
    if (book.club.pricePerMonth <= 0) issues.push("JOVE Club: the monthly price must be above ₹0.");
    if (book.rules.maxStudentsPerDay < book.rules.minimumStudents) issues.push("The most students in one day cannot be lower than the minimum for a JOVE Day.");
    for (const a of PRICED_ADD_ONS) if (book.addOns[a.id] <= 0) issues.push(`${a.name}: the price must be above ₹0.`);
    if (issues.length) throw new ValidationError(issues);
  }
  return book;
}

/** The prices customers pay, worked out from the book. This is the only part the website build reads. */
export function publish(book: PriceBook): PublicPrices {
  const body = {
    kits: Object.fromEntries(
      KIT_IDS.map((id) => {
        const f = kitFigures(book.kits[id], book.kitGstPercent, book.schoolDiscountPercent);
        return [id, { mrp: f.mrp, schoolPrice: f.schoolPrice }];
      }),
    ) as PublicPrices["kits"],
    schoolDiscountPercent: book.schoolDiscountPercent,
    bands: book.bands,
    rules: book.rules,
    club: book.club,
    mediaPackValue: book.mediaPackValue,
    addOns: book.addOns,
    targets: { workshopsPerMonth: book.planner.targets.workshopsPerMonth, yearOneSchools: book.planner.targets.yearOneSchools },
  };
  return { stamp: fingerprint(body), ...body };
}

/* ───────────────────────────── reading and saving ───────────────────────────── */

export async function readPriceBook(): Promise<{ book: PriceBook; sha?: string; exists: boolean }> {
  const { data, sha } = await store.readJSON<Partial<PriceBook> | null>(PRICEBOOK_PATH, null);
  const book = cleanBook(data ?? {}, startingBook());
  if (data) {
    book.published = obj(data.published).stamp ? (data.published as PublicPrices) : undefined;
    book.updatedAt = typeof data.updatedAt === "string" ? data.updatedAt : undefined;
    book.updatedBy = typeof data.updatedBy === "string" ? data.updatedBy : undefined;
  }
  return { book, sha, exists: !!data };
}

const backoff = (attempt: number) => new Promise((r) => setTimeout(r, 120 * (attempt + 1)));

/** Checks and saves the whole book, and stores the public prices that follow from it. */
export async function writePriceBook(input: unknown, author: string): Promise<PriceBook> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const current = await readPriceBook();
    const next = cleanBook(input, current.book, true);
    next.published = publish(next);
    next.updatedAt = new Date().toISOString();
    next.updatedBy = author;
    try {
      await store.write(PRICEBOOK_PATH, JSON.stringify(next, null, 2) + "\n", "Update prices and costs", { sha: current.sha, author });
      return next;
    } catch (e) {
      if (!(e instanceof StoreConflictError)) throw e;
      await backoff(attempt);
    }
  }
  throw new StoreConflictError();
}

/** The online shop keeps its own price per product: bring the products linked to a kit in line with the kit's MRP. */
export async function syncShopPrices(published: PublicPrices, author: string) {
  const products = await listRecords("products");
  const changed = products
    .filter((p) => typeof p.kitId === "string" && p.kitId in published.kits && Number(p.price) !== published.kits[p.kitId as KitId].mrp)
    .map((p) => ({ ...p, price: published.kits[p.kitId as KitId].mrp }));
  if (changed.length) await upsertMany("products", changed, author);
  return changed.length;
}

/** the key two names of the same part share: case and spacing do not matter */
const partKey = (v: unknown) => String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const guessCategory = (item: string) => (/box|bag|pack|sticker|label|tape/i.test(item) ? "Packaging" : /guide|booklet|printed|sheet|card/i.test(item) ? "Printed material" : undefined);

export interface StockSync {
  /** stock items whose unit cost or "used in kits" was brought in line */
  updated: number;
  /** parts that had no stock item yet and were added to Inventory with a stock of 0 */
  added: number;
  /** parts listed in several kits at different costs: their stock cost was left alone */
  mixed: string[];
}

/**
 * Inventory keeps one record per part, with its own unit cost (stock value = stock × unit cost). The price book is
 * the master for what a part costs: after every save, each stock item that is a part of a kit gets the book's cost
 * and the right "used in kits" list, and a part that has no stock item yet is added with a stock of 0. A stock item
 * and a part are the same thing when their names match (case and spacing aside).
 * A part listed in several kits at different costs has no single cost, so its stock cost is left as it is.
 */
export async function syncInventory(book: PriceBook, author: string): Promise<StockSync> {
  const parts = new Map<string, { item: string; cost: number | null; kits: KitId[]; hint: string }>();
  for (const id of KIT_IDS) {
    for (const line of book.kits[id].bom) {
      const key = partKey(line.item);
      if (!key) continue;
      const seen = parts.get(key);
      if (!seen) parts.set(key, { item: line.item, cost: line.unitCost, kits: [id], hint: line.vendorHint });
      else {
        if (!seen.kits.includes(id)) seen.kits.push(id);
        if (seen.cost !== line.unitCost) seen.cost = null;
      }
    }
  }
  const stock = await listRecords("inventory");
  const byName = new Map(stock.map((r) => [partKey(r.name), r]));
  const sameKits = (a: unknown, b: KitId[]) => Array.isArray(a) && a.length === b.length && b.every((k) => a.includes(k));
  const changed: Record<string, unknown>[] = [];
  const result: StockSync = { updated: 0, added: 0, mixed: [] };
  for (const [key, part] of parts) {
    if (part.cost === null) result.mixed.push(part.item);
    const rec = byName.get(key);
    if (!rec) {
      changed.push({ name: part.item, category: guessCategory(part.item), unit: "pcs", stockQty: 0, reorderLevel: 0, unitCost: part.cost ?? 0, usedIn: part.kits, notes: part.hint ? `Suggested source: ${part.hint}.` : "" });
      result.added += 1;
    } else if ((part.cost !== null && Number(rec.unitCost) !== part.cost) || !sameKits(rec.usedIn, part.kits)) {
      changed.push({ ...rec, unitCost: part.cost ?? rec.unitCost, usedIn: part.kits });
      result.updated += 1;
    }
  }
  // a stock item that is no longer a part of any kit keeps its cost, but stops saying it is used in one
  for (const rec of stock) {
    if (!parts.has(partKey(rec.name)) && Array.isArray(rec.usedIn) && rec.usedIn.length) {
      changed.push({ ...rec, usedIn: [] });
      result.updated += 1;
    }
  }
  if (changed.length) await upsertMany("inventory", changed, author);
  return result;
}

export type DeployResult = "triggered" | "missing" | "invalid" | "failed";

/**
 * Asks Vercel to rebuild the site so the saved prices reach the website, brochures and proposals.
 * VERCEL_DEPLOY_HOOK_URL is a Deploy Hook made in Vercel → Settings → Git → Deploy Hooks.
 */
export async function triggerDeploy(): Promise<DeployResult> {
  const raw = process.env.VERCEL_DEPLOY_HOOK_URL?.trim();
  if (!raw) return "missing";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "invalid";
  }
  if (url.protocol !== "https:" || url.hostname !== "api.vercel.com" || !url.pathname.startsWith("/v1/integrations/deploy/")) return "invalid";
  try {
    const res = await fetch(url, { method: "POST", cache: "no-store" });
    return res.ok ? "triggered" : "failed";
  } catch {
    return "failed";
  }
}

export const deployHookConfigured = () => !!process.env.VERCEL_DEPLOY_HOOK_URL?.trim();

/* ───────────────────────────── who gets what ───────────────────────────── */

/**
 * What a signed-in role receives: the roles that see Finance get the whole book; trainers get the parts lists
 * without any money (to pack and assemble kits); everyone else gets nothing.
 */
export function bookForRole(role: Role, book: PriceBook): { book: PriceBook | null; parts: KitParts | null } {
  const parts = OPS_TRAINER.includes(role) ? (Object.fromEntries(KIT_IDS.map((id) => [id, book.kits[id].bom.map((l) => ({ item: l.item, qty: l.qty }))])) as KitParts) : null;
  return { book: OPS.includes(role) ? book : null, parts };
}
