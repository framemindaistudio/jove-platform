/**
 * Store helpers shared by the shop pages (server) and the cart / catalog UI (client).
 * Pure functions only — no server-only imports, so this module is safe on both sides.
 */
import { gradeBands, kits, type GradeBand, type GradeBandId, type Kit, type KitId } from "@/lib/content/business";
import { labs, type LabMeta } from "@/lib/content/labs";

/** Structural shape of a catalog row (matches PublicProduct from lib/public-data). */
export interface ProductLike {
  id: string;
  slug: string;
  name: string;
  category?: string;
  kitId?: string;
  price: number | string;
  compareAt?: number | string;
  stock?: number | string;
  status: string;
  grades?: string;
  image?: string;
  short?: string;
  description?: string;
  highlights?: string[] | string;
  inTheBox?: string[] | string;
  paymentLink?: string;
  weightGrams?: number | string;
}

/** Serializable product passed to client components. */
export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  kitId?: KitId;
  price: number;
  compareAt?: number;
  stock?: number;
  status: string;
  available: boolean;
  grades?: string;
  image?: string;
  short?: string;
  bands: GradeBandId[];
  labSlugs: string[];
}

/** Minimal catalog row the cart uses to re-price lines exactly like the order API. */
export interface CartCatalogItem {
  slug: string;
  name: string;
  price: number;
  status: string;
  image?: string;
  kitId?: KitId;
}

/** Which free Virtual Labs each kit pairs with. */
export const KIT_LABS: Record<KitId, string[]> = {
  spark: ["code-the-rover"],
  explorer: ["logic-gates", "echo-sensor"],
  builder: ["line-follower", "echo-sensor"],
  innovator: ["teach-the-machine", "robot-arm"],
};

/** Inclusive grade range covered by each band (used to match free-text grades on HQ products). */
export const BAND_RANGES: Record<GradeBandId, [number, number]> = {
  "g1-2": [1, 2],
  "g3-5": [3, 5],
  "g6-8": [6, 8],
  "g9-10": [9, 10],
};

/** Bulk school pricing rule (mirrors addOns "take-home-kits" in business.ts). */
export const BULK_MIN_KITS = 30;
export const BULK_DISCOUNT_PCT = 10;

export function asKitId(v: unknown): KitId | undefined {
  return kits.some((k) => k.id === v) ? (v as KitId) : undefined;
}

export function kitById(kitId: KitId | undefined): Kit | undefined {
  return kitId ? kits.find((k) => k.id === kitId) : undefined;
}

export function bandForKit(kitId: KitId | undefined): GradeBand | undefined {
  return kitId ? gradeBands.find((b) => b.kitId === kitId) : undefined;
}

/** Grade bands a product is suitable for: linked kit first, otherwise parsed from "Grades 3–5". */
export function bandsFor(p: { kitId?: string; grades?: string }): GradeBandId[] {
  const band = bandForKit(asKitId(p.kitId));
  if (band) return [band.id];
  const m = /grades?\s*(\d{1,2})(?:\s*(?:–|-|—|to)\s*(\d{1,2}))?/i.exec(p.grades || "");
  if (!m) return [];
  const lo = Number(m[1]);
  const hi = Number(m[2] ?? m[1]);
  return (Object.keys(BAND_RANGES) as GradeBandId[]).filter((id) => {
    const [a, b] = BAND_RANGES[id];
    return lo <= b && hi >= a;
  });
}

export function labsFor(kitId: KitId | undefined): LabMeta[] {
  if (!kitId) return [];
  return KIT_LABS[kitId].map((slug) => labs.find((l) => l.slug === slug)).filter((l): l is LabMeta => !!l);
}

export function toNumber(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Tags fields may arrive as arrays (HQ) or comma/newline separated strings. */
export function toList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string") return v.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
  return [];
}

/** Percentage saved vs the compare-at price, or null when there is no real saving. */
export function savingsPct(price: number, compareAt?: number): number | null {
  if (!compareAt || compareAt <= price || price <= 0) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function isAvailable(status: string) {
  return status === "active";
}

export function toShopProduct(p: ProductLike): ShopProduct {
  const kitId = asKitId(p.kitId);
  const price = toNumber(p.price) ?? 0;
  const compareAt = toNumber(p.compareAt);
  return {
    id: String(p.id),
    slug: String(p.slug),
    name: String(p.name),
    category: p.category ? String(p.category) : "Kits",
    kitId,
    price,
    compareAt: compareAt && compareAt > price ? compareAt : undefined,
    stock: toNumber(p.stock),
    status: String(p.status || "active"),
    available: isAvailable(String(p.status || "active")),
    grades: p.grades ? String(p.grades) : kitById(kitId)?.grades,
    image: p.image ? String(p.image) : kitById(kitId)?.image,
    short: p.short ? String(p.short) : kitById(kitId)?.project,
    bands: bandsFor({ kitId, grades: p.grades }),
    labSlugs: kitId ? KIT_LABS[kitId] : [],
  };
}

export function toCartCatalogItem(p: ProductLike): CartCatalogItem {
  const s = toShopProduct(p);
  return { slug: s.slug, name: s.name, price: s.price, status: s.status, image: s.image, kitId: s.kitId };
}

/** "Grades 1–2 · Ages 6–8" → ["Grades 1–2", "Ages 6–8"] */
export function splitGrades(grades?: string): string[] {
  return (grades || "").split("·").map((s) => s.trim()).filter(Boolean);
}

/** Only same-origin paths go through next/image; anything else renders as a plain <img>. */
export function isLocalImage(src?: string): src is string {
  return !!src && src.startsWith("/") && !src.startsWith("//");
}
