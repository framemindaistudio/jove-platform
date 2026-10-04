import type { MetadataRoute } from "next";
import { labs } from "@/lib/content/labs";
import { getPublicProducts } from "@/lib/public-data";
import { site } from "@/lib/site";

type Entry = MetadataRoute.Sitemap[number];

/** Public, indexable pages. Private areas (/hq, /api, /cart, /verify/<code>) are deliberately left out. */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: Entry["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/programs", priority: 0.9, changeFrequency: "monthly" },
  { path: "/packages", priority: 0.9, changeFrequency: "monthly" },
  { path: "/studio", priority: 0.8, changeFrequency: "monthly" },
  { path: "/labs", priority: 0.8, changeFrequency: "weekly" },
  { path: "/shop", priority: 0.8, changeFrequency: "weekly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.8, changeFrequency: "yearly" },
  { path: "/testimonials", priority: 0.5, changeFrequency: "weekly" },
  { path: "/careers", priority: 0.5, changeFrequency: "monthly" },
  { path: "/verify", priority: 0.3, changeFrequency: "yearly" },
];

const LEGAL_ROUTES = ["/privacy", "/terms", "/refund-policy", "/shipping-policy"];
const LEGAL_UPDATED = new Date("2026-10-02");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url.replace(/\/+$/, "");
  const url = (path: string) => `${base}${path}`;

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: url(r.path || "/"),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  for (const lab of labs) {
    entries.push({ url: url(`/labs/${lab.slug}`), changeFrequency: "monthly", priority: 0.7 });
  }

  try {
    const products = await getPublicProducts();
    for (const p of products) {
      if (!p.slug) continue;
      entries.push({ url: url(`/shop/${encodeURIComponent(p.slug)}`), changeFrequency: "weekly", priority: 0.7 });
    }
  } catch {
    // The catalogue is optional for the sitemap; the static routes above still ship.
  }

  for (const path of LEGAL_ROUTES) {
    entries.push({ url: url(path), lastModified: LEGAL_UPDATED, changeFrequency: "yearly", priority: 0.3 });
  }

  return entries;
}
