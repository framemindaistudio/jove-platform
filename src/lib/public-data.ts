import "server-only";
import { listRecords } from "@/lib/hq/records";
import { kits } from "@/lib/content/business";
import type { BaseRecord } from "@/lib/hq/collections";
import { site } from "@/lib/site";

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

/* ── the team on the About page ── */

export interface PublicMember {
  id: string;
  name: string;
  role: string;
  line?: string;
  /** /api/public/team-photo/<id>?v=…, or nothing for initials */
  photo?: string;
}

const ROLE_ORDER = ["Lead Trainer", "Trainer", "Freelance Trainer", "Media / Editor", "Operations", "Intern"];
const isFounder = (name: unknown) => site.founders.some((f) => f.name.toLowerCase() === String(name ?? "").trim().toLowerCase());
const photoUrl = (m: BaseRecord) =>
  typeof m.photo === "string" && m.photo ? `/api/public/team-photo/${encodeURIComponent(m.id)}?v=${encodeURIComponent(String(m.photoUpdatedAt ?? "1").replace(/\D/g, "").slice(-12) || "1")}` : undefined;

/**
 * Everyone in Team & Payroll who agreed to be shown ("Show on the website") and is active, founders aside (they have
 * their own cards). Only the name, role, photo and the one line go out: nothing else from the record.
 */
export async function getPublicTeam(): Promise<PublicMember[]> {
  try {
    const rows = await listRecords("team", { revalidate: REVALIDATE });
    return rows
      .filter((m) => m.showOnWebsite === true && String(m.status ?? "active") === "active" && !isFounder(m.name) && String(m.name ?? "").trim())
      .sort((a, b) => (ROLE_ORDER.indexOf(String(a.role)) + 99) % 99 - ((ROLE_ORDER.indexOf(String(b.role)) + 99) % 99) || String(a.joinDate ?? "").localeCompare(String(b.joinDate ?? "")) || String(a.name).localeCompare(String(b.name)))
      .map((m) => ({ id: m.id, name: String(m.name).trim(), role: String(m.role ?? "Team"), line: typeof m.webLine === "string" && m.webLine.trim() ? m.webLine.trim().slice(0, 110) : undefined, photo: photoUrl(m) }));
  } catch {
    return [];
  }
}

/** A founder's photo from their Team & Payroll record, by founder id ("shivaprasad"), when one is saved. */
export async function getFounderPhotos(): Promise<Record<string, string>> {
  try {
    const rows = await listRecords("team", { revalidate: REVALIDATE });
    const out: Record<string, string> = {};
    for (const f of site.founders) {
      const m = rows.find((r) => String(r.name ?? "").trim().toLowerCase() === f.name.toLowerCase());
      const url = m && photoUrl(m);
      if (url) out[f.id] = url;
    }
    return out;
  } catch {
    return {};
  }
}
