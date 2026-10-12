import "server-only";
import { listRecords } from "@/lib/hq/records";
import { kits } from "@/lib/content/business";
import type { BaseRecord } from "@/lib/hq/collections";

/** Data the PUBLIC website reads from the repo store (cached for 5 minutes). */

export interface PublicProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  kitId?: string;
  price: number;
  compareAt?: number;
  stock?: number;
  status: string;
  grades?: string;
  image?: string;
  short?: string;
  description?: string;
  highlights?: string[];
  inTheBox?: string[];
  paymentLink?: string;
  weightGrams?: number;
  sort?: number;
}

export interface PublicTestimonial {
  id: string;
  name: string;
  role?: string;
  organisation?: string;
  quote: string;
  rating?: number;
  photo?: string;
  videoUrl?: string;
  featured?: boolean;
  date?: string;
}

const REVALIDATE = 300;

/** Fallback catalog straight from business.ts so the shop is never empty. */
function catalogFallback(): PublicProduct[] {
  return kits.map((k, i) => ({
    id: `kit-${k.id}`,
    slug: k.id === "innovator" ? "innovator-ai-kit" : `${k.id}-kit`,
    name: k.name,
    category: "Kits",
    kitId: k.id,
    price: k.mrp,
    status: "active",
    grades: k.grades,
    image: k.image,
    short: k.project,
    description: k.description,
    highlights: k.highlights,
    inTheBox: k.inTheBox,
    weightGrams: k.weightGrams,
    sort: i + 1,
  }));
}

export async function getPublicProducts(): Promise<PublicProduct[]> {
  try {
    const rows = await listRecords<BaseRecord & PublicProduct>("products", { revalidate: REVALIDATE });
    const active = rows.filter((p) => p.status === "active" || p.status === "out-of-stock");
    if (!active.length) return catalogFallback();
    return active.sort((a, b) => (Number(a.sort) || 99) - (Number(b.sort) || 99));
  } catch {
    return catalogFallback();
  }
}

export async function getPublicProduct(slug: string) {
  const all = await getPublicProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getPublishedTestimonials(): Promise<PublicTestimonial[]> {
  try {
    const rows = await listRecords<BaseRecord & PublicTestimonial & { published?: boolean; consent?: boolean }>("testimonials", { revalidate: REVALIDATE });
    return rows.filter((t) => t.published).sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  } catch {
    return [];
  }
}

export async function findCertificate(code: string) {
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9-]{6,32}$/.test(clean)) return null;
  try {
    const rows = await listRecords<BaseRecord & { code?: string; status?: string }>("certificates");
    const c = rows.find((r) => String(r.code || "").toUpperCase() === clean);
    if (!c) return null;
    return {
      code: String(c.code),
      studentName: String(c.studentName || ""),
      grade: c.grade ? String(c.grade) : undefined,
      schoolName: c.schoolName ? String(c.schoolName) : undefined,
      program: c.program ? String(c.program) : undefined,
      type: c.type ? String(c.type) : "Participation",
      issueDate: c.issueDate ? String(c.issueDate) : undefined,
      status: String(c.status || "valid"),
    };
  } catch {
    return null;
  }
}
